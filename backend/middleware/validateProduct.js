/**
 * Middleware to validate and sanitize product creation and update request data
 */
export const validateProduct = (req, res, next) => {
  const errors = {};
  const sanitized = {};

  const requiredFields = ["name", "price", "originalPrice", "image", "category", "alt", "usage"];

  // Sanitization: Trim strings and strip basic HTML tags to prevent XSS
  const sanitizeString = (val) => {
    if (typeof val !== "string") return "";
    return val
      .trim()
      .replace(/<[^>]*>/g, ""); // strip HTML tags
  };

  // Pre-sanitize all body inputs
  for (const key in req.body) {
    if (Object.prototype.hasOwnProperty.call(req.body, key)) {
      if (typeof req.body[key] === "string" && key !== "image") {
        sanitized[key] = sanitizeString(req.body[key]);
      } else {
        sanitized[key] = req.body[key];
      }
    }
  }

  // Update request body with sanitized data
  req.body = sanitized;

  const { name, price, originalPrice, image, category, alt, usage } = req.body;

  // 1. Validate Required Fields
  requiredFields.forEach((field) => {
    if (req.body[field] === undefined || req.body[field] === null || req.body[field].toString().trim() === "") {
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

  // 2. Validate Price (Must be positive number)
  const numPrice = Number(price);
  if (isNaN(numPrice) || numPrice < 0) {
    errors.price = "Price must be a positive number";
  }

  // 3. Validate Original Price (Must be positive number and >= price)
  const numOriginalPrice = Number(originalPrice);
  if (isNaN(numOriginalPrice) || numOriginalPrice < 0) {
    errors.originalPrice = "Original price must be a positive number";
  } else if (numOriginalPrice < numPrice) {
    errors.originalPrice = "Original price cannot be less than selling price";
  }

  // 4. Validate Category Enum
  const validCategories = ["Supplements", "Tonics & Syrups", "Wellness Oils"];
  if (!validCategories.includes(category)) {
    errors.category = `Category must be one of: ${validCategories.join(", ")}`;
  }

  // 5. Image Validation (Size limit and type check)
  if (typeof image !== "string") {
    errors.image = "Image must be a valid URL or Base64 string";
  } else {
    const isUrl = image.startsWith("http://") || image.startsWith("https://") || image.startsWith("/images/");
    const isBase64 = image.startsWith("data:image/");

    if (!isUrl && !isBase64) {
      errors.image = "Image must be a valid http/https URL, local path, or base64 data URI";
    }

    if (isBase64) {
      // Check base64 size (limit payload size to ~2.5MB / 3,500,000 chars)
      if (image.length > 3500000) {
        errors.image = "Base64 image upload is too large. Max size allowed is 2.5MB.";
      }
      
      const base64Regex = /^data:image\/[a-zA-Z+-]+;base64,/;
      if (!base64Regex.test(image)) {
        errors.image = "Base64 image is not formatted correctly.";
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
