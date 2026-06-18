import { uploadFile } from "../utils/storage.js";
import fs from "fs";

/**
 * @desc    Upload an image file
 * @route   POST /api/v1/admin/upload
 * @access  Private (Admin)
 */
export const uploadImage = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No image file provided. Please choose a file to upload.",
      });
    }

    // Upload to Cloudinary / Vercel Blob / Local Storage
    const imageUrl = await uploadFile(req.file);

    console.log(`[Upload Controller] Image uploaded successfully. URL: ${imageUrl}`);

    return res.status(200).json({
      success: true,
      message: "Image uploaded successfully",
      imageUrl: imageUrl,
    });
  } catch (error) {
    // Make sure to clean up the uploaded local file if there's an error during Cloudinary/Vercel Blob upload
    if (req.file && req.file.path && fs.existsSync(req.file.path)) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (err) {
        console.error("Failed to delete temp file:", err);
      }
    }
    next(error);
  }
};

