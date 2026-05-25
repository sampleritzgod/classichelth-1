import express from "express";
import {
  createAppointment,
  getAppointments,
} from "../controllers/appointmentController.js";
import { validateAppointment } from "../middleware/validateAppointment.js";

const router = express.Router();

// POST /api/v1/appointments - Create an appointment
// GET /api/v1/appointments - Get all appointments
router.route("/appointments")
  .post(validateAppointment, createAppointment)
  .get(getAppointments);

export default router;
