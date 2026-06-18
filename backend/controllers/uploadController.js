import { uploadFile } from "../utils/storage.js";
import fs from "fs";

/**
 * @desc    Upload an image file
 * @route   POST /api/v1/admin/upload
 * @access  Private (Admin)
 */
export const uploadImage = async (req, res, next) => {
  const caller = req.user ? `${req.user.email} (${req.user.role})` : "Unauthenticated";
  console.log(`[Upload Controller] Image upload request received from: ${caller}`);
  console.log(`[Upload Controller] File present: ${req.file ? "Yes" : "No"}`);

  try {
    if (!req.file) {
      console.warn(`[Upload Controller] Rejected: No image file provided in multipart payload.`);
      return res.status(400).json({
        success: false,
        message: "No image file provided. Please choose a file to upload.",
      });
    }

    console.log(`[Upload Controller] File attributes: OriginalName="${req.file.originalname}" Size=${req.file.size}bytes MimeType="${req.file.mimetype}" TempPath="${req.file.path}"`);

    // Upload to Cloudinary / Vercel Blob / Local Storage
    console.log(`[Upload Controller] Delegating upload to storage utility...`);
    const imageUrl = await uploadFile(req.file);

    console.log(`[Upload Controller] Image upload successful. Resolved URL: ${imageUrl}`);

    return res.status(200).json({
      success: true,
      message: "Image uploaded successfully",
      imageUrl: imageUrl,
    });
  } catch (error) {
    console.error(`[Upload Controller] Upload pipeline failed: ${error.message}`);
    // Make sure to clean up the uploaded local file if there's an error during Cloudinary/Vercel Blob upload
    if (req.file && req.file.path && fs.existsSync(req.file.path)) {
      try {
        console.log(`[Upload Controller] Cleaning up local temp file: ${req.file.path}`);
        fs.unlinkSync(req.file.path);
      } catch (err) {
        console.error(`[Upload Controller] Failed to delete local temp file: ${err.message}`);
      }
    }
    next(error);
  }
};

