import mongoose from "mongoose";
import dotenv from "dotenv";
import connectDB from "../config/db.js";
import User from "../models/User.js";
import Appointment from "../models/Appointment.js";
import Notification from "../models/Notification.js";
import { initNotificationService } from "../services/notificationService.js";
import { sendAutomatedReminders } from "../services/reminderScheduler.js";

// Load environment variables
dotenv.config();

const runTest = async () => {
  try {
    // 1. Connect to Database & initialize notification service listeners
    await connectDB();
    initNotificationService();

    console.log("--------------------------------------------------");
    console.log("🧪 STARTING MULTI-CHANNEL NOTIFICATION SYSTEM TEST");
    console.log("--------------------------------------------------");

    // Clean up any old test user/appointments/notifications
    await Appointment.deleteMany({ email: "test_notify@example.com" });
    await Notification.deleteMany({});
    await User.deleteMany({ email: "test_notify@example.com" });

    // 2. Create a test user with a mock FCM token
    console.log("👤 Creating test user with mock FCM token...");
    const testUser = new User({
      name: "Notification Test User",
      email: "test_notify@example.com",
      password: "password123",
      role: "user",
      fcmTokens: ["mock_fcm_token_12345"]
    });
    await testUser.save();
    console.log("✅ User created successfully!");

    const now = new Date();

    // 3. Create appointment scheduled for tomorrow (in 24 hours)
    console.log("📅 Scheduling tomorrow's appointment (24h reminder target)...");
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    
    // We want the timeSlot to match tomorrow's hour
    let hours = tomorrow.getHours();
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'
    const minutes = String(tomorrow.getMinutes()).padStart(2, "0");
    const timeSlotTomorrow = `${hours}:${minutes} ${ampm}`;

    const appTomorrow = new Appointment({
      user: testUser._id,
      name: testUser.name,
      email: testUser.email,
      phone: "9999999999",
      date: tomorrow,
      timeSlot: timeSlotTomorrow,
      service: "Therapeutic Massage",
      status: "confirmed",
      slotIndex: 0
    });
    await appTomorrow.save();
    console.log(`Saved tomorrow appointment: ID = ${appTomorrow.appointmentId}, Time = ${timeSlotTomorrow}`);

    // 4. Create appointment scheduled for soon (in 1 hour)
    console.log("📅 Scheduling soon appointment (1h reminder target)...");
    const soon = new Date(now.getTime() + 60 * 60 * 1000);
    
    let hoursSoon = soon.getHours();
    const ampmSoon = hoursSoon >= 12 ? "PM" : "AM";
    hoursSoon = hoursSoon % 12;
    hoursSoon = hoursSoon ? hoursSoon : 12;
    const minutesSoon = String(soon.getMinutes()).padStart(2, "0");
    const timeSlotSoon = `${hoursSoon}:${minutesSoon} ${ampmSoon}`;

    const appSoon = new Appointment({
      user: testUser._id,
      name: testUser.name,
      email: testUser.email,
      phone: "9999999999",
      date: soon,
      timeSlot: timeSlotSoon,
      service: "Ayurvedic Consultation (Online)",
      status: "confirmed",
      slotIndex: 1
    });
    await appSoon.save();
    console.log(`Saved soon appointment: ID = ${appSoon.appointmentId}, Time = ${timeSlotSoon}`);

    // 5. Trigger reminder sweep
    console.log("\n⏰ Triggering reminder sweep loop...");
    await sendAutomatedReminders();

    // 6. Give async queue and listeners 2 seconds to complete processing
    console.log("\n⏳ Waiting 2 seconds for queue service worker to process enqueued tasks...");
    await new Promise(resolve => setTimeout(resolve, 2000));

    // 7. Verify database notifications are logged for the user
    console.log("\n🔍 Verifying in-app notifications in database...");
    const dbNotifs = await Notification.find({ user: testUser._id });
    console.log(`Found ${dbNotifs.length} database notifications for the user:`);
    dbNotifs.forEach(n => {
      console.log(` - [${n.type.toUpperCase()}] Title: "${n.title}", Msg: "${n.message}", IsRead: ${n.isRead}`);
    });

    if (dbNotifs.length < 2) {
      throw new Error(`Expected at least 2 database notifications, but got ${dbNotifs.length}`);
    }
    console.log("✅ Database notifications successfully created!");

    // 8. Clean up
    console.log("\n🧹 Cleaning up test data...");
    await Appointment.deleteMany({ email: "test_notify@example.com" });
    await Notification.deleteMany({ user: testUser._id });
    await User.deleteMany({ email: "test_notify@example.com" });
    console.log("✅ Cleaned up successfully!");

    console.log("\n--------------------------------------------------");
    console.log("🎉 NOTIFICATION FLOWS & SWEEPS VERIFIED SUCCESSFULLY!");
    console.log("--------------------------------------------------");
    process.exit(0);

  } catch (err) {
    console.error("❌ Test failed with exception:", err);
    process.exit(1);
  }
};

runTest();
