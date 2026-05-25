import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import connectDB from "./config/db.js";
import healthRoutes from "./routes/healthRoutes.js";
import appointmentRoutes from "./routes/appointmentRoutes.js";
import notFound from "./middleware/notFound.js";
import errorHandler from "./middleware/errorHandler.js";

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
      
      // Check if the origin matches any of our allowed domains
      const isAllowed = allowedOrigins.some((allowedOpt) => {
        const cleanAllowed = allowedOpt.trim().replace(/\/$/, "");
        const cleanOrigin = origin.trim().replace(/\/$/, "");
        return cleanAllowed === cleanOrigin;
      });

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

// Body parsing middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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

// Error Handling Middlewares
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(
    `[Server] Running in ${process.env.NODE_ENV || "development"} mode on http://localhost:${PORT}`
  );
});

// Handle unhandled promise rejections
process.on("unhandledRejection", (err, promise) => {
  console.error(`[Server Error] Unhandled Rejection: ${err.message}`);
  // Close server & exit process
  server.close(() => process.exit(1));
});
