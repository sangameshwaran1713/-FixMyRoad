import api from './api';

/**
 * Automatically resolve the responsible municipal authority from confirmed GPS coordinates.
 * Calls Express backend API using GeoJSON 2dsphere spatial intersection query.
 * @param {number} latitude 
 * @param {number} longitude 
 * @returns {Promise<Object>} Resolution response payload
 */
export const resolveMunicipalityApi = async (latitude, longitude) => {
  return await api.post('/municipalities/resolve', {
    latitude,
    longitude,
  });
};
