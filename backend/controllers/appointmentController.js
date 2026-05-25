import Appointment from "../models/Appointment.js";

/**
 * @desc    Create a new appointment
 * @route   POST /api/v1/appointments
 * @access  Public
 */
export const createAppointment = async (req, res, next) => {
  try {
    const { name, email, phone, date, timeSlot, condition, message } = req.body;

    // Create and store the appointment in MongoDB
    // Mongoose validates fields based on the Appointment Schema definition
    const appointment = await Appointment.create({
      name,
      email,
      phone,
      date,
      timeSlot,
      condition,
      message,
    });

    res.status(201).json({
      success: true,
      message: "Appointment created successfully!",
      data: appointment,
    });
  } catch (error) {
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
