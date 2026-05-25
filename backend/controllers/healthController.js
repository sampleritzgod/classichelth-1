import mongoose from "mongoose";

/**
 * @desc    Get API health status
 * @route   GET /api/v1/health
 * @access  Public
 */
export const getHealth = async (req, res, next) => {
  try {
    const dbStates = {
      0: "disconnected",
      1: "connected",
      2: "connecting",
      3: "disconnecting",
    };

    const dbStatus = mongoose.connection.readyState;
    const dbStateString = dbStates[dbStatus] || "unknown";

    res.status(200).json({
      success: true,
      timestamp: new Date().toISOString(),
      uptime: `${process.uptime().toFixed(2)}s`,
      server: {
        status: "up",
        env: process.env.NODE_ENV || "development",
      },
      database: {
        status: dbStateString,
        connected: dbStatus === 1,
      },
    });
  } catch (error) {
    // Pass error to global error handler
    next(error);
  }
};
