import Appointment from "../models/Appointment.js";
import Message from "../models/Message.js";
import BookingCapacity from "../models/BookingCapacity.js";
import { appointmentEvents } from "../services/eventService.js";
import {
  sendInquiryReply,
  sendBookingConfirmation,
} from "../services/mailService.js";

/**
 * Escape user-supplied input before using it in a RegExp to prevent
 * regex injection / ReDoS via catastrophic backtracking. Also caps length.
 */
const buildSafeSearchRegex = (input) => {
  const trimmed = String(input).slice(0, 100);
  const escaped = trimmed.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(escaped, "i");
};

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
      const searchRegex = buildSafeSearchRegex(search);
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

    const appointments = await Appointment.find(query).sort(sortBy).lean();

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

    const previousStatus = appointment.status;
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

    // Route all side effects (email + in-app + socket + FCM + admin fan-out)
    // through the central event bus so user and admin notifications stay in sync.
    const hasMessage = statusMessage !== undefined && statusMessage !== "";
    if (statusChanged || hasMessage) {
      appointmentEvents.emit("appointment.statusChanged", {
        appointment,
        oldStatus: previousStatus,
        newStatus: appointment.status,
        statusMessage,
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

    // Centralize all status-change side effects through the event bus.
    if (statusChanged) {
      appointmentEvents.emit("appointment.statusChanged", {
        appointment,
        oldStatus,
        newStatus: appointment.status,
        statusMessage: statusMessage !== undefined ? statusMessage : appointment.statusMessage,
      });
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
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    // Status counts in a single aggregation instead of 7 sequential queries.
    const statusGroupsPromise = Appointment.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);

    // Last 7 days density in a single aggregation instead of a query-per-day.
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - 6);
    weekStart.setHours(0, 0, 0, 0);
    const dailyAggPromise = Appointment.aggregate([
      { $match: { date: { $gte: weekStart, $lte: todayEnd }, status: { $ne: "cancelled" } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
          count: { $sum: 1 },
        },
      },
    ]);

    const interventionFilter = {
      $or: [{ status: "under_review" }, { interventionRequired: true }],
    };

    // Run all independent queries concurrently.
    const [
      totalAppointments,
      statusGroups,
      appointmentsToday,
      totalMessages,
      unreadMessages,
      latestBookings,
      dailyAgg,
      interventionQueue,
      interventionCount,
    ] = await Promise.all([
      Appointment.countDocuments(),
      statusGroupsPromise,
      Appointment.countDocuments({ date: { $gte: todayStart, $lte: todayEnd } }),
      Message.countDocuments(),
      Message.countDocuments({ isRead: false }),
      Appointment.find().sort({ createdAt: -1 }).limit(5).lean(),
      dailyAggPromise,
      Appointment.find(interventionFilter).sort({ date: 1 }).limit(10).lean(),
      Appointment.countDocuments(interventionFilter),
    ]);

    const statusCount = (s) =>
      statusGroups.find((g) => g._id === s)?.count || 0;

    // Build the last 7 days (including today) from the aggregation map.
    const dailyMap = dailyAgg.reduce((acc, d) => {
      acc[d._id] = d.count;
      return acc;
    }, {});
    const dailyStats = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
        d.getDate()
      ).padStart(2, "0")}`;
      dailyStats.push({
        date: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        count: dailyMap[key] || 0,
      });
    }

    const pendingAppointments = statusCount("pending");
    const confirmedAppointments = statusCount("confirmed");
    const completedAppointments = statusCount("completed");
    const cancelledAppointments = statusCount("cancelled");
    const underReviewAppointments = statusCount("under_review");
    const rescheduledAppointments = statusCount("rescheduled");

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
      const searchRegex = buildSafeSearchRegex(search);
      query.$or = [
        { name: searchRegex },
        { email: searchRegex },
        { message: searchRegex },
      ];
    }

    const messages = await Message.find(query).sort({ createdAt: -1 }).lean();

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
