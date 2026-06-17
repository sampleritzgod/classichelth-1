import express from "express";
import {
  getAdminAppointments,
  getAdminAppointmentById,
  updateAppointment,
  updateAppointmentStatus,
  sendManualAppointmentEmail,
  deleteAppointment,
  getDashboardStats,
  getAdminMessages,
  markMessageAsRead,
  toggleMessageStarred,
  toggleMessageArchived,
  replyToMessage,
  deleteMessage,
  getCapacityOverrides,
  createOrUpdateCapacityOverride,
  deleteCapacityOverride,
} from "../controllers/adminController.js";
import {
  getAdminBlogs,
  getAdminBlogById,
  createBlog,
  updateBlog,
  deleteBlog,
} from "../controllers/blogController.js";
import { protect, restrictTo } from "../middleware/authMiddleware.js";
import { validateBlog } from "../middleware/validateBlog.js";
import { uploadImage } from "../controllers/uploadController.js";
import { uploadMiddleware } from "../middleware/uploadMiddleware.js";

const router = express.Router();

// Apply auth protection to all administrative routes
router.use(protect);
router.use(restrictTo("admin", "superadmin"));

// Dashboard stats endpoint
router.get("/dashboard/stats", getDashboardStats);

// Image upload endpoint
router.post("/upload", uploadMiddleware, uploadImage);

// Appointment management endpoints
router.route("/appointments")
  .get(getAdminAppointments);

router.route("/appointments/:id")
  .get(getAdminAppointmentById)
  .put(updateAppointment)
  .delete(deleteAppointment);

router.patch("/appointments/:id/status", updateAppointmentStatus);
router.post("/appointments/:id/notify-email", sendManualAppointmentEmail);

// Message inbox management endpoints
router.route("/messages")
  .get(getAdminMessages);

router.route("/messages/:id")
  .delete(deleteMessage);

router.patch("/messages/:id/read", markMessageAsRead);
router.patch("/messages/:id/star", toggleMessageStarred);
router.patch("/messages/:id/archive", toggleMessageArchived);
router.post("/messages/:id/reply", replyToMessage);

// Blog management endpoints
router.route("/blogs")
  .get(getAdminBlogs)
  .post(validateBlog, createBlog);

router.route("/blogs/:id")
  .get(getAdminBlogById)
  .put(validateBlog, updateBlog)
  .delete(deleteBlog);

// Capacity overrides endpoints
router.route("/capacity")
  .get(getCapacityOverrides)
  .post(createOrUpdateCapacityOverride);

router.delete("/capacity/:id", deleteCapacityOverride);

export default router;
