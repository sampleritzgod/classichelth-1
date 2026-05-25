import mongoose from "mongoose";

/**
 * Establishes connection to MongoDB Atlas or Local MongoDB.
 */
const connectDB = async () => {
  try {
    // Database connection lifecycle listeners
    mongoose.connection.on("connected", () => {
      console.log("[Database] Mongoose active connection established");
    });

    mongoose.connection.on("error", (err) => {
      console.error(`[Database Error] Mongoose runtime connection error: ${err.message}`);
    });

    mongoose.connection.on("disconnected", () => {
      console.warn("[Database Warning] Mongoose disconnected from cluster. Attempting reconnect...");
    });

    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`[Database] Initial connection successful to host: ${conn.connection.host}`);
  } catch (error) {
    console.error(`[Database Error] Initial connection failed: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;
