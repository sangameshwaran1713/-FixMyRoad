import { reverseGeocode } from '../services/geocodingService.js';

/**
 * @desc    Reverse geocode coordinates to retrieve normalized address
 * @route   GET /api/geocoding/reverse?lat=<latitude>&lon=<longitude>
 * @access  Private (Authenticated users only)
 */
export const getReverseGeocode = async (req, res, next) => {
  try {
    const { lat, lon } = req.query;

    if (lat === undefined || lon === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Latitude (lat) and Longitude (lon) query parameters are required.',
      });
    }

    const data = await reverseGeocode(lat, lon);

    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};
