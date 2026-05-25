import mongoose from "mongoose";

/**
 * Establishes connection to MongoDB Atlas or Local MongoDB.
 */
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`[Database] MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`[Database Error] Connection failed: ${error.message}`);
    // Exit process with failure code
    process.exit(1);
  }
};

export default connectDB;
