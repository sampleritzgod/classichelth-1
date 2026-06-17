import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import fs from "fs";
import connectDB from "./config/db.js";
import healthRoutes from "./routes/healthRoutes.js";
import appointmentRoutes from "./routes/appointmentRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import messageRoutes from "./routes/messageRoutes.js";
import blogRoutes from "./routes/blogRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import notFound from "./middleware/notFound.js";
import errorHandler from "./middleware/errorHandler.js";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import { createServer } from "http";
import { initSocket } from "./services/socketService.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import { initNotificationService } from "./services/notificationService.js";
import { initScheduler } from "./services/reminderScheduler.js";
import { verifyMailTransport } from "./services/mailService.js";

// Load environment variables
dotenv.config();

// Fail fast on missing critical secrets to avoid running with insecure defaults
if (!process.env.JWT_SECRET) {
  console.error(
    "[Server] FATAL: JWT_SECRET is not set. Refusing to start with an insecure default."
  );
  process.exit(1);
}

// Connect to Database
connectDB();

// Ensure uploads directory exists
if (!fs.existsSync("./uploads")) {
  fs.mkdirSync("./uploads", { recursive: true });
}

const app = express();

// Trust the reverse proxy (Render/Vercel/nginx) so req.ip and rate limiting
// reflect the real client address rather than the proxy hop.
app.set("trust proxy", 1);

// Request logging middleware
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
} else {
  app.use(morgan("combined"));
}

// Security headers middleware
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);

// Expose static uploads folder
app.use("/uploads", express.static("uploads"));

// Enable CORS (supports multiple origins and credentials)
const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(",")
  : ["http://localhost:3000", "http://localhost:3000/"]; // Fallback development origins

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, postman, or curl)
      if (!origin) return callback(null, true);
      
      const isProd = process.env.NODE_ENV === "production";

      // Exact match against the explicitly allowed origins (CORS_ORIGIN).
      const matchesAllowList = allowedOrigins.some((allowedOpt) => {
        const cleanAllowed = allowedOpt.trim().replace(/\/$/, "");
        const cleanOrigin = origin.trim().replace(/\/$/, "");
        return cleanAllowed === cleanOrigin;
      });

      // Outside production, also allow local development hosts for convenience.
      // In production we ONLY trust the explicit allow-list (no wildcard
      // *.vercel.app / localhost bypass).
      const isLocalDevOrigin =
        !isProd &&
        (origin.includes("localhost") || origin.includes("127.0.0.1"));

      const isAllowed = matchesAllowList || isLocalDevOrigin;

      if (isAllowed) {
        return callback(null, true);
      } else {
        return callback(new Error(`Not allowed by CORS from origin: ${origin}`), false);
      }
    },
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    credentials: true,
    optionsSuccessStatus: 200, // Some legacy browsers (IE11, various SmartTVs) choke on 204
  })
);

// Cookie parser middleware
app.use(cookieParser());

// Body parsing middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Strict rate limiting for login to mitigate credential stuffing / brute force
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 login attempts per windowMs
  message: {
    success: false,
    message: "Too many login attempts from this IP, please try again after 15 minutes",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Moderate rate limiting for account creation
const signupLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // Limit each IP to 20 signups per hour
  message: {
    success: false,
    message: "Too many accounts created from this IP, please try again later",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Applied to the single canonical auth mount (see route registration below)
app.use("/api/v1/auth/login", loginLimiter);
app.use("/api/v1/auth/google", loginLimiter);
app.use("/api/v1/auth/signup", signupLimiter);

// Rate limiting for contact form and payment creation to prevent script abuse
const formAndPaymentLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // Limit each IP to 30 requests per windowMs
  message: {
    success: false,
    message: "Too many requests from this IP, please try again after 15 minutes",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use("/api/v1/messages", formAndPaymentLimiter);
app.use("/api/v1/payments/create-order", formAndPaymentLimiter);
app.use("/api/v1/payments/verify", formAndPaymentLimiter);

// Welcome page / Root Endpoint
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Welcome to U 1st Creation Wellness Clinic REST API",
    documentation: "/api/v1/health",
  });
});

// API Routes
app.use("/api/v1", healthRoutes);
app.use("/api/v1", appointmentRoutes);
app.use("/api/v1/admin", adminRoutes);
app.use("/api/v1", productRoutes);
app.use("/api/v1", messageRoutes);
app.use("/api/v1", blogRoutes);
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/payments", paymentRoutes);
app.use("/api/v1/notifications", notificationRoutes);

// Error Handling Middlewares
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const server = createServer(app);

// Initialize Socket.IO
initSocket(server, allowedOrigins);

// Initialize automated notification event listeners and reminder loops
initNotificationService();
initScheduler();

// Verify SMTP connectivity at startup so email misconfiguration is loud, not silent
verifyMailTransport();

server.listen(PORT, () => {
  console.log(
    `[Server] Running in ${process.env.NODE_ENV || "development"} mode on http://localhost:${PORT}`
  );
});

// Handle uncaught exceptions
process.on("uncaughtException", (err) => {
  console.error(`[Server Error] Uncaught Exception: ${err.message}`);
  console.error(err.stack);
  // Exit process
  process.exit(1);
});

// Handle unhandled promise rejections
process.on("unhandledRejection", (err, promise) => {
  console.error(`[Server Error] Unhandled Rejection: ${err.message}`);
  // Close server & exit process
  server.close(() => process.exit(1));
});
