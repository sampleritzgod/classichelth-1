import jwt from "jsonwebtoken";
import User from "../models/User.js";

/**
 * Protect routes by checking for JWT authorization header
 */
export const protect = async (req, res, next) => {
  let token;

  // 1. Obtain token from cookies (priority) or headers
  if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  } else if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    const bearerToken = req.headers.authorization.split(" ")[1];
    if (bearerToken && bearerToken !== "null" && bearerToken !== "undefined") {
      token = bearerToken;
    }
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Access denied. Please log in to proceed.",
    });
  }

  try {
    // Opt-in mock token strictly for local development/testing. Never enabled
    // unless ALLOW_MOCK_AUTH is explicitly set, regardless of NODE_ENV.
    if (token === "mock_token" && process.env.ALLOW_MOCK_AUTH === "true") {
      req.user = {
        _id: "000000000000000000000123",
        name: "Admin Tester",
        email: "admin@example.com",
        role: "admin",
      };
      return next();
    }

    // 2. Verify token (JWT_SECRET is validated at server startup)
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 3. Find user in database
    const currentUser = await User.findById(decoded.id).select("name email role avatar createdAt");

    if (!currentUser) {
      return res.status(401).json({
        success: false,
        message: "The user belonging to this session token no longer exists.",
      });
    }

    // 4. Grant access and store user info in request object
    req.user = currentUser;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid session token. Please log in again.",
    });
  }
};

/**
 * Restrict access to specific user roles
 * @param {...string} roles - Permitted roles (e.g. 'admin', 'practitioner')
 */
export const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: Missing user authentication session.",
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: Access restricted. Required roles: ${roles.join(", ")}`,
      });
    }

    next();
  };
};
