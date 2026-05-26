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
    console.log(`[Payment Route] createRazorpayOrder: Started. Amount: ${amount}, Type: ${type}`);

    if (!amount || amount <= 0) {
      console.warn("[Payment Route] createRazorpayOrder: Invalid amount received:", amount);
      return res.status(400).json({
        success: false,
        message: "Invalid amount. Please provide a positive value.",
      });
    }

    const amountInPaise = Math.round(amount * 100);

    // Mock Mode Fallback
    if (!isRazorpayConfigured) {
      const mockOrderId = `mock_order_${Date.now()}`;
      console.log(`[Payment Route] createRazorpayOrder: Razorpay not configured. Returning MOCK order: ${mockOrderId}`);
      return res.status(200).json({
        success: true,
        mock: true,
        keyId: "mock_key_id",
        order: {
          id: mockOrderId,
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

    console.log("[Payment Route] createRazorpayOrder: Creating real Razorpay order options:", options);
    const order = await razorpayInstance.orders.create(options);
    console.log(`[Payment Route] createRazorpayOrder: Order successfully created. ID: ${order.id}`);

    res.status(200).json({
      success: true,
      mock: false,
      keyId: KEY_ID,
      order,
    });
  } catch (error) {
    console.error("[Payment Route] createRazorpayOrder: Exception occurred:", error);
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

    console.log(`[Payment Route] verifyRazorpayPayment: Started. Order: ${razorpay_order_id}, Payment: ${razorpay_payment_id}, Type: ${type}, Amount: ${amount}`);

    if (!razorpay_order_id || !razorpay_payment_id) {
      console.warn("[Payment Route] verifyRazorpayPayment: Missing order ID or payment ID.");
      return res.status(400).json({
        success: false,
        message: "Missing Razorpay order ID or payment ID.",
      });
    }

    // 1. Signature Verification
    if (isRazorpayConfigured) {
      if (!razorpay_signature) {
        console.warn("[Payment Route] verifyRazorpayPayment: Real Razorpay mode - Missing signature.");
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
        console.error("[Payment Route] verifyRazorpayPayment: Signature Mismatch. Verification failed.");
        return res.status(400).json({
          success: false,
          message: "Payment verification failed. Signature mismatch.",
        });
      }
      console.log("[Payment Route] verifyRazorpayPayment: Signature successfully verified.");
    } else {
      console.log(`[MOCK PAYMENT] Skipping signature verification for payment: ${razorpay_payment_id}`);
    }

    let savedItem = null;
    let serviceOrProductLabel = "";

    // 2. Process Order / Appointment Writes
    if (type === "appointment") {
      if (!appointmentDetails) {
        console.warn("[Payment Route] verifyRazorpayPayment: Missing appointment details for appointment type.");
        return res.status(400).json({
          success: false,
          message: "Missing appointment details.",
        });
      }

      // Create and save appointment
      console.log("[Payment Route] verifyRazorpayPayment: Creating Appointment document.");
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

      console.log("[Payment Route] verifyRazorpayPayment: Saving Appointment to MongoDB.");
      await appointment.save();
      console.log(`[Payment Route] verifyRazorpayPayment: Appointment saved successfully. ID: ${appointment._id}`);
      savedItem = appointment;
      serviceOrProductLabel = appointment.service;

      // Trigger Email Notifications (Asynchronous)
      console.log("[Payment Route] verifyRazorpayPayment: Triggering email notifications for appointment.");
      sendBookingConfirmation(appointment.email, appointment.name, {
        date: appointment.date,
        time: appointment.timeSlot,
        service: appointment.service,
      }).then(() => console.log("[Payment Route] Booking confirmation email dispatched successfully."))
        .catch((err) => console.error("[Payment Route] Booking Confirmation Email Failed:", err.message));

      sendAdminAppointmentNotification(appointment)
        .then(() => console.log("[Payment Route] Admin notification email dispatched successfully."))
        .catch((err) => console.error("[Payment Route] Admin Appointment Email Failed:", err.message));

    } else if (type === "product") {
      if (!cartItems || !Array.isArray(cartItems) || cartItems.length === 0) {
        console.warn("[Payment Route] verifyRazorpayPayment: Missing cart items for product purchase.");
        return res.status(400).json({
          success: false,
          message: "Missing shopping cart items.",
        });
      }

      // Create and save order
      console.log("[Payment Route] verifyRazorpayPayment: Creating Order document.");
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

      console.log("[Payment Route] verifyRazorpayPayment: Saving Order to MongoDB.");
      await order.save();
      console.log(`[Payment Route] verifyRazorpayPayment: Order saved successfully. ID: ${order._id}`);
      savedItem = order;
      serviceOrProductLabel = cartItems.map((i) => `${i.name} (${i.quantity})`).join(", ");

      // Trigger Email Notifications (Asynchronous)
      console.log("[Payment Route] verifyRazorpayPayment: Triggering email notifications for product order.");
      sendProductOrderConfirmation(req.user.email, req.user.name, order)
        .then(() => console.log("[Payment Route] Product order confirmation email dispatched successfully."))
        .catch((err) => console.error("[Payment Route] Order Confirmation Email Failed:", err.message));

      sendAdminProductOrderNotification(order, req.user.name, req.user.email)
        .then(() => console.log("[Payment Route] Admin product order email dispatched successfully."))
        .catch((err) => console.error("[Payment Route] Admin Product Order Email Failed:", err.message));
    } else {
      console.warn("[Payment Route] verifyRazorpayPayment: Invalid transaction type received:", type);
      return res.status(400).json({
        success: false,
        message: "Invalid transaction type.",
      });
    }

    // 3. Save transaction record to Payment collection
    console.log("[Payment Route] verifyRazorpayPayment: Creating Payment record in DB.");
    const payment = await Payment.create({
      user: req.user._id,
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      amount: amount,
      status: "success",
      serviceOrProduct: serviceOrProductLabel,
    });
    console.log(`[Payment Route] verifyRazorpayPayment: Payment record created successfully. ID: ${payment._id}`);

    console.log("[Payment Route] verifyRazorpayPayment: Verification process complete. Sending success response.");
    res.status(200).json({
      success: true,
      message: "Payment successfully verified and records created.",
      data: {
        payment,
        item: savedItem,
      },
    });
  } catch (error) {
    console.error("[Payment Route] verifyRazorpayPayment: Exception occurred:", error);
    next(error);
  }
};
