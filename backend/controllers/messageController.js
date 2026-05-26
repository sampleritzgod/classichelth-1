import Message from "../models/Message.js";

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
