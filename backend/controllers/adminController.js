import Appointment from "../models/Appointment.js";
import Message from "../models/Message.js";
import Notification from "../models/Notification.js";
import BookingCapacity from "../models/BookingCapacity.js";
import { notifyUser } from "../services/socketService.js";
import {
  sendInquiryReply,
  sendBookingConfirmation,
  sendBookingStatusUpdate,
} from "../services/mailService.js";

/**
 * @desc    Get all appointments (with optional search, status filtering, and sorting)
 * @route   GET /api/v1/admin/appointments
 * @access  Private (Admin)
 */
export const getAdminAppointments = async (req, res, next) => {
  try {
    const { search, status, sort } = req.query;
    const query = {};

    // 1. Filter by status
    if (status && status !== "all") {
      query.status = status;
    }

    // 2. Search query (name, email, phone, condition)
    if (search) {
      const searchRegex = new RegExp(search, "i");
      query.$or = [
        { name: searchRegex },
        { email: searchRegex },
        { phone: searchRegex },
        { condition: searchRegex },
      ];
    }

    // 3. Sorting (default: newest first by createdAt)
    let sortBy = { createdAt: -1 };
    if (sort === "oldest") {
      sortBy = { createdAt: 1 };
    } else if (sort === "dateAsc") {
      sortBy = { date: 1 };
    } else if (sort === "dateDesc") {
      sortBy = { date: -1 };
    }

    const appointments = await Appointment.find(query).sort(sortBy);

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
 * @desc    Get single appointment
 * @route   GET /api/v1/admin/appointments/:id
 * @access  Private (Admin)
 */
export const getAdminAppointmentById = async (req, res, next) => {
  try {
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found",
      });
    }

    res.status(200).json({
      success: true,
      data: appointment,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update appointment status
 * @route   PATCH /api/v1/admin/appointments/:id/status
 * @access  Private (Admin)
 */
export const updateAppointmentStatus = async (req, res, next) => {
  try {
    const { status, statusMessage, date, timeSlot } = req.body;
    const validStatuses = ["pending", "under_review", "confirmed", "rescheduled", "completed", "cancelled"];

    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Please provide a valid status: ${validStatuses.join(", ")}`,
      });
    }

    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found",
      });
    }

    const statusChanged = appointment.status !== status;
    appointment.status = status;
    
    if (statusMessage !== undefined) {
      appointment.statusMessage = statusMessage;
    }
    
    if (status === "rescheduled" || date || timeSlot) {
      if (date) appointment.date = date;
      if (timeSlot) appointment.timeSlot = timeSlot;
    }

    // Push transition to statusHistory
    appointment.statusHistory.push({
      status,
      statusMessage: statusMessage || `Status updated to ${status.replace("_", " ")}`,
      changedAt: new Date(),
    });

    await appointment.save();

    if (statusChanged) {
      // Trigger status update email (doesn't block the API response)
      sendBookingStatusUpdate(appointment.email, appointment.name, {
        date: appointment.date,
        time: appointment.timeSlot,
        service: appointment.service,
        status: appointment.status,
      }).catch((err) => {
        console.error("Failed to send status update email:", err.message);
      });
    }

    // Create Notification and trigger Socket.IO notification if user is associated
    if (appointment.user) {
      const displayStatus = status.replace("_", " ").toUpperCase();
      await Notification.create({
        user: appointment.user,
        appointment: appointment._id,
        type: "status_update",
        title: `Appointment Status: ${displayStatus}`,
        message: statusMessage || `Your appointment status has been updated to ${status.replace("_", " ")}.`,
      });

      // Notify user of appointment update
      notifyUser(appointment.user.toString(), "appointment_updated", {
        appointmentId: appointment._id,
        status,
        statusMessage,
        date: appointment.date,
        timeSlot: appointment.timeSlot,
      });

      // Notify user of new notification count
      const unreadCount = await Notification.countDocuments({ user: appointment.user, isRead: false });
      notifyUser(appointment.user.toString(), "notifications_updated", {
        unreadCount,
      });
    }

    res.status(200).json({
      success: true,
      message: `Appointment status updated to ${status}`,
      data: appointment,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update appointment details (including notes, service, status, date, timeSlot)
 * @route   PUT /api/v1/admin/appointments/:id
 * @access  Private (Admin)
 */
export const updateAppointment = async (req, res, next) => {
  try {
    const { name, email, phone, date, timeSlot, condition, message, status, service, notes, statusMessage } = req.body;

    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found",
      });
    }

    const oldStatus = appointment.status;

    // Update fields if provided
    if (name !== undefined) appointment.name = name;
    if (email !== undefined) appointment.email = email;
    if (phone !== undefined) appointment.phone = phone;
    if (date !== undefined) appointment.date = date;
    if (timeSlot !== undefined) appointment.timeSlot = timeSlot;
    if (condition !== undefined) appointment.condition = condition;
    if (message !== undefined) appointment.message = message;
    if (status !== undefined) appointment.status = status;
    if (service !== undefined) appointment.service = service;
    if (notes !== undefined) appointment.notes = notes;
    if (statusMessage !== undefined) appointment.statusMessage = statusMessage;

    const statusChanged = status !== undefined && oldStatus !== status;

    if (statusChanged || statusMessage !== undefined) {
      appointment.statusHistory.push({
        status: status || appointment.status,
        statusMessage: statusMessage || `Details updated`,
        changedAt: new Date(),
      });
    }

    await appointment.save();

    if (statusChanged) {
      sendBookingStatusUpdate(appointment.email, appointment.name, {
        date: appointment.date,
        time: appointment.timeSlot,
        service: appointment.service,
        status: appointment.status,
      }).catch((err) => {
        console.error("Failed to send status update email on PUT:", err.message);
      });

      // Create Notification and trigger Socket.IO notification if user is associated
      if (appointment.user) {
        const displayStatus = appointment.status.replace("_", " ").toUpperCase();
        await Notification.create({
          user: appointment.user,
          appointment: appointment._id,
          type: "status_update",
          title: `Appointment Status: ${displayStatus}`,
          message: statusMessage || `Your appointment status has been updated to ${appointment.status.replace("_", " ")}.`,
        });

        // Notify user of appointment update
        notifyUser(appointment.user.toString(), "appointment_updated", {
          appointmentId: appointment._id,
          status: appointment.status,
          statusMessage: appointment.statusMessage,
          date: appointment.date,
          timeSlot: appointment.timeSlot,
        });

        // Notify user of new notification count
        const unreadCount = await Notification.countDocuments({ user: appointment.user, isRead: false });
        notifyUser(appointment.user.toString(), "notifications_updated", {
          unreadCount,
        });
      }
    }

    res.status(200).json({
      success: true,
      message: "Appointment updated successfully",
      data: appointment,
    });
  } catch (error) {
    if (error.name === "ValidationError") {
      res.status(400);
    }
    next(error);
  }
};

/**
 * @desc    Manually trigger email notifications to patient (booking confirmation)
 * @route   POST /api/v1/admin/appointments/:id/notify-email
 * @access  Private (Admin)
 */
export const sendManualAppointmentEmail = async (req, res, next) => {
  try {
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found",
      });
    }

    await sendBookingConfirmation(appointment.email, appointment.name, {
      date: appointment.date,
      time: appointment.timeSlot,
      service: appointment.service,
    });

    res.status(200).json({
      success: true,
      message: `Manual email confirmation sent successfully to ${appointment.email}`,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete an appointment
 * @route   DELETE /api/v1/admin/appointments/:id
 * @access  Private (Admin)
 */
export const deleteAppointment = async (req, res, next) => {
  try {
    const appointment = await Appointment.findByIdAndDelete(req.params.id);

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Appointment deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get Admin Dashboard Stats
 * @route   GET /api/v1/admin/dashboard/stats
 * @access  Private (Admin)
 */
export const getDashboardStats = async (req, res, next) => {
  try {
    // 1. Basic Counts
    const totalAppointments = await Appointment.countDocuments();
    const pendingAppointments = await Appointment.countDocuments({ status: "pending" });
    const confirmedAppointments = await Appointment.countDocuments({ status: "confirmed" });
    const completedAppointments = await Appointment.countDocuments({ status: "completed" });
    const cancelledAppointments = await Appointment.countDocuments({ status: "cancelled" });
    const underReviewAppointments = await Appointment.countDocuments({ status: "under_review" });
    const rescheduledAppointments = await Appointment.countDocuments({ status: "rescheduled" });

    // 2. Today's Appointments (Scheduled for today)
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const appointmentsToday = await Appointment.countDocuments({
      date: { $gte: todayStart, $lte: todayEnd },
    });

    // 3. Message Stats
    const totalMessages = await Message.countDocuments();
    const unreadMessages = await Message.countDocuments({ isRead: false });

    // 4. Latest Bookings
    const latestBookings = await Appointment.find()
      .sort({ createdAt: -1 })
      .limit(5);

    // 5. Daily Bookings density history for the last 7 days (including today)
    const dailyStats = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const start = new Date(d); start.setHours(0, 0, 0, 0);
      const end = new Date(d); end.setHours(23, 59, 59, 999);

      const count = await Appointment.countDocuments({
        date: { $gte: start, $lte: end },
        status: { $ne: "cancelled" },
      });

      dailyStats.push({
        date: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        count,
      });
    }

    // 6. Admin Intervention Exception Queue
    const interventionQueue = await Appointment.find({
      $or: [
        { status: "under_review" },
        { interventionRequired: true }
      ]
    })
      .sort({ date: 1 })
      .limit(10);

    const interventionCount = await Appointment.countDocuments({
      $or: [
        { status: "under_review" },
        { interventionRequired: true }
      ]
    });

    res.status(200).json({
      success: true,
      data: {
        appointments: {
          total: totalAppointments,
          pending: pendingAppointments,
          confirmed: confirmedAppointments,
          completed: completedAppointments,
          cancelled: cancelledAppointments,
          under_review: underReviewAppointments,
          rescheduled: rescheduledAppointments,
          today: appointmentsToday,
        },
        messages: {
          total: totalMessages,
          unread: unreadMessages,
        },
        latestBookings,
        dailyStats,
        interventionQueue,
        interventionCount,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all contact messages
 * @route   GET /api/v1/admin/messages
 * @access  Private (Admin)
 */
export const getAdminMessages = async (req, res, next) => {
  try {
    const { isRead, isStarred, isArchived, search } = req.query;
    const query = {};

    if (isRead !== undefined) {
      query.isRead = isRead === "true";
    }

    if (isStarred !== undefined) {
      query.isStarred = isStarred === "true";
    }

    if (isArchived !== undefined) {
      query.isArchived = isArchived === "true";
    } else {
      // By default, exclude archived messages from active views unless explicitly requested
      query.isArchived = { $ne: true };
    }

    if (search) {
      const searchRegex = new RegExp(search, "i");
      query.$or = [
        { name: searchRegex },
        { email: searchRegex },
        { message: searchRegex },
      ];
    }

    const messages = await Message.find(query).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: messages.length,
      data: messages,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Mark contact message as read
 * @route   PATCH /api/v1/admin/messages/:id/read
 * @access  Private (Admin)
 */
export const markMessageAsRead = async (req, res, next) => {
  try {
    const { isRead } = req.body;
    const updateVal = isRead !== undefined ? isRead : true;

    const message = await Message.findByIdAndUpdate(
      req.params.id,
      { isRead: updateVal },
      { new: true, runValidators: true }
    );

    if (!message) {
      return res.status(404).json({
        success: false,
        message: "Message not found",
      });
    }

    res.status(200).json({
      success: true,
      message: `Message marked as ${updateVal ? "read" : "unread"}`,
      data: message,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Toggle contact message starred status
 * @route   PATCH /api/v1/admin/messages/:id/star
 * @access  Private (Admin)
 */
export const toggleMessageStarred = async (req, res, next) => {
  try {
    const message = await Message.findById(req.params.id);

    if (!message) {
      return res.status(404).json({
        success: false,
        message: "Message not found",
      });
    }

    message.isStarred = !message.isStarred;
    await message.save();

    res.status(200).json({
      success: true,
      message: `Message ${message.isStarred ? "starred" : "unstarred"}`,
      data: message,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Toggle contact message archived status
 * @route   PATCH /api/v1/admin/messages/:id/archive
 * @access  Private (Admin)
 */
export const toggleMessageArchived = async (req, res, next) => {
  try {
    const message = await Message.findById(req.params.id);

    if (!message) {
      return res.status(404).json({
        success: false,
        message: "Message not found",
      });
    }

    message.isArchived = !message.isArchived;
    // Mark as read automatically when archiving
    if (message.isArchived) {
      message.isRead = true;
    }
    await message.save();

    res.status(200).json({
      success: true,
      message: `Message ${message.isArchived ? "archived" : "unarchived"}`,
      data: message,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Reply to a contact message via email
 * @route   POST /api/v1/admin/messages/:id/reply
 * @access  Private (Admin)
 */
export const replyToMessage = async (req, res, next) => {
  try {
    const { replyText } = req.body;

    if (!replyText || replyText.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Please provide reply message content",
      });
    }

    const message = await Message.findById(req.params.id);

    if (!message) {
      return res.status(404).json({
        success: false,
        message: "Message not found",
      });
    }

    // Send email using mailer service
    await sendInquiryReply(message.email, message.name, message.message, replyText);

    // Save reply in history
    message.replies.push({ message: replyText });
    message.isRead = true; // Auto mark as read on reply
    await message.save();

    res.status(200).json({
      success: true,
      message: "Reply email sent successfully and recorded",
      data: message,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete contact message
 * @route   DELETE /api/v1/admin/messages/:id
 * @access  Private (Admin)
 */
export const deleteMessage = async (req, res, next) => {
  try {
    const message = await Message.findByIdAndDelete(req.params.id);

    if (!message) {
      return res.status(404).json({
        success: false,
        message: "Message not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Message deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all capacity configurations/overrides
 * @route   GET /api/v1/admin/capacity
 * @access  Private (Admin)
 */
export const getCapacityOverrides = async (req, res, next) => {
  try {
    const capacities = await BookingCapacity.find().sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      data: capacities,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create or update a capacity override
 * @route   POST /api/v1/admin/capacity
 * @access  Private (Admin)
 */
export const createOrUpdateCapacityOverride = async (req, res, next) => {
  try {
    const { service, date, dayOfWeek, timeSlot, capacity } = req.body;

    if (!timeSlot || capacity === undefined) {
      return res.status(400).json({
        success: false,
        message: "Please provide a timeSlot and capacity",
      });
    }

    const filter = { service: service || "all", timeSlot };
    if (date) {
      const targetDate = new Date(date);
      targetDate.setHours(0, 0, 0, 0);
      filter.date = targetDate;
    } else {
      filter.date = null;
    }

    if (dayOfWeek !== undefined && dayOfWeek !== null && dayOfWeek !== "") {
      filter.dayOfWeek = parseInt(dayOfWeek, 10);
    } else {
      filter.dayOfWeek = null;
    }

    const update = {
      capacity: parseInt(capacity, 10),
    };

    // Use findOneAndUpdate with upsert
    const capacityOverride = await BookingCapacity.findOneAndUpdate(
      filter,
      { ...filter, ...update },
      { new: true, upsert: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: "Capacity configuration saved successfully",
      data: capacityOverride,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete a capacity override
 * @route   DELETE /api/v1/admin/capacity/:id
 * @access  Private (Admin)
 */
export const deleteCapacityOverride = async (req, res, next) => {
  try {
    const capacityOverride = await BookingCapacity.findByIdAndDelete(req.params.id);

    if (!capacityOverride) {
      return res.status(404).json({
        success: false,
        message: "Capacity configuration not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Capacity configuration deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};
