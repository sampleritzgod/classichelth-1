import mongoose from "mongoose";
import Appointment from "../models/Appointment.js";
import { appointmentEvents } from "../services/eventService.js";
import { checkSlotAvailability, findAlternativeSlots, STANDARD_SLOTS } from "../services/schedulingService.js";

/**
 * @desc    Create a new appointment
 * @route   POST /api/v1/appointments
 * @access  Public
 */
export const createAppointment = async (req, res, next) => {
  try {
    const { name, email, phone, date, timeSlot, condition, message, service } = req.body;
    const targetService = service || "General Wellness Consultation";

    // Retry loop for concurrency collisions
    let attempts = 0;
    let savedAppointment = null;
    let alternatives = [];

    while (attempts < 3) {
      // 1. Check availability and get a free slotIndex
      const availability = await checkSlotAvailability(date, timeSlot, targetService);

      if (!availability.available) {
        // Slot is full, break to look up alternatives
        break;
      }

      // 2. Create the appointment in confirmed state with slotIndex
      const appointment = new Appointment({
        user: req.user?._id,
        name,
        email,
        phone,
        date,
        timeSlot,
        condition,
        message,
        service: targetService,
        status: "confirmed", // Instant confirmation
        slotIndex: availability.slotIndex,
        statusHistory: [
          {
            status: "confirmed",
            statusMessage: "Appointment automatically booked and confirmed.",
            changedAt: new Date(),
          },
        ],
      });

      try {
        await appointment.save();
        savedAppointment = appointment;
        break; // Successfully saved, break the retry loop
      } catch (saveError) {
        // Check for MongoDB duplicate key error (code 11000) on the slotIndex unique index
        if (saveError.code === 11000 && (saveError.message.includes("slotIndex") || JSON.stringify(saveError.keyValue || {}).includes("slotIndex"))) {
          console.warn(`[Concurrency Collision] Slot collision detected for ${date} ${timeSlot} at index ${availability.slotIndex}. Retrying...`);
          attempts++;
        } else {
          // Some other validation or DB error, throw it
          throw saveError;
        }
      }
    }

    if (!savedAppointment) {
      // Fetch alternative slots
      alternatives = await findAlternativeSlots(date, timeSlot, targetService);

      return res.status(400).json({
        success: false,
        reason: "slot_unavailable",
        message: "The requested time slot is fully booked. Please choose an alternative slot.",
        alternatives,
      });
    }

    // 3. Emit event so listeners can dispatch notification/live-updates asynchronously
    appointmentEvents.emit("appointment.created", savedAppointment);

    res.status(201).json({
      success: true,
      message: "Appointment booked successfully",
      data: savedAppointment,
    });
  } catch (error) {
    console.error("[API Error] Failed to save appointment in database:", error.message);
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
    const appointments = await Appointment.find().sort({ createdAt: -1 }).lean();

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
    const appointments = await Appointment.find({ user: req.user._id }).sort({ createdAt: -1 }).lean();

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

    // Authorize: admins/superadmins can view any timeline; otherwise the
    // requester must own the appointment. Guest/unlinked appointments
    // (appointment.user is null) are never exposed to non-admins, preventing
    // an IDOR where any authenticated user could read others' timelines.
    const isAdmin = req.user.role === "admin" || req.user.role === "superadmin";
    const ownsAppointment =
      appointment.user && appointment.user.toString() === req.user._id.toString();

    if (!isAdmin && !ownsAppointment) {
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

/**
 * @desc    Check slot availability for a given date
 * @route   GET /api/v1/appointments/check-slots
 * @access  Public
 */
export const checkSlots = async (req, res, next) => {
  try {
    const { date, service } = req.query;

    if (!date) {
      return res.status(400).json({
        success: false,
        message: "Please provide a date query parameter (YYYY-MM-DD)",
      });
    }

    const targetDate = new Date(date);
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    const targetService = service || "all";
    const ACTIVE_STATUSES = ["pending", "under_review", "confirmed", "rescheduled", "completed"];

    // Fetch the day's active appointments once and count per slot in memory,
    // instead of issuing a countDocuments query per slot (removes N+1).
    const [dayAppointments, ...availabilities] = await Promise.all([
      Appointment.find({
        date: { $gte: startOfDay, $lte: endOfDay },
        status: { $in: ACTIVE_STATUSES },
      })
        .select("timeSlot")
        .lean(),
      ...STANDARD_SLOTS.map((slot) =>
        checkSlotAvailability(targetDate, slot, targetService)
      ),
    ]);

    const bookedCounts = dayAppointments.reduce((acc, appt) => {
      acc[appt.timeSlot] = (acc[appt.timeSlot] || 0) + 1;
      return acc;
    }, {});

    const slotStatus = STANDARD_SLOTS.map((slot, i) => ({
      timeSlot: slot,
      capacity: availabilities[i].capacity,
      bookedCount: bookedCounts[slot] || 0,
      available: availabilities[i].available,
    }));

    res.status(200).json({
      success: true,
      data: slotStatus,
    });
  } catch (error) {
    next(error);
  }
};
