import mongoose from "mongoose";

const bookingCapacitySchema = new mongoose.Schema(
  {
    service: {
      type: String,
      default: "all", // "all" for all services, or specific service name
      trim: true,
    },
    date: {
      type: Date, // Specific date for override
    },
    dayOfWeek: {
      type: Number, // 0 (Sunday) to 6 (Saturday)
    },
    timeSlot: {
      type: String, // e.g. "09:00 AM"
      required: true,
      trim: true,
    },
    capacity: {
      type: Number,
      required: true,
      default: 2,
    },
  },
  {
    timestamps: true,
  }
);

// Unique constraint to avoid multiple definitions for the same configuration scope
bookingCapacitySchema.index({ service: 1, date: 1, dayOfWeek: 1, timeSlot: 1 }, { unique: true });

const BookingCapacity = mongoose.model("BookingCapacity", bookingCapacitySchema);

export default BookingCapacity;
