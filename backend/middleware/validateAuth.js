/**
 * Middleware to validate and sanitize authentication and profile data
 */

const sanitizeString = (val) => {
  if (typeof val !== "string") return "";
  return val
    .trim()
    .replace(/<[^>]*>/g, ""); // strip basic HTML tags to prevent XSS
};

export const validateSignup = (req, res, next) => {
  const errors = {};
  
  // Sanitize inputs
  if (req.body.name) req.body.name = sanitizeString(req.body.name);
  if (req.body.email) req.body.email = sanitizeString(req.body.email).toLowerCase();
  
  const { name, email, password } = req.body;

  // Validate Name
  if (!name || name.trim() === "") {
    errors.name = "Name is required";
  }

  // Validate Email
  if (!email || email.trim() === "") {
    errors.email = "Email is required";
  } else {
    const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
    if (!emailRegex.test(email)) {
      errors.email = "Please provide a valid email address";
    }
  }

  // Validate Password
  if (!password || password.length < 6) {
    errors.password = "Password must be at least 6 characters long";
  }

  if (Object.keys(errors).length > 0) {
    return res.status(400).json({
      success: false,
      message: "Validation Failed",
      errors,
    });
  }

  next();
};

export const validateLogin = (req, res, next) => {
  const errors = {};

  // Sanitize inputs
  if (req.body.email) req.body.email = sanitizeString(req.body.email).toLowerCase();

  const { email, password } = req.body;

  // Validate Email
  if (!email || email.trim() === "") {
    errors.email = "Email is required";
  } else {
    const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
    if (!emailRegex.test(email)) {
      errors.email = "Please provide a valid email address";
    }
  }

  // Validate Password
  if (!password || password.trim() === "") {
    errors.password = "Password is required";
  }

  if (Object.keys(errors).length > 0) {
    return res.status(400).json({
      success: false,
      message: "Validation Failed",
      errors,
    });
  }

  next();
};

export const validateProfileUpdate = (req, res, next) => {
  const errors = {};

  // Sanitize inputs
  if (req.body.name) req.body.name = sanitizeString(req.body.name);
  if (req.body.email) req.body.email = sanitizeString(req.body.email).toLowerCase();

  const { name, email } = req.body;

  // Validate Name if provided
  if (name !== undefined && name.trim() === "") {
    errors.name = "Name cannot be empty";
  }

  // Validate Email if provided
  if (email !== undefined) {
    if (email.trim() === "") {
      errors.email = "Email cannot be empty";
    } else {
      const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
      if (!emailRegex.test(email)) {
        errors.email = "Please provide a valid email address";
      }
    }
  }

  if (Object.keys(errors).length > 0) {
    return res.status(400).json({
      success: false,
      message: "Validation Failed",
      errors,
    });
  }

  next();
};
