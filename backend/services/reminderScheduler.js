import Appointment from "../models/Appointment.js";
import { appointmentEvents } from "./eventService.js";

/**
 * Parses appointment date and time slot string to construct a single Date object.
 * e.g., Date("2026-06-18") and "02:00 PM" -> Date("2026-06-18T14:00:00")
 */
export const parseAppointmentDateTime = (date, timeSlot) => {
  const dt = new Date(date);
  const timeMatch = timeSlot.match(/(\d+):(\d+)\s*(AM|PM)/i);
  if (timeMatch) {
    let hours = parseInt(timeMatch[1], 10);
    const minutes = parseInt(timeMatch[2], 10);
    const ampm = timeMatch[3].toUpperCase();
    if (ampm === "PM" && hours < 12) hours += 12;
    if (ampm === "AM" && hours === 12) hours = 0;
    dt.setHours(hours, minutes, 0, 0);
  } else {
    dt.setHours(12, 0, 0, 0);
  }
  return dt;
};

/**
 * Sweeps the database to find upcoming appointments tomorrow (24h) and soon (1h) that need reminders.
 */
export const sendAutomatedReminders = async () => {
  try {
    const now = new Date();
    
    // Fetch confirmed appointments starting from today
    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);

    console.log(`[Reminder Scheduler] Sweeping upcoming appointments starting from ${startOfToday.toISOString()}...`);

    const appointments = await Appointment.find({
      status: "confirmed",
      date: { $gte: startOfToday },
      $or: [
        { reminder24hSent: { $ne: true } },
        { reminder1hSent: { $ne: true } }
      ]
    });

    for (const app of appointments) {
      // Construct the exact combined Date object for the appointment
      const appDateTime = parseAppointmentDateTime(app.date, app.timeSlot);
      const timeDiffMs = appDateTime.getTime() - now.getTime();

      // 1. 24-Hour Reminder Check
      // If the appointment is in the next 25 hours and we haven't sent the 24h reminder yet
      if (!app.reminder24hSent) {
        if (timeDiffMs > 0 && timeDiffMs <= 25 * 60 * 60 * 1000) {
          app.reminder24hSent = true;
          app.reminder24hSentAt = new Date();
          await app.save();

          console.log(`[Reminder Scheduler] Triggering 24h reminder for ${app.appointmentId || app._id} (${app.name})`);
          appointmentEvents.emit("appointment.reminder", { type: "24h", appointment: app });
        }
      }

      // 2. 1-Hour Reminder Check
      // If the appointment is in the next 90 minutes and we haven't sent the 1h reminder yet
      if (!app.reminder1hSent) {
        if (timeDiffMs > 0 && timeDiffMs <= 90 * 60 * 1000) {
          app.reminder1hSent = true;
          app.reminder1hSentAt = new Date();
          await app.save();

          console.log(`[Reminder Scheduler] Triggering 1h reminder for ${app.appointmentId || app._id} (${app.name})`);
          appointmentEvents.emit("appointment.reminder", { type: "1h", appointment: app });
        }
      }
    }

  } catch (error) {
    console.error("[Reminder Scheduler] Error running reminder sweep:", error);
  }
};

/**
 * Automatically transitions confirmed appointments that are in the past to "completed" status.
 */
export const autoCompletePastAppointments = async () => {
  try {
    const now = new Date();
    console.log("[Reminder Scheduler] Checking for past appointments to autocomplete...");

    const appointments = await Appointment.find({
      status: { $in: ["confirmed", "rescheduled"] },
      date: { $lte: now },
    });

    let completedCount = 0;

    for (const app of appointments) {
      const appDateTime = parseAppointmentDateTime(app.date, app.timeSlot);
      const gracePeriodEnd = new Date(appDateTime.getTime() + 2 * 60 * 60 * 1000);

      if (now > gracePeriodEnd) {
        const oldStatus = app.status;
        app.status = "completed";
        app.statusHistory.push({
          status: "completed",
          statusMessage: "Appointment automatically marked as completed by system scheduler.",
          changedAt: new Date(),
        });
        await app.save();
        completedCount++;

        // Emit status update event
        appointmentEvents.emit("appointment.statusChanged", {
          appointment: app,
          oldStatus,
          newStatus: "completed",
          statusMessage: "System auto-completed past appointment.",
        });
      }
    }

    if (completedCount > 0) {
      console.log(`[Reminder Scheduler] Auto-completed ${completedCount} past appointments.`);
    }
  } catch (error) {
    console.error("[Reminder Scheduler] Error running auto-complete sweep:", error);
  }
};

/**
 * Initializes the background scheduler loops
 */
export const initScheduler = () => {
  console.log("[Reminder Scheduler] Initializing background loop...");

  // Run initial sweeps after 10 seconds, then every 15 minutes
  setTimeout(() => {
    sendAutomatedReminders();
    autoCompletePastAppointments();
  }, 10000);

  const FIFTEEN_MINUTES = 15 * 60 * 1000;
  setInterval(() => {
    sendAutomatedReminders();
    autoCompletePastAppointments();
  }, FIFTEEN_MINUTES);
};
