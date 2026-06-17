import mongoose from "mongoose";

const appointmentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
    name: {
      type: String,
      required: [true, "Please add a full name"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Please add an email address"],
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        "Please add a valid email address",
      ],
    },
    phone: {
      type: String,
      required: [true, "Please add a phone number"],
    },
    date: {
      type: Date,
      required: [true, "Please select an appointment date"],
    },
    timeSlot: {
      type: String,
      required: [true, "Please select a time slot"],
    },
    condition: {
      type: String,
      required: false,
      trim: true,
    },
    message: {
      type: String,
      required: false,
      trim: true,
    },
    status: {
      type: String,
      enum: ["pending", "under_review", "confirmed", "rescheduled", "completed", "cancelled"],
      default: "pending",
    },
    statusMessage: {
      type: String,
      default: "",
    },
    statusHistory: [
      {
        status: {
          type: String,
          enum: ["pending", "under_review", "confirmed", "rescheduled", "completed", "cancelled"],
          required: true,
        },
        statusMessage: {
          type: String,
          default: "",
        },
        changedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    notes: {
      type: String,
      default: "",
    },
    service: {
      type: String,
      default: "General Wellness Consultation",
    },
    appointmentId: {
      type: String,
      unique: true,
      sparse: true,
    },
    slotIndex: {
      type: Number,
    },
    reminder24hSent: {
      type: Boolean,
      default: false,
    },
    reminder24hSentAt: {
      type: Date,
    },
    reminder1hSent: {
      type: Boolean,
      default: false,
    },
    reminder1hSentAt: {
      type: Date,
    },
    interventionRequired: {
      type: Boolean,
      default: false,
    },
    interventionReason: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true, // Automatically creates createdAt and updatedAt fields
  }
);

// Pre-save hook to generate unique appointment ID
appointmentSchema.pre("save", function (next) {
  if (!this.appointmentId) {
    const formattedDate = this.date 
      ? new Date(this.date).toISOString().slice(0, 10).replace(/-/g, "") 
      : new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const randomPart = Math.random().toString(36).substring(2, 6).toUpperCase();
    this.appointmentId = `APP-${formattedDate}-${randomPart}`;
  }
  next();
});

// Indexes for rapid sorting and filtering in the admin panel
appointmentSchema.index({ date: 1 });
appointmentSchema.index({ status: 1 });
// User's own appointments, newest first (getMyAppointments)
appointmentSchema.index({ user: 1, createdAt: -1 });
// Admin list / latest bookings sorted by creation time
appointmentSchema.index({ createdAt: -1 });
// Slot availability checks (date + timeSlot + status)
appointmentSchema.index({ date: 1, timeSlot: 1, status: 1 });
// Reminder scheduler sweeps (status + date + reminder flags)
appointmentSchema.index({ status: 1, date: 1, reminder24hSent: 1, reminder1hSent: 1 });

// Compound unique index on date, time slot, and slot index to prevent double-booking for active slots
appointmentSchema.index(
  { date: 1, timeSlot: 1, slotIndex: 1 },
  { 
    unique: true, 
    partialFilterExpression: { 
      status: { $in: ["pending", "under_review", "confirmed", "rescheduled", "completed"] },
      slotIndex: { $exists: true }
    } 
  }
);

const Appointment = mongoose.model("Appointment", appointmentSchema);

export default Appointment;
