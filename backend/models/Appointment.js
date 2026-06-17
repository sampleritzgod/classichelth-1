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
  },
  {
    timestamps: true, // Automatically creates createdAt and updatedAt fields
  }
);

// Indexes for rapid sorting and filtering in the admin panel
appointmentSchema.index({ date: 1 });
appointmentSchema.index({ status: 1 });

const Appointment = mongoose.model("Appointment", appointmentSchema);

export default Appointment;
