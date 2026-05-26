import jwt from "jsonwebtoken";
import crypto from "crypto";
import User from "../models/User.js";
import { sendPasswordResetEmail } from "../services/mailService.js";

// Helper function to sign JWT token
const signToken = (id) => {
  return jwt.sign(
    { id },
    process.env.JWT_SECRET || "your_jwt_secret_key_here_change_in_production",
    {
      expiresIn: "7d",
    }
  );
};

// Helper function to send token in cookie
const sendTokenResponse = (user, statusCode, req, res) => {
  const token = signToken(user._id);

  const isProd = process.env.NODE_ENV === "production";
  const cookieOptions = {
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "none" : "lax",
  };

  // Remove password from output
  user.password = undefined;

  res.status(statusCode).cookie("token", token, cookieOptions).json({
    success: true,
    message: statusCode === 201 ? "User registered successfully" : "Successfully authenticated",
    token,
    data: {
      user,
    },
  });
};

/**
 * @desc    Register a local user
 * @route   POST /api/v1/auth/signup
 * @access  Public
 */
export const signup = async (req, res, next) => {
  try {
    const { fullName, email, password, phone } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Email address is already registered.",
      });
    }

    // Create user
    const user = await User.create({
      fullName,
      email,
      password,
      phone,
      provider: "local",
    });

    sendTokenResponse(user, 201, req, res);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Validate credentials and authenticate local user
 * @route   POST /api/v1/auth/login
 * @access  Public
 */
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // 1. Check if email and password are provided
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide both email and password.",
      });
    }

    // 2. Find user and select password field
    const user = await User.findOne({ email }).select("+password");

    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({
        success: false,
        message: "Incorrect email or password.",
      });
    }

    sendTokenResponse(user, 200, req, res);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Clear auth cookie / log out user
 * @route   POST /api/v1/auth/logout
 * @access  Public
 */
export const logout = async (req, res, next) => {
  try {
    const isProd = process.env.NODE_ENV === "production";
    res.cookie("token", "none", {
      expires: new Date(Date.now() + 10 * 1000),
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? "none" : "lax",
    });

    res.status(200).json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get details of currently logged in user
 * @route   GET /api/v1/auth/me
 * @access  Private
 */
export const getMe = async (req, res, next) => {
  try {
    // req.user is loaded in the protect middleware
    res.status(200).json({
      success: true,
      data: {
        user: req.user,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Generate password reset token and send email
 * @route   POST /api/v1/auth/forgot-password
 * @access  Public
 */
export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "There is no user with that email address.",
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(20).toString("hex");

    // Hash token and set database fields
    const hashedToken = crypto.createHash("sha256").update(resetToken).digest("hex");
    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 minutes

    await user.save({ validateBeforeSave: false });

    // Create reset URL (should redirect to client page)
    const frontendUrl = process.env.CORS_ORIGIN 
      ? process.env.CORS_ORIGIN.split(",")[0] 
      : "http://localhost:3000";
    
    const resetUrl = `${frontendUrl}/reset-password?token=${resetToken}`;

    try {
      await sendPasswordResetEmail(user.email, user.fullName, resetUrl);
      
      res.status(200).json({
        success: true,
        message: "Password reset link sent to your email.",
      });
    } catch (err) {
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save({ validateBeforeSave: false });

      console.error("Mail send error:", err);
      return res.status(500).json({
        success: false,
        message: "Email could not be sent. Please try again later.",
      });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Validate token and update password
 * @route   POST /api/v1/auth/reset-password/:token
 * @access  Public
 */
export const resetPassword = async (req, res, next) => {
  try {
    // Get hashed token
    const hashedToken = crypto
      .createHash("sha256")
      .update(req.params.token)
      .digest("hex");

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired reset token.",
      });
    }

    // Set new password
    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    sendTokenResponse(user, 200, req, res);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Verify Google idToken and find/create user
 * @route   POST /api/v1/auth/google
 * @access  Public
 */
export const googleLogin = async (req, res, next) => {
  try {
    const { idToken } = req.body;

    if (!idToken) {
      return res.status(400).json({
        success: false,
        message: "Google idToken is required.",
      });
    }

    // Verify token using Google's public tokeninfo endpoint
    const response = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`);
    const tokenInfo = await response.json();

    if (tokenInfo.error || !tokenInfo.email) {
      return res.status(400).json({
        success: false,
        message: "Invalid Google token.",
      });
    }

    const { email, name, picture } = tokenInfo;

    // Check if user already exists
    let user = await User.findOne({ email });

    if (user) {
      // Auto-link/update profile picture if not present
      if (!user.profileImage && picture) {
        user.profileImage = picture;
        await user.save({ validateBeforeSave: false });
      }
    } else {
      // Create new user
      user = await User.create({
        fullName: name || "Google User",
        email,
        provider: "google",
        profileImage: picture || "",
        isVerified: true,
      });
    }

    sendTokenResponse(user, 200, req, res);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Verify Facebook accessToken and find/create user
 * @route   POST /api/v1/auth/facebook
 * @access  Public
 */
export const facebookLogin = async (req, res, next) => {
  try {
    const { accessToken } = req.body;

    if (!accessToken) {
      return res.status(400).json({
        success: false,
        message: "Facebook accessToken is required.",
      });
    }

    // Verify token using Facebook Graph API
    const response = await fetch(
      `https://graph.facebook.com/me?fields=id,name,email,picture.type(large)&access_token=${accessToken}`
    );
    const fbInfo = await response.json();

    if (fbInfo.error || !fbInfo.email) {
      return res.status(400).json({
        success: false,
        message: "Invalid Facebook token or missing email permission.",
      });
    }

    const { email, name, picture } = fbInfo;
    const pictureUrl = picture?.data?.url || "";

    // Check if user already exists
    let user = await User.findOne({ email });

    if (user) {
      // Auto-link/update profile picture if not present
      if (!user.profileImage && pictureUrl) {
        user.profileImage = pictureUrl;
        await user.save({ validateBeforeSave: false });
      }
    } else {
      // Create new user
      user = await User.create({
        fullName: name || "Facebook User",
        email,
        provider: "facebook",
        profileImage: pictureUrl,
        isVerified: true,
      });
    }

    sendTokenResponse(user, 200, req, res);
  } catch (error) {
    next(error);
  }
};
