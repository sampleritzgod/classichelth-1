/**
 * Middleware to validate and sanitize contact message submissions
 */
export const validateMessage = (req, res, next) => {
  const errors = {};
  const sanitized = {};

  const requiredFields = ["name", "email", "message"];

  // Sanitization helper
  const sanitizeString = (val) => {
    if (typeof val !== "string") return "";
    return val
      .trim()
      .replace(/<[^>]*>/g, ""); // strip HTML tags
  };

  // Pre-sanitize inputs
  for (const key in req.body) {
    if (Object.prototype.hasOwnProperty.call(req.body, key)) {
      if (typeof req.body[key] === "string") {
        sanitized[key] = sanitizeString(req.body[key]);
      } else {
        sanitized[key] = req.body[key];
      }
    }
  }

  // Update request body with sanitized data
  req.body = sanitized;

  const { name, email, message } = req.body;

  // 1. Validate Required Fields
  requiredFields.forEach((field) => {
    if (!req.body[field] || req.body[field].toString().trim() === "") {
      errors[field] = `${field.charAt(0).toUpperCase() + field.slice(1)} is required`;
    }
  });

  // If any required field is missing, stop early and return errors
  if (Object.keys(errors).length > 0) {
    return res.status(400).json({
      success: false,
      message: "Validation Failed",
      errors,
    });
  }

  // 2. Validate Email Format
  const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
  if (!emailRegex.test(email)) {
    errors.email = "Please provide a valid email address";
  }

  // 3. Validate Message Length (Min 10 characters)
  if (message.length < 10) {
    errors.message = "Message must be at least 10 characters long";
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
