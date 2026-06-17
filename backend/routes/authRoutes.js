import express from "express";
import {
  signup,
  login,
  logout,
  getMe,
  updateProfile,
  registerFCMToken,
} from "../controllers/authController.js";
import { protect } from "../middleware/authMiddleware.js";
import {
  validateSignup,
  validateLogin,
  validateProfileUpdate,
} from "../middleware/validateAuth.js";

const router = express.Router();

router.post("/signup", validateSignup, signup);
router.post("/login", validateLogin, login);
router.post("/logout", logout);
router.get("/me", protect, getMe);
router.put("/profile", protect, validateProfileUpdate, updateProfile);
router.post("/fcm-token", protect, registerFCMToken);

export default router;
