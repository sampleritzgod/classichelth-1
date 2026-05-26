import express from "express";
import { submitMessage } from "../controllers/messageController.js";
import { validateMessage } from "../middleware/validateMessage.js";

const router = express.Router();

// Public route to submit a contact message
router.post("/messages", validateMessage, submitMessage);

export default router;
