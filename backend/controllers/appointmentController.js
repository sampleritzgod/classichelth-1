import mongoose from "mongoose";
import Appointment from "../models/Appointment.js";
import { sendBookingConfirmation, sendAdminAppointmentNotification } from "../services/mailService.js";

/**
 * @desc    Create a new appointment
 * @route   POST /api/v1/appointments
 * @access  Public
 */
export const createAppointment = async (req, res, next) => {
  console.log("[API] Incoming booking request body:", req.body);
  console.log(
    "[Database] MongoDB connection state:",
    mongoose.connection.readyState === 1 ? "Connected (OK)" : "Disconnected (Error)"
  );

  try {
    const { name, email, phone, date, timeSlot, condition, message, service } = req.body;

    // Create and store the appointment in MongoDB
    const appointment = new Appointment({
      name,
      email,
      phone,
      date,
      timeSlot,
      condition,
      message,
      service: service || "General Wellness Consultation",
    });

    await appointment.save();

    console.log("[API] Appointment saved successfully to MongoDB:", appointment._id);

    // Send confirmation email asynchronously (do not block client response)
    sendBookingConfirmation(appointment.email, appointment.name, {
      date: appointment.date,
      time: appointment.timeSlot,
      service: appointment.service,
    }).catch((err) => {
      console.error("✉️ Failed to send email confirmation for appointment:", err.message);
    });

    // Send admin notification email
    sendAdminAppointmentNotification(appointment).catch((err) => {
      console.error("✉️ Failed to send admin notification for appointment:", err.message);
    });

    res.status(201).json({
      success: true,
      message: "Appointment booked successfully",
      data: appointment,
    });
  } catch (error) {
    console.error("[API Error] Failed to save appointment in database:", error.message);
    // If Mongoose validation fails, we set bad request status (400)
    if (error.name === "ValidationError") {
      res.status(400);
    }
    next(error);
  }
};

/**
 * @desc    Get all appointments (just for testing / administration)
 * @route   GET /api/v1/appointments
 * @access  Public
 */
export const getAppointments = async (req, res, next) => {
  try {
    // Fetch all documents from the "appointments" collection
    const appointments = await Appointment.find().sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: appointments.length,
      data: appointments,
    });
  } catch (error) {
    next(error);
  }
};
