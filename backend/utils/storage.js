import fs from "fs";
import { v2 as cloudinary } from "cloudinary";
import { put } from "@vercel/blob";

/**
 * Uploads a local file to Cloudinary or Vercel Blob, falls back to local storage
 * @param {Object} file Multer file object
 * @returns {Promise<string>} The uploaded image URL (either Cloudinary/Vercel Blob secure URL, or local relative path)
 */
export const uploadFile = async (file) => {
  const filePath = file.path;

  // 1. Try Cloudinary
  if (
    (process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET) ||
    process.env.CLOUDINARY_URL
  ) {
    try {
      console.log("[Storage Service] Configuring Cloudinary...");
      if (process.env.CLOUDINARY_URL) {
        cloudinary.config();
      } else {
        cloudinary.config({
          cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
          api_key: process.env.CLOUDINARY_API_KEY,
          api_secret: process.env.CLOUDINARY_API_SECRET,
        });
      }

      console.log(`[Storage Service] Uploading ${filePath} to Cloudinary...`);
      const result = await cloudinary.uploader.upload(filePath, {
        folder: "classic_health_blogs",
      });

      console.log(`[Storage Service] Cloudinary upload successful: ${result.secure_url}`);
      
      // Clean up temp file
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      return result.secure_url;
    } catch (error) {
      console.error("[Storage Service] Cloudinary upload failed:", error);
      throw error;
    }
  }

  // 2. Try Vercel Blob
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    try {
      console.log(`[Storage Service] Uploading ${filePath} to Vercel Blob...`);
      const fileBuffer = fs.readFileSync(filePath);
      const blob = await put(file.filename, fileBuffer, {
        access: "public",
        token: process.env.BLOB_READ_WRITE_TOKEN,
      });

      console.log(`[Storage Service] Vercel Blob upload successful: ${blob.url}`);

      // Clean up temp file
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      return blob.url;
    } catch (error) {
      console.error("[Storage Service] Vercel Blob upload failed:", error);
      throw error;
    }
  }

  // 3. Fallback to Local Storage path
  console.warn(
    "[Storage Service] Cloudinary or Vercel Blob credentials not found. Falling back to local storage."
  );
  // We keep the file in the local `./uploads` directory as-is and return the relative path.
  return `/uploads/${file.filename}`;
};
