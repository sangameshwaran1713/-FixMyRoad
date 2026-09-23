import Municipality from '../models/Municipality.js';

/**
 * Validates coordinates and queries MongoDB using $geoIntersects spatial query.
 * Falls back to default Central Municipality if location falls outside seeded polygons.
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
  let matchingMunicipalities = [];
  try {
    matchingMunicipalities = await Municipality.find({
      active: true,
      boundary: {
        $geoIntersects: {
          $geometry: geoJsonPoint,
        },
      },
    });
  } catch (err) {
    console.error('Spatial query notice:', err.message);
  }

  // 4. Handle Spatial Intersection Result
  if (matchingMunicipalities.length >= 1) {
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

  // 5. Fallback: Find any active municipality or auto-seed Central Metro Corporation
  let defaultMun = await Municipality.findOne({ active: true });
  if (!defaultMun) {
    defaultMun = await Municipality.create({
      name: 'Central Metro Municipal Corporation',
      code: 'MUN001',
      state: 'Tamil Nadu',
      district: 'Chennai Central',
      contactEmail: 'central.metro@municipality.demo.gov',
      contactPhone: '+91 44 2530 0001',
      notificationMethod: 'DASHBOARD',
      active: true,
      boundary: {
        type: 'Polygon',
        coordinates: [
          [
            [-180, -90],
            [180, -90],
            [180, 90],
            [-180, 90],
            [-180, -90]
          ]
        ]
      }
    });
  }

  return {
    success: true,
    code: 'MUNICIPALITY_FOUND',
    message: 'Responsible municipal jurisdiction assigned via default routing',
    data: {
      municipality: {
        id: defaultMun._id,
        name: defaultMun.name,
        code: defaultMun.code,
        state: defaultMun.state,
        district: defaultMun.district,
        contactEmail: defaultMun.contactEmail,
        contactPhone: defaultMun.contactPhone,
        notificationMethod: defaultMun.notificationMethod,
      },
      coordinates: {
        latitude: lat,
        longitude: lon,
      },
      routingMethod: 'DEFAULT_MUNICIPALITY_ASSIGNMENT',
    },
  };
};
