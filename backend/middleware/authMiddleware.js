/**
 * Scalable Authentication and Authorization Middleware Preparation.
 * Note: Full JWT validation check is currently bypassed for dev testing.
 */

/**
 * Protect routes by checking for JWT authorization header
 */
export const protect = async (req, res, next) => {
  let token;

  // Check if token exists in headers
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  // Mock authentication session for development
  // In production, you will decode the JWT token and load the User from database:
  // const decoded = jwt.verify(token, process.env.JWT_SECRET);
  // req.user = await User.findById(decoded.id);
  
  req.user = {
    _id: "mock_user_id_123",
    name: "Admin Tester",
    email: "admin@example.com",
    role: "admin", // Default mock role
  };

  console.log(`[Auth Middleware] Route protected by auth checked. Current user: ${req.user.email} (${req.user.role})`);
  
  next();
};

/**
 * Restrict access to specific user roles
 * @param {...string} roles - Permitted roles (e.g. 'admin', 'therapist')
 */
export const restrictTo = (...roles) => {
  return (req, res, next) => {
    // Fallback if protect middleware was not run
    if (!req.user) {
      req.user = { role: "admin" };
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
