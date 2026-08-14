import { processAndUploadRoadImage } from '../services/imageUploadService.js';

/**
 * @desc    Upload & process road damage image
 * @route   POST /api/uploads/road-image
 * @access  Private (CITIZEN only)
 */
export const uploadRoadImage = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No image file provided. Please attach a valid road photo under "image" field.',
      });
    }

    // Process image with Sharp and stream to Cloudinary
    const result = await processAndUploadRoadImage(req.file.buffer, {
      userId: req.user._id,
    });

    res.status(200).json({
      success: true,
      message: 'Road image uploaded successfully',
      data: {
        imageUrl: result.imageUrl,
        publicId: result.publicId,
        width: result.width,
        height: result.height,
        format: result.format,
        size: result.size,
      },
    });
  } catch (error) {
    next(error);
  }
};
