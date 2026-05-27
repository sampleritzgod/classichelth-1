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

    // Construct the relative path that will be stored in the database
    const relativePath = `/uploads/${req.file.filename}`;

    console.log(`[Upload Controller] Image uploaded successfully. Stored path: ${relativePath}`);

    return res.status(200).json({
      success: true,
      message: "Image uploaded successfully",
      imageUrl: relativePath,
    });
  } catch (error) {
    next(error);
  }
};
