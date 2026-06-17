import mongoose from "mongoose";
import Appointment from "../models/Appointment.js";
import { sendBookingConfirmation, sendAdminAppointmentNotification } from "../services/mailService.js";

/**
 * @desc    Create a new appointment
 * @route   POST /api/v1/appointments
 * @access  Public
 */
export const createAppointment = async (req, res, next) => {
  try {
    const { name, email, phone, date, timeSlot, condition, message, service } = req.body;

    // Create and store the appointment in MongoDB
    const appointment = new Appointment({
      user: req.user?._id,
      name,
      email,
      phone,
      date,
      timeSlot,
      condition,
      message,
      service: service || "General Wellness Consultation",
      status: "pending",
      statusHistory: [
        {
          status: "pending",
          statusMessage: "Appointment request submitted.",
          changedAt: new Date(),
        },
      ],
    });

    await appointment.save();

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

/**
 * @desc    Get authenticated user's appointments
 * @route   GET /api/v1/appointments/my
 * @access  Private
 */
export const getMyAppointments = async (req, res, next) => {
  try {
    const appointments = await Appointment.find({ user: req.user._id }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: appointments.length,
      data: appointments,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get appointment status timeline
 * @route   GET /api/v1/appointments/:id/timeline
 * @access  Private
 */
export const getAppointmentTimeline = async (req, res, next) => {
  try {
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found",
      });
    }

    // Ensure the requester owns the appointment or is an admin
    if (appointment.user && appointment.user.toString() !== req.user._id.toString() && req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Not authorized to access this timeline",
      });
    }

    res.status(200).json({
      success: true,
      data: appointment.statusHistory,
    });
  } catch (error) {
    next(error);
  }
};
