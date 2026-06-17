import express from "express";
import {
  createAppointment,
  getAppointments,
  getMyAppointments,
  getAppointmentTimeline,
  checkSlots,
} from "../controllers/appointmentController.js";
import { validateAppointment } from "../middleware/validateAppointment.js";
import { protect, restrictTo } from "../middleware/authMiddleware.js";

const router = express.Router();

// Real-time slot availability check
router.get("/appointments/check-slots", checkSlots);

// User own appointments and timeline
router.get("/appointments/my", protect, getMyAppointments);
router.get("/appointments/:id/timeline", protect, getAppointmentTimeline);

// POST /api/v1/appointments - Create an appointment (authenticated users)
// GET  /api/v1/appointments - List all appointments (admins only; contains PII)
router.route("/appointments")
  .post(protect, validateAppointment, createAppointment)
  .get(protect, restrictTo("admin", "superadmin"), getAppointments);

export default router;
