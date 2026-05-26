import Message from "../models/Message.js";
import { sendAdminMessageNotification } from "../services/mailService.js";

/**
 * @desc    Submit a contact inquiry message
 * @route   POST /api/v1/messages
 * @access  Public
 */
export const submitMessage = async (req, res, next) => {
  try {
    const { name, email, message } = req.body;

    const savedMessage = await Message.create({
      name,
      email,
      message,
    });

    // Notify admin email asynchronously
    sendAdminMessageNotification(savedMessage).catch((err) => {
      console.error("✉️ Failed to send admin message notification:", err.message);
    });

    res.status(201).json({
      success: true,
      message: "Message sent successfully! We will get back to you soon.",
      data: savedMessage,
    });
  } catch (error) {
    if (error.name === "ValidationError") {
      res.status(400);
    }
    next(error);
  }
};
