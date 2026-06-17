import { appointmentEvents } from "./eventService.js";
import { notifyUser } from "./socketService.js";
import {
  sendBookingConfirmation,
  sendBookingStatusUpdate,
  sendAdminAppointmentNotification,
  sendAppointmentReminderEmail,
} from "./mailService.js";
import Notification from "../models/Notification.js";
import User from "../models/User.js";
import { queueService } from "./queueService.js";

/**
 * Helper function to retrieve a user's registered FCM tokens and enqueue a push task.
 */
const dispatchPushNotification = async (userId, title, body, data = {}) => {
  try {
    if (!userId) return;
    const user = await User.findById(userId).select("fcmTokens");
    if (user && user.fcmTokens && user.fcmTokens.length > 0) {
      await queueService.enqueue({
        type: "push",
        recipient: user.fcmTokens,
        title,
        body,
        data: {
          ...data,
          click_action: data.click_action || "/profile",
        },
      });
    }
  } catch (error) {
    console.error("[Notification Service] Failed to dispatch push notification:", error);
  }
};

// Setup event listeners
export const initNotificationService = () => {
  console.log("[Notification Service] Initializing event listeners...");

  // 1. Appointment Created (Auto-confirmed or placed under review)
  appointmentEvents.on("appointment.created", async (appointment) => {
    try {
      console.log(`[Notification Service] Event: appointment.created for ID ${appointment.appointmentId}`);
      
      // A. Send confirmation email to client (automatically enqueued inside sendMail wrapper)
      if (appointment.email) {
        sendBookingConfirmation(appointment.email, appointment.name, {
          date: appointment.date,
          time: appointment.timeSlot,
          service: appointment.service,
          appointmentId: appointment.appointmentId,
        }).catch((err) => {
          console.error(`✉️ Failed to enqueue email confirmation: ${err.message}`);
        });
      }

      // B. Send notification email to admin
      sendAdminAppointmentNotification(appointment).catch((err) => {
        console.error(`✉️ Failed to enqueue admin email notification: ${err.message}`);
      });

      // C. Send In-App & Socket notification
      if (appointment.user) {
        const title = appointment.status === "confirmed" ? "Appointment Confirmed" : "Appointment Under Review";
        const message = appointment.status === "confirmed"
          ? `Your booking for ${appointment.service} on ${new Date(appointment.date).toDateString()} at ${appointment.timeSlot} is confirmed!`
          : `Your booking request for ${appointment.service} is under review.`;

        await Notification.create({
          user: appointment.user,
          appointment: appointment._id,
          type: appointment.status === "confirmed" ? "booking_confirmation" : "status_update",
          title,
          message,
        });

        notifyUser(appointment.user.toString(), "appointment_created", {
          appointmentId: appointment._id,
          appointmentCode: appointment.appointmentId,
          status: appointment.status,
          date: appointment.date,
          timeSlot: appointment.timeSlot,
        });

        // Trigger browser push notification
        dispatchPushNotification(appointment.user, title, message, {
          appointmentId: appointment._id.toString(),
          click_action: "/profile",
        });

        // Update unread count
        const unreadCount = await Notification.countDocuments({ user: appointment.user, isRead: false });
        notifyUser(appointment.user.toString(), "notifications_updated", { unreadCount });
      }

      // D. Broadcast to Admin users
      const admins = await User.find({ role: { $in: ["admin", "superadmin"] } });
      for (const admin of admins) {
        notifyUser(admin._id.toString(), "admin_appointment_created", {
          appointmentId: appointment._id,
          name: appointment.name,
          date: appointment.date,
          timeSlot: appointment.timeSlot,
          status: appointment.status,
        });
      }
      
    } catch (error) {
      console.error("[Notification Service] Error in appointment.created handler:", error);
    }
  });

  // 2. Appointment Status Changed (rescheduled, cancelled, completed, admin remarks)
  appointmentEvents.on("appointment.statusChanged", async ({ appointment, oldStatus, newStatus, statusMessage }) => {
    try {
      console.log(`[Notification Service] Event: appointment.statusChanged for ID ${appointment.appointmentId} from ${oldStatus} to ${newStatus}`);

      // A. Send status update email to client
      if (appointment.email) {
        sendBookingStatusUpdate(appointment.email, appointment.name, {
          date: appointment.date,
          time: appointment.timeSlot,
          service: appointment.service,
          status: newStatus,
          appointmentId: appointment.appointmentId,
        }).catch((err) => {
          console.error(`✉️ Failed to enqueue email status update: ${err.message}`);
        });
      }

      // B. In-App, Socket & Push notification
      if (appointment.user) {
        const displayStatus = newStatus.replace("_", " ").toUpperCase();
        const title = `Appointment Status: ${displayStatus}`;
        const message = statusMessage || `Your appointment status has been updated to ${newStatus.replace("_", " ")}.`;

        await Notification.create({
          user: appointment.user,
          appointment: appointment._id,
          type: "status_update",
          title,
          message,
        });

        notifyUser(appointment.user.toString(), "appointment_updated", {
          appointmentId: appointment._id,
          status: newStatus,
          statusMessage,
          date: appointment.date,
          timeSlot: appointment.timeSlot,
        });

        // Trigger browser push notification
        dispatchPushNotification(appointment.user, title, message, {
          appointmentId: appointment._id.toString(),
          click_action: "/profile",
        });

        const unreadCount = await Notification.countDocuments({ user: appointment.user, isRead: false });
        notifyUser(appointment.user.toString(), "notifications_updated", { unreadCount });
      }

      // Notify Admins
      const admins = await User.find({ role: { $in: ["admin", "superadmin"] } });
      for (const admin of admins) {
        notifyUser(admin._id.toString(), "admin_appointment_updated", {
          appointmentId: appointment._id,
          status: newStatus,
          name: appointment.name,
        });
      }
    } catch (error) {
      console.error("[Notification Service] Error in appointment.statusChanged handler:", error);
    }
  });

  // 3. Appointment Reminders (24h and 1h thresholds)
  appointmentEvents.on("appointment.reminder", async ({ type, appointment }) => {
    try {
      console.log(`[Notification Service] Event: appointment.reminder (${type}) for ID ${appointment.appointmentId}`);

      const timeFrame = type === "1h" ? "1 hour" : "24 hours";
      const title = `Upcoming Appointment Reminder`;
      const message = `Friendly reminder: Your appointment for ${appointment.service} is tomorrow/soon (in ${timeFrame}) at ${appointment.timeSlot}.`;

      // A. Send email reminder (enqueued dynamically)
      if (appointment.email) {
        sendAppointmentReminderEmail(appointment.email, appointment.name, appointment, type).catch((err) => {
          console.error(`✉️ Failed to enqueue reminder email: ${err.message}`);
        });
      }

      // B. Create In-App Notification
      if (appointment.user) {
        await Notification.create({
          user: appointment.user,
          appointment: appointment._id,
          type: "status_update",
          title,
          message,
        });

        // Live Socket update
        notifyUser(appointment.user.toString(), "appointment_reminder", {
          appointmentId: appointment._id,
          timeSlot: appointment.timeSlot,
          date: appointment.date,
          reminderType: type,
        });

        // Trigger browser push notification
        dispatchPushNotification(appointment.user, title, message, {
          appointmentId: appointment._id.toString(),
          click_action: "/profile",
        });

        const unreadCount = await Notification.countDocuments({ user: appointment.user, isRead: false });
        notifyUser(appointment.user.toString(), "notifications_updated", { unreadCount });
      }
    } catch (error) {
      console.error("[Notification Service] Error in appointment.reminder handler:", error);
    }
  });
};
