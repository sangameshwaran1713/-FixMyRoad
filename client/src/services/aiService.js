import api from './api';

/**
 * Triggers AI analysis for a uploaded road image URL via Express backend proxy to Python FastAPI.
 * @param {string} imageUrl - Secure Cloudinary image URL
 * @returns {Promise<Object>} AI analysis prediction output (detections, primaryIssue, confidence, severity)
 */
export const analyzeRoadImageApi = async (imageUrl) => {
  return await api.post('/ai/analyze', { imageUrl });
};
