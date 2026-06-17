import Appointment from "../models/Appointment.js";
import { getSlotCapacity } from "./capacityService.js";

// Standard time slots in the clinic
export const STANDARD_SLOTS = ["09:00 AM", "11:00 AM", "02:00 PM", "04:00 PM"];

/**
 * Checks if a slot is available on a specific date and returns a free slotIndex.
 * 
 * @param {Date|string} date - The date to check
 * @param {string} timeSlot - The time slot (e.g. "09:00 AM")
 * @param {string} service - The service type
 * @returns {Promise<object>} Returns { available: boolean, capacity: number, slotIndex: number }
 */
export const checkSlotAvailability = async (date, timeSlot, service = "all") => {
  const targetDate = new Date(date);
  const startOfDay = new Date(targetDate);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(targetDate);
  endOfDay.setHours(23, 59, 59, 999);

  const capacity = await getSlotCapacity(targetDate, timeSlot, service);

  if (capacity <= 0) {
    return { available: false, capacity, slotIndex: -1 };
  }

  // Find all active appointments for this slot on this day
  const activeAppointments = await Appointment.find({
    date: { $gte: startOfDay, $lte: endOfDay },
    timeSlot,
    status: { $in: ["pending", "under_review", "confirmed", "rescheduled", "completed"] },
  }).select("slotIndex");

  const usedIndexes = activeAppointments.map((app) => app.slotIndex ?? 0);

  // Find the first free index within capacity bounds
  let slotIndex = 0;
  while (slotIndex < capacity) {
    if (!usedIndexes.includes(slotIndex)) {
      return { available: true, capacity, slotIndex };
    }
    slotIndex++;
  }

  return { available: false, capacity, slotIndex: -1 };
};

/**
 * Finds up to 5 alternative available slots starting from a target date.
 * 
 * @param {Date|string} date - The starting date of search
 * @param {string} timeSlot - The current (full) time slot
 * @param {string} service - The service type
 * @returns {Promise<Array<object>>} Returns up to 5 alternative slots [{ date: string, timeSlot: string }]
 */
export const findAlternativeSlots = async (date, timeSlot, service = "all") => {
  const alternatives = [];
  const startSearchDate = new Date(date);
  startSearchDate.setHours(0, 0, 0, 0);

  // Search over the next 4 days (including current date)
  for (let offset = 0; offset < 4; offset++) {
    const searchDate = new Date(startSearchDate);
    searchDate.setDate(searchDate.getDate() + offset);

    // Skip Sundays (standard clinic rule)
    if (searchDate.getDay() === 0) {
      continue;
    }

    const formattedDate = searchDate.toISOString().slice(0, 10);

    for (const slot of STANDARD_SLOTS) {
      // Skip the exact same slot we are currently trying to book
      if (offset === 0 && slot === timeSlot) {
        continue;
      }

      const { available } = await checkSlotAvailability(searchDate, slot, service);
      if (available) {
        alternatives.push({
          date: formattedDate,
          timeSlot: slot,
        });

        if (alternatives.length >= 5) {
          return alternatives;
        }
      }
    }
  }

  return alternatives;
};
