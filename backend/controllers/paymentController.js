import crypto from "crypto";
import Razorpay from "razorpay";
import Payment from "../models/Payment.js";
import Order from "../models/Order.js";
import Appointment from "../models/Appointment.js";
import {
  sendBookingConfirmation,
  sendAdminAppointmentNotification,
  sendProductOrderConfirmation,
  sendAdminProductOrderNotification,
} from "../services/mailService.js";

const KEY_ID = process.env.RAZORPAY_KEY_ID;
const KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;

const isRazorpayConfigured = !!(KEY_ID && KEY_SECRET);

let razorpayInstance = null;
if (isRazorpayConfigured) {
  razorpayInstance = new Razorpay({
    key_id: KEY_ID,
    key_secret: KEY_SECRET,
  });
} else {
  console.warn(
    "⚠️ Razorpay warning: RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET is not configured. Running payments in MOCK mode."
  );
}

/**
 * @desc    Create Razorpay Order
 * @route   POST /api/v1/payments/create-order
 * @access  Private
 */
export const createRazorpayOrder = async (req, res, next) => {
  try {
    const { amount, type } = req.body; // amount is in INR (rupees)

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid amount. Please provide a positive value.",
      });
    }

    const amountInPaise = Math.round(amount * 100);

    // Mock Mode Fallback
    if (!isRazorpayConfigured) {
      return res.status(200).json({
        success: true,
        mock: true,
        keyId: "mock_key_id",
        order: {
          id: `mock_order_${Date.now()}`,
          amount: amountInPaise,
          currency: "INR",
        },
      });
    }

    // Real Razorpay Order Creation
    const options = {
      amount: amountInPaise,
      currency: "INR",
      receipt: `rcpt_${type || "payment"}_${Date.now()}`,
    };

    const order = await razorpayInstance.orders.create(options);

    res.status(200).json({
      success: true,
      mock: false,
      keyId: KEY_ID,
      order,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Verify Razorpay Payment Signature and save transactions
 * @route   POST /api/v1/payments/verify
 * @access  Private
 */
export const verifyRazorpayPayment = async (req, res, next) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      type, // 'appointment' or 'product'
      amount, // in INR
      appointmentDetails, // if type is appointment
      cartItems, // if type is product
    } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id) {
      return res.status(400).json({
        success: false,
        message: "Missing Razorpay order ID or payment ID.",
      });
    }

    // 1. Signature Verification
    if (isRazorpayConfigured) {
      if (!razorpay_signature) {
        return res.status(400).json({
          success: false,
          message: "Missing Razorpay payment signature.",
        });
      }

      const generatedSignature = crypto
        .createHmac("sha256", KEY_SECRET)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest("hex");

      if (generatedSignature !== razorpay_signature) {
        return res.status(400).json({
          success: false,
          message: "Payment verification failed. Signature mismatch.",
        });
      }
    } else {
      console.log(`[MOCK PAYMENT] Skipping signature verification for payment: ${razorpay_payment_id}`);
    }

    let savedItem = null;
    let serviceOrProductLabel = "";

    // 2. Process Order / Appointment Writes
    if (type === "appointment") {
      if (!appointmentDetails) {
        return res.status(400).json({
          success: false,
          message: "Missing appointment details.",
        });
      }

      // Create and save appointment
      const appointment = new Appointment({
        name: appointmentDetails.name,
        email: appointmentDetails.email,
        phone: appointmentDetails.phone,
        date: appointmentDetails.date,
        timeSlot: appointmentDetails.timeSlot,
        condition: appointmentDetails.condition,
        message: appointmentDetails.message,
        service: appointmentDetails.service || "General Wellness Consultation",
        status: "confirmed", // Mark as confirmed after payment
        notes: `Paid online. Razorpay ID: ${razorpay_payment_id}`,
      });

      await appointment.save();
      savedItem = appointment;
      serviceOrProductLabel = appointment.service;

      // Trigger Email Notifications (Asynchronous)
      sendBookingConfirmation(appointment.email, appointment.name, {
        date: appointment.date,
        time: appointment.timeSlot,
        service: appointment.service,
      }).catch((err) => console.error("Booking Email Failed:", err.message));

      sendAdminAppointmentNotification(appointment).catch((err) =>
        console.error("Booking Admin Email Failed:", err.message)
      );

    } else if (type === "product") {
      if (!cartItems || !Array.isArray(cartItems) || cartItems.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Missing shopping cart items.",
        });
      }

      // Create and save order
      const order = new Order({
        user: req.user._id,
        items: cartItems.map((item) => ({
          name: item.name,
          quantity: item.quantity,
          price: item.price,
        })),
        totalAmount: amount,
        paymentId: razorpay_payment_id,
        status: "paid",
      });

      await order.save();
      savedItem = order;
      serviceOrProductLabel = cartItems.map((i) => `${i.name} (${i.quantity})`).join(", ");

      // Trigger Email Notifications (Asynchronous)
      sendProductOrderConfirmation(req.user.email, req.user.name, order).catch((err) =>
        console.error("Order Email Failed:", err.message)
      );

      sendAdminProductOrderNotification(order, req.user.name, req.user.email).catch((err) =>
        console.error("Order Admin Email Failed:", err.message)
      );
    } else {
      return res.status(400).json({
        success: false,
        message: "Invalid transaction type.",
      });
    }

    // 3. Save transaction record to Payment collection
    const payment = await Payment.create({
      user: req.user._id,
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      amount: amount,
      status: "success",
      serviceOrProduct: serviceOrProductLabel,
    });

    res.status(200).json({
      success: true,
      message: "Payment successfully verified and records created.",
      data: {
        payment,
        item: savedItem,
      },
    });
  } catch (error) {
    next(error);
  }
};
