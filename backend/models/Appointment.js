import mongoose from "mongoose";

const appointmentSchema = new mongoose.Schema(
  {
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
      enum: ["pending", "confirmed", "completed", "cancelled"],
      default: "pending",
    },
  },
  {
    timestamps: true, // Automatically creates createdAt and updatedAt fields
  }
);

const Appointment = mongoose.model("Appointment", appointmentSchema);

export default Appointment;
