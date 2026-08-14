import { analyzeRoadImageWithAI } from '../services/aiService.js';

/**
 * @desc    Analyze uploaded road photo using Python FastAPI YOLO microservice
 * @route   POST /api/ai/analyze
 * @access  Private (CITIZEN only)
 */
export const analyzeRoadImage = async (req, res, next) => {
  try {
    const { imageUrl } = req.body;

    if (!imageUrl) {
      return res.status(400).json({
        success: false,
        message: 'imageUrl is required in request payload.',
      });
    }

    const result = await analyzeRoadImageWithAI(imageUrl);

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};
