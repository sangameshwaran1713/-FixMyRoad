import api from './api';

/**
 * Perform reverse geocoding to convert lat/lon coordinates into a human-readable address.
 * Calls Express backend API (React never calls Nominatim directly).
 * @param {number} latitude 
 * @param {number} longitude 
 * @returns {Promise<Object>} Normalized address object
 */
export const reverseGeocodeApi = async (latitude, longitude) => {
  return await api.get('/geocoding/reverse', {
    params: {
      lat: latitude,
      lon: longitude,
    },
  });
};
