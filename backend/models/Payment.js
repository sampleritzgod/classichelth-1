import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Payment must belong to a user"],
    },
    orderId: {
      type: String,
      required: [true, "Payment must have an order ID"],
      trim: true,
    },
    paymentId: {
      type: String,
      required: [true, "Payment must have a payment ID"],
      trim: true,
    },
    amount: {
      type: Number,
      required: [true, "Payment must have an amount"],
    },
    status: {
      type: String,
      enum: ["success", "failed"],
      default: "success",
    },
    serviceOrProduct: {
      type: String,
      required: [true, "Payment must specify what service or product was purchased"],
      trim: true,
    },
  },
  {
    timestamps: true, // Handles createdAt and updatedAt
  }
);

// Indexes for rapid transaction searches
paymentSchema.index({ user: 1 });
paymentSchema.index({ paymentId: 1 });

const Payment = mongoose.model("Payment", paymentSchema);

export default Payment;
