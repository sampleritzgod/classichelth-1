import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
  },
  price: {
    type: Number,
    required: true,
  },
});

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Order must belong to a user"],
    },
    items: [orderItemSchema],
    totalAmount: {
      type: Number,
      required: [true, "Order must have a total amount"],
    },
    paymentId: {
      type: String,
      required: [true, "Order must have an associated payment ID"],
      trim: true,
    },
    status: {
      type: String,
      default: "paid",
    },
  },
  {
    timestamps: true, // Handles createdAt and updatedAt
  }
);

// Indexes for rapid order checks
orderSchema.index({ user: 1 });
orderSchema.index({ paymentId: 1 });

const Order = mongoose.model("Order", orderSchema);

export default Order;
