import { findMunicipalityByCoordinates } from '../services/municipalityService.js';

/**
 * @desc    Resolve responsible municipality from confirmed GPS coordinates using GeoJSON 2dsphere spatial intersection
 * @route   POST /api/municipalities/resolve
 * @access  Private (Authenticated users)
 */
export const resolveMunicipality = async (req, res, next) => {
  try {
    const { latitude, longitude } = req.body;

    if (latitude === undefined || longitude === undefined || latitude === null || longitude === null) {
      return res.status(400).json({
        success: false,
        code: 'INVALID_COORDINATES',
        message: 'latitude and longitude are required in request body.',
      });
    }

    const result = await findMunicipalityByCoordinates(latitude, longitude);

    if (!result.success) {
      const statusCode = result.code === 'MUNICIPALITY_NOT_FOUND' ? 404 : 409;
      return res.status(statusCode).json(result);
    }

    res.status(200).json(result);
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        code: error.code || 'INVALID_REQUEST',
        message: error.message,
      });
    }
    next(error);
  }
};
