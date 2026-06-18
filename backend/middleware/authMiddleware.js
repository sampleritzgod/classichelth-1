import jwt from "jsonwebtoken";
import User from "../models/User.js";

/**
 * Protect routes by checking for JWT authorization header
 */
export const protect = async (req, res, next) => {
  let token;

  console.log(`[Auth Middleware] Authenticating request: ${req.method} ${req.originalUrl}`);
  console.log(`[Auth Middleware] Cookies: ${req.cookies ? Object.keys(req.cookies).join(", ") : "None"}`);
  console.log(`[Auth Middleware] Authorization Header: ${req.headers.authorization ? "Present" : "Absent"}`);

  // 1. Obtain token from cookies (priority) or headers
  if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
    console.log("[Auth Middleware] Found token in cookies.");
  } else if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    const bearerToken = req.headers.authorization.split(" ")[1];
    if (bearerToken && bearerToken !== "null" && bearerToken !== "undefined") {
      token = bearerToken;
      console.log("[Auth Middleware] Found token in Authorization header.");
    }
  }

  if (!token) {
    console.warn("[Auth Middleware] Access denied: No token provided.");
    return res.status(401).json({
      success: false,
      message: "Access denied. Please log in to proceed.",
    });
  }

  try {
    // Opt-in mock token strictly for local development/testing. Never enabled
    // unless ALLOW_MOCK_AUTH is explicitly set, regardless of NODE_ENV.
    if (token === "mock_token" && process.env.ALLOW_MOCK_AUTH === "true") {
      console.log("[Auth Middleware] Authenticating with developer mock token.");
      req.user = {
        _id: "000000000000000000000123",
        name: "Admin Tester",
        email: "admin@example.com",
        role: "admin",
      };
      return next();
    }

    // 2. Verify token (JWT_SECRET is validated at server startup)
    console.log("[Auth Middleware] Verifying JWT token...");
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log(`[Auth Middleware] JWT verified successfully. User ID: ${decoded.id}`);

    // 3. Find user in database
    const currentUser = await User.findById(decoded.id).select("name email role avatar createdAt");

    if (!currentUser) {
      console.warn(`[Auth Middleware] Database lookup failed: User ID ${decoded.id} not found.`);
      return res.status(401).json({
        success: false,
        message: "The user belonging to this session token no longer exists.",
      });
    }

    console.log(`[Auth Middleware] Successfully authenticated as user: ${currentUser.email} (${currentUser.role})`);

    // 4. Automatic Token Refresh
    // Check if token expires in less than 2 days (172800 seconds)
    const timeRemaining = decoded.exp - Math.floor(Date.now() / 1000);
    if (timeRemaining > 0 && timeRemaining < 2 * 24 * 60 * 60) {
      console.log(`[Auth Middleware] Token is close to expiry (${Math.round(timeRemaining / 3600)} hours remaining). Refreshing...`);
      const newToken = jwt.sign({ id: decoded.id }, process.env.JWT_SECRET, {
        expiresIn: "7d",
      });

      // Send refreshed token in custom response header
      res.setHeader("X-Refresh-Token", newToken);
      res.setHeader("Access-Control-Expose-Headers", "X-Refresh-Token");

      // Also set updated cookie
      const isProd = process.env.NODE_ENV === "production";
      const cookieOptions = isProd
        ? {
            expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            httpOnly: true,
            secure: true,
            sameSite: "none",
            credentials: true,
          }
        : {
            expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            httpOnly: true,
            secure: false,
            sameSite: "lax",
          };
      res.cookie("token", newToken, cookieOptions);
      console.log("[Auth Middleware] Refreshed token set in header and cookie.");
    }

    // 5. Grant access and store user info in request object
    req.user = currentUser;
    next();
  } catch (error) {
    console.error(`[Auth Middleware] Token validation failed: ${error.message}`);
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
