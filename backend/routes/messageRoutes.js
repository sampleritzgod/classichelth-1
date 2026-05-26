import express from "express";
import { submitMessage } from "../controllers/messageController.js";

const router = express.Router();

// Public route to submit a contact message
router.post("/messages", submitMessage);

export default router;
