/**
 * Middleware to validate and sanitize appointment request data
 */
export const validateAppointment = (req, res, next) => {
  const errors = {};
  const sanitized = {};

  const requiredFields = ["name", "email", "phone", "date", "timeSlot"];

  // 1. Sanitization: Trim strings and strip basic HTML tags to prevent XSS
  const sanitizeString = (val) => {
    if (typeof val !== "string") return "";
    return val
      .trim()
      // Remove basic HTML tag structures like <script>...</script> or generic tags
      .replace(/<[^>]*>/g, "");
  };

  // Pre-sanitize all body inputs
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

  const { name, email, phone, date, timeSlot } = req.body;

  // 2. Validate Required Fields
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

  // 3. Email Format Validation
  const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
  if (!emailRegex.test(email)) {
    errors.email = "Please provide a valid email address (e.g. name@example.com)";
  }

  // 4. Phone Number Validation (digits, optional +, length 10 to 15)
  // Strip out spaces, dashes, or parentheses first to evaluate true length
  const cleanPhone = phone.replace(/[\s()-]/g, "");
  const phoneRegex = /^\+?[0-9]{10,15}$/;
  if (!phoneRegex.test(cleanPhone)) {
    errors.phone = "Phone number must contain only numbers and be between 10 and 15 digits long";
  }

  // 5. Date Validation
  const parsedDate = Date.parse(date);
  if (isNaN(parsedDate)) {
    errors.date = "Please provide a valid date";
  } else if (new Date(date) < new Date().setHours(0, 0, 0, 0)) {
    errors.date = "Appointment date cannot be in the past";
  }

  // If there are validation errors, return them
  if (Object.keys(errors).length > 0) {
    return res.status(400).json({
      success: false,
      message: "Validation Failed",
      errors,
    });
  }

  // Validation succeeded, call next middleware/controller
  next();
};
