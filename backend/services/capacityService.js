import BookingCapacity from "../models/BookingCapacity.js";

/**
 * Resolves the slot booking capacity for a given date, time slot, and service.
 * Precedence order:
 * 1. Specific date override for this service (or "all" services)
 * 2. Day-of-week override for this service (or "all" services)
 * 3. Default global capacity (2)
 *
 * @param {Date|string} date - The date of the appointment
 * @param {string} timeSlot - The time slot (e.g. "09:00 AM")
 * @param {string} service - The service name (optional)
 * @returns {Promise<number>} Resolves to the capacity limit
 */
export const getSlotCapacity = async (date, timeSlot, service = "all") => {
  try {
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);
    
    const dayOfWeek = targetDate.getDay(); // 0-6

    // 1. Query for exact date override first
    const dateOverride = await BookingCapacity.findOne({
      date: targetDate,
      timeSlot,
      $or: [{ service }, { service: "all" }],
    }).sort({ service: -1 }); // Prioritize specific service over "all"

    if (dateOverride) {
      return dateOverride.capacity;
    }

    // 2. Query for day-of-week override
    const dowOverride = await BookingCapacity.findOne({
      dayOfWeek,
      timeSlot,
      $or: [{ service }, { service: "all" }],
    }).sort({ service: -1 });

    if (dowOverride) {
      return dowOverride.capacity;
    }

    // 3. Fallback to global defaults
    return 2; // Default is 2 concurrent bookings per slot
  } catch (error) {
    console.error("[Capacity Service] Error resolving capacity, falling back to default:", error);
    return 2;
  }
};
