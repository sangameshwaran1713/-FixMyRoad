import Municipality from '../models/Municipality.js';

/**
 * Validates coordinates and queries MongoDB using $geoIntersects spatial query.
 * @param {number|string} latitude (-90 to 90)
 * @param {number|string} longitude (-180 to 180)
 * @returns {Promise<Object>} Normalized resolution result payload
 */
export const findMunicipalityByCoordinates = async (latitude, longitude) => {
  const lat = parseFloat(latitude);
  const lon = parseFloat(longitude);

  // 1. Coordinate Validation
  if (isNaN(lat) || isNaN(lon)) {
    const error = new Error('Invalid coordinates. Latitude and Longitude must be valid numbers.');
    error.statusCode = 400;
    error.code = 'INVALID_COORDINATES';
    throw error;
  }

  if (lat < -90 || lat > 90 || lon < -180 || lon > 180) {
    const error = new Error('Invalid coordinates range. Latitude must be between -90 and 90, Longitude between -180 and 180.');
    error.statusCode = 400;
    error.code = 'INVALID_COORDINATES';
    throw error;
  }

  // 2. GeoJSON Point Construction: [longitude, latitude]
  const geoJsonPoint = {
    type: 'Point',
    coordinates: [lon, lat], // GeoJSON Standard: Longitude FIRST, Latitude SECOND
  };

  // 3. MongoDB 2dsphere $geoIntersects Spatial Query
  const matchingMunicipalities = await Municipality.find({
    active: true,
    boundary: {
      $geoIntersects: {
        $geometry: geoJsonPoint,
      },
    },
  });

  // 4. Handle Result Scenarios
  if (matchingMunicipalities.length === 1) {
    const match = matchingMunicipalities[0];
    return {
      success: true,
      code: 'MUNICIPALITY_FOUND',
      message: 'Responsible municipality boundary identified successfully',
      data: {
        municipality: {
          id: match._id,
          name: match.name,
          code: match.code,
          state: match.state,
          district: match.district,
          contactEmail: match.contactEmail,
          contactPhone: match.contactPhone,
          notificationMethod: match.notificationMethod,
        },
        coordinates: {
          latitude: lat,
          longitude: lon,
        },
        routingMethod: 'GEOJSON_BOUNDARY',
      },
    };
  }

  if (matchingMunicipalities.length > 1) {
    return {
      success: false,
      code: 'AMBIGUOUS_MUNICIPALITY',
      message: 'Location falls within multiple municipality boundaries',
      candidates: matchingMunicipalities.map((m) => ({
        id: m._id,
        name: m.name,
        code: m.code,
        district: m.district,
      })),
    };
  }

  return {
    success: false,
    code: 'MUNICIPALITY_NOT_FOUND',
    message: 'No active municipality boundary found for this location',
  };
};
