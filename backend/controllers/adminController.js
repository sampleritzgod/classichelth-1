import Appointment from "../models/Appointment.js";
import Message from "../models/Message.js";
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
    const { status } = req.body;
    const validStatuses = ["pending", "confirmed", "completed", "cancelled"];

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
    const { name, email, phone, date, timeSlot, condition, message, status, service, notes } = req.body;

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

    await appointment.save();

    const statusChanged = status !== undefined && oldStatus !== status;

    if (statusChanged) {
      sendBookingStatusUpdate(appointment.email, appointment.name, {
        date: appointment.date,
        time: appointment.timeSlot,
        service: appointment.service,
        status: appointment.status,
      }).catch((err) => {
        console.error("Failed to send status update email on PUT:", err.message);
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
    // 1. Basic Counts
    const totalAppointments = await Appointment.countDocuments();
    const pendingAppointments = await Appointment.countDocuments({ status: "pending" });
    const confirmedAppointments = await Appointment.countDocuments({ status: "confirmed" });
    const completedAppointments = await Appointment.countDocuments({ status: "completed" });
    const cancelledAppointments = await Appointment.countDocuments({ status: "cancelled" });

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

    res.status(200).json({
      success: true,
      data: {
        appointments: {
          total: totalAppointments,
          pending: pendingAppointments,
          confirmed: confirmedAppointments,
          completed: completedAppointments,
          cancelled: cancelledAppointments,
          today: appointmentsToday,
        },
        messages: {
          total: totalMessages,
          unread: unreadMessages,
        },
        latestBookings,
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
