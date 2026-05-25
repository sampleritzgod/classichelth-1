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

// Enable CORS
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "*",
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    credentials: true,
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
