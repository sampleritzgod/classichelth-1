/**
 * Middleware to validate and sanitize blog creation and update request data
 */
export const validateBlog = (req, res, next) => {
  const errors = {};
  const sanitized = {};

  const requiredFields = ["title", "snippet", "content", "image", "category"];

  // Sanitization helper
  const sanitizeString = (val, stripHtml = true) => {
    if (typeof val !== "string") return "";
    let clean = val.trim();
    if (stripHtml) {
      clean = clean.replace(/<[^>]*>/g, ""); // strip HTML tags
    } else {
      // Remove any malicious script tags specifically to prevent XSS while allowing formatting HTML
      clean = clean.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "");
    }
    return clean;
  };

  // Pre-sanitize inputs
  for (const key in req.body) {
    if (Object.prototype.hasOwnProperty.call(req.body, key)) {
      if (typeof req.body[key] === "string" && key !== "image") {
        // Allow formatting HTML in the main blog content body, but strip in other fields
        const stripHtml = key !== "content";
        sanitized[key] = sanitizeString(req.body[key], stripHtml);
      } else {
        sanitized[key] = req.body[key];
      }
    }
  }

  // Update request body with sanitized data
  req.body = sanitized;

  const { title, snippet, content, image, category } = req.body;

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

  // 2. Validate Category Enum
  const validCategories = ["Mindfulness", "Nutrition", "Lifestyle"];
  if (!validCategories.includes(category)) {
    errors.category = `Category must be one of: ${validCategories.join(", ")}`;
  }

  // 3. Image Validation (Size limit and type check)
  if (typeof image !== "string") {
    errors.image = "Image must be a valid URL or Base64 string";
  } else {
    const isUrl = image.startsWith("http://") || image.startsWith("https://") || image.startsWith("/images/") || image.startsWith("/uploads/");
    const isBase64 = image.startsWith("data:image/");

    if (!isUrl && !isBase64) {
      errors.image = "Image must be a valid http/https URL, local path (starting with /images/ or /uploads/), or base64 data URI";
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
