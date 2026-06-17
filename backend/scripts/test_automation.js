import mongoose from "mongoose";
import dotenv from "dotenv";
import connectDB from "../config/db.js";
import Appointment from "../models/Appointment.js";
import BookingCapacity from "../models/BookingCapacity.js";
import { checkSlotAvailability, findAlternativeSlots } from "../services/schedulingService.js";

// Load environment variables
dotenv.config();

const runTest = async () => {
  try {
    // 1. Connect to Database
    await connectDB();

    console.log("⚙️ Rebuilding database indexes for Appointment model...");
    try {
      await Appointment.cleanIndexes();
      await Appointment.createIndexes();
      console.log("✅ Indexes synchronized successfully.");
    } catch (idxErr) {
      console.error("❌ Failed to rebuild indexes:", idxErr.message);
    }

    console.log("--------------------------------------------------");
    console.log("🧪 STARTING COMPREHENSIVE APPOINTMENT AUTOMATION TEST");
    console.log("--------------------------------------------------");

    const testDate = new Date("2026-06-20");
    testDate.setHours(0, 0, 0, 0);
    const timeSlot = "11:00 AM";
    const service = "Ayurvedic Consultation (Online)";

    // Clean up existing test data
    console.log("🧹 Cleaning up old test data...");
    await Appointment.deleteMany({ date: testDate });
    await BookingCapacity.deleteMany({ date: testDate });

    // 2. Test Capacity Resolving and Overrides
    console.log("⚙️ Setting capacity override for 2026-06-20 11:00 AM to 2...");
    await BookingCapacity.create({
      service: "all",
      date: testDate,
      timeSlot,
      capacity: 2,
    });

    // Verify availability check for first slot
    console.log("🔍 Checking slot availability...");
    let avail = await checkSlotAvailability(testDate, timeSlot, service);
    console.log(`Slot available: ${avail.available}, slotIndex resolved: ${avail.slotIndex}`);
    if (!avail.available || avail.slotIndex !== 0) {
      throw new Error("Initial slot check failed! Index should be 0.");
    }

    // 3. Test Booking Success & Unique Code Generation
    console.log("📝 Creating first booking (Mock Request)...");
    const app1 = new Appointment({
      name: "Test User 1",
      email: "test1@example.com",
      phone: "9999999999",
      date: testDate,
      timeSlot,
      service,
      status: "confirmed",
      slotIndex: avail.slotIndex,
    });
    await app1.save();
    console.log(`Booking 1 saved! ID: ${app1.appointmentId}, slotIndex: ${app1.slotIndex}`);

    // Verify next slot index
    avail = await checkSlotAvailability(testDate, timeSlot, service);
    console.log(`Slot available: ${avail.available}, slotIndex resolved: ${avail.slotIndex}`);
    if (!avail.available || avail.slotIndex !== 1) {
      throw new Error("Second slot check failed! Index should be 1.");
    }

    // Save second booking
    const app2 = new Appointment({
      name: "Test User 2",
      email: "test2@example.com",
      phone: "9999999998",
      date: testDate,
      timeSlot,
      service,
      status: "confirmed",
      slotIndex: avail.slotIndex,
    });
    await app2.save();
    console.log(`Booking 2 saved! ID: ${app2.appointmentId}, slotIndex: ${app2.slotIndex}`);

    // Verify third slot is full
    avail = await checkSlotAvailability(testDate, timeSlot, service);
    console.log(`Slot available: ${avail.available} (Expected: false)`);
    if (avail.available) {
      throw new Error("Slot should be full but was marked available!");
    }

    // 4. Test Concurrency Protection (Unique Constraint)
    console.log("🛡️ Testing unique index constraint by trying to force another booking on index 1...");
    
    // Indexes are synchronized on startup

    const appDuplicate = new Appointment({
      name: "Duplicator",
      email: "dup@example.com",
      phone: "9999999997",
      date: testDate,
      timeSlot,
      service,
      status: "confirmed",
      slotIndex: 1,
    });

    try {
      await appDuplicate.save();
      throw new Error("CRITICAL FAILURE: Duplicate slot index was saved!");
    } catch (err) {
      if (err.code === 11000) {
        console.log("✅ Concurrency Lock Successful: MongoDB unique index blocked double-booking with duplicate key error.");
      } else {
        throw err;
      }
    }

    // 5. Test Alternative Suggestions
    console.log("💡 Testing alternative slot suggestions...");
    const alternatives = await findAlternativeSlots(testDate, timeSlot, service);
    console.log("Suggestions found:", alternatives);
    if (alternatives.length === 0) {
      throw new Error("Failed to suggest alternative slots!");
    }
    console.log("✅ Alternative suggestions engine working correctly.");

    console.log("\n--------------------------------------------------");
    console.log("🎉 ALL TESTS PASSED SUCCESSFULLY!");
    console.log("--------------------------------------------------");

    // Clean up test data
    console.log("🧹 Cleaning up test data...");
    await Appointment.deleteMany({ date: testDate });
    await BookingCapacity.deleteMany({ date: testDate });

    process.exit(0);
  } catch (error) {
    console.error("❌ Test failed with error:", error);
    process.exit(1);
  }
};

runTest();
