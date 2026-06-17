import express from "express";
import {
  createAppointment,
  getAppointments,
  getMyAppointments,
  getAppointmentTimeline,
  checkSlots,
} from "../controllers/appointmentController.js";
import { validateAppointment } from "../middleware/validateAppointment.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// Real-time slot availability check
router.get("/appointments/check-slots", checkSlots);

// User own appointments and timeline
router.get("/appointments/my", protect, getMyAppointments);
router.get("/appointments/:id/timeline", protect, getAppointmentTimeline);

// POST /api/v1/appointments - Create an appointment
// GET /api/v1/appointments - Get all appointments
router.route("/appointments")
  .post(protect, validateAppointment, createAppointment)
  .get(getAppointments);

export default router;
