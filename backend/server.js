import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
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

// Load environment variables
dotenv.config();

// Connect to Database
connectDB();

const app = express();

// Request logging middleware
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
} else {
  app.use(morgan("combined"));
}

// Security headers middleware
app.use(helmet());

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
      
      // Check if the origin matches any of our allowed domains
      const isAllowed = allowedOrigins.some((allowedOpt) => {
        const cleanAllowed = allowedOpt.trim().replace(/\/$/, "");
        const cleanOrigin = origin.trim().replace(/\/$/, "");
        return cleanAllowed === cleanOrigin;
      }) || (!isProd && (origin.includes("localhost") || origin.includes("127.0.0.1")));

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

// Rate limiting for auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: "Too many requests from this IP, please try again after 15 minutes",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use("/api/v1/auth/login", authLimiter);
app.use("/api/v1/auth/signup", authLimiter);

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

// Error Handling Middlewares
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
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
