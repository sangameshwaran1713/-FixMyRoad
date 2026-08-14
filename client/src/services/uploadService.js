import api from './api';

/**
 * Uploads a road damage photo file to Express backend.
 * Express server validates, processes, and stores the image on Cloudinary before returning a secure URL.
 * @param {File} file - Selected image file object
 * @returns {Promise<Object>} API response payload with secure imageUrl and metadata
 */
export const uploadRoadImage = async (file) => {
  const formData = new FormData();
  formData.append('image', file);

  return await api.post('/uploads/road-image', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};
