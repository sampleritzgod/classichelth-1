import express from "express";
import {
  getAdminAppointments,
  getAdminAppointmentById,
  updateAppointmentStatus,
  deleteAppointment,
  getDashboardStats,
  getAdminMessages,
  markMessageAsRead,
  deleteMessage,
} from "../controllers/adminController.js";
import { protect, restrictTo } from "../middleware/authMiddleware.js";

const router = express.Router();

// Apply auth protection to all administrative routes
router.use(protect);
router.use(restrictTo("admin"));

// Dashboard stats endpoint
router.get("/dashboard/stats", getDashboardStats);

// Appointment management endpoints
router.route("/appointments")
  .get(getAdminAppointments);

router.route("/appointments/:id")
  .get(getAdminAppointmentById)
  .delete(deleteAppointment);

router.patch("/appointments/:id/status", updateAppointmentStatus);

// Message inbox management endpoints
router.route("/messages")
  .get(getAdminMessages);

router.route("/messages/:id")
  .delete(deleteMessage);

router.patch("/messages/:id/read", markMessageAsRead);

export default router;
