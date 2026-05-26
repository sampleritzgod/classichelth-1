import jwt from "jsonwebtoken";
import User from "../models/User.js";

/**
 * Protect routes by checking for JWT authorization header
 */
export const protect = async (req, res, next) => {
  console.log("[Auth Middleware] Execution started");
  console.log("[Auth Middleware] Cookies received:", req.cookies);
  console.log("[Auth Middleware] Authorization header:", req.headers.authorization);

  let token;

  // 1. Obtain token from cookies (priority) or headers
  if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
    console.log("[Auth Middleware] Token obtained from cookie");
  } else if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    const bearerToken = req.headers.authorization.split(" ")[1];
    if (bearerToken && bearerToken !== "null" && bearerToken !== "undefined") {
      token = bearerToken;
      console.log("[Auth Middleware] Token obtained from Authorization header");
    }
  }

  console.log("[Auth Middleware] Final token extracted:", token ? `${token.substring(0, 15)}...` : "None");

  if (!token) {
    console.warn("[Auth Middleware] Verification failed: No token found");
    return res.status(401).json({
      success: false,
      message: "Access denied. Please log in to proceed.",
    });
  }

  try {
    // Development fallback mock token (if specified in env or if it's explicitly 'mock_token' in dev node env)
    if (token === "mock_token" && process.env.NODE_ENV === "development") {
      console.log("[Auth Middleware] Development mock token detected");
      req.user = {
        _id: "mock_user_id_123",
        name: "Admin Tester",
        email: "admin@example.com",
        role: "admin",
      };
      return next();
    }

    // 2. Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "your_jwt_secret_key_here_change_in_production");
    console.log("[Auth Middleware] JWT verified successfully. Decoded payload:", decoded);

    // 3. Find user in database
    const currentUser = await User.findById(decoded.id);

    if (!currentUser) {
      console.warn("[Auth Middleware] Verification failed: User no longer exists");
      return res.status(401).json({
        success: false,
        message: "The user belonging to this session token no longer exists.",
      });
    }

    // 4. Grant access and store user info in request object
    console.log("[Auth Middleware] User successfully authenticated:", currentUser.email);
    req.user = currentUser;
    next();
  } catch (error) {
    console.error("[Auth Middleware] JWT Verification Error:", error.message);
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
