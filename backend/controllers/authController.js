import jwt from "jsonwebtoken";
import User from "../models/User.js";

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
  const cookieOptions = isProd
    ? {
        expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        httpOnly: true,
        secure: true,
        sameSite: "none",
        credentials: true,
      }
    : {
        expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        httpOnly: true,
        secure: false,
        sameSite: "lax",
      };

  // Remove password from output
  user.password = undefined;

  console.log(`[sendTokenResponse] JWT generated successfully for user: ${user.email}`);
  console.log(`[sendTokenResponse] Setting token cookie with options:`, cookieOptions);

  res.status(statusCode).cookie("token", token, cookieOptions).json({
    success: true,
    message: statusCode === 201 ? "User registered successfully" : "Successfully authenticated",
    token,
    user,
    data: {
      user,
    },
  });
};

/**
 * @desc    Register a user
 * @route   POST /api/v1/auth/signup
 * @access  Public
 */
export const signup = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

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
      name,
      email,
      password,
      role: "user", // Default role
    });

    sendTokenResponse(user, 201, req, res);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Validate credentials and authenticate user
 * @route   POST /api/v1/auth/login
 * @access  Public
 */
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Find user and select password field
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
    const cookieOptions = isProd
      ? {
          expires: new Date(0),
          httpOnly: true,
          secure: true,
          sameSite: "none",
          credentials: true,
        }
      : {
          expires: new Date(0),
          httpOnly: true,
          secure: false,
          sameSite: "lax",
        };
    res.cookie("token", "", cookieOptions);

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
    console.log("[GetMe Controller] Retrieving active user session details");
    console.log("[GetMe Controller] User payload resolved from middleware:", req.user ? req.user.email : "None");
    
    // req.user is loaded in the protect middleware
    res.status(200).json({
      success: true,
      user: req.user,
      data: {
        user: req.user,
      },
    });
  } catch (error) {
    console.error("[GetMe Controller] Failed to return user:", error.message);
    next(error);
  }
};

/**
 * @desc    Update details of currently logged in user
 * @route   PUT /api/v1/auth/profile
 * @access  Private
 */
export const updateProfile = async (req, res, next) => {
  try {
    const { name, email } = req.body;
    
    // Find current user
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User session expired or user not found.",
      });
    }

    // Check if new email is already in use by another user
    if (email && email !== user.email) {
      const emailExists = await User.findOne({ email });
      if (emailExists) {
        return res.status(400).json({
          success: false,
          message: "Email address is already in use.",
        });
      }
      user.email = email;
    }

    if (name) {
      user.name = name;
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      data: {
        user,
      },
    });
  } catch (error) {
    next(error);
  }
};
