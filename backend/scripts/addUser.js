import mongoose from "mongoose";
import dotenv from "dotenv";
import connectDB from "../config/db.js";
import User from "../models/User.js";

// Load environment variables
dotenv.config();

const addUser = async () => {
  const args = process.argv.slice(2);
  if (args.length < 2) {
    console.log("Usage: node backend/scripts/addUser.js <email> <password> [role]");
    console.log("Roles can be: admin, practitioner (defaults to admin)");
    process.exit(1);
  }

  const email = args[0].trim().toLowerCase();
  const password = args[1];
  const role = args[2] || "admin";

  if (!["admin", "practitioner"].includes(role)) {
    console.error("Error: Invalid role. Must be 'admin' or 'practitioner'.");
    process.exit(1);
  }

  try {
    console.log("[User Tool] Connecting to database...");
    await connectDB();

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log(`[User Tool] Error: User with email '${email}' already exists.`);
      process.exit(1);
    }

    const newUser = new User({
      email,
      password,
      role
    });

    await newUser.save();
    console.log(`[User Tool] Successfully created user!`);
    console.log(`- Email: ${email}`);
    console.log(`- Role: ${role}`);
    console.log(`- Password: (as specified)`);
    process.exit(0);
  } catch (error) {
    console.error("[User Tool Error] Failed to create user:", error.message);
    process.exit(1);
  }
};

addUser();
