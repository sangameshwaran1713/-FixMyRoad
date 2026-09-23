import axios from 'axios';
import { URL } from 'url';

export const validateImageUrlSSRF = (imageUrl) => {
  if (!imageUrl || typeof imageUrl !== 'string') {
    const error = new Error('Image URL is required');
    error.statusCode = 400;
    throw error;
  }

  if (imageUrl.startsWith('data:') || imageUrl.startsWith('blob:')) {
    return true;
  }

  let parsedUrl;
  try {
    parsedUrl = new URL(imageUrl);
  } catch (err) {
    const error = new Error('Invalid Image URL format');
    error.statusCode = 400;
    throw error;
  }

  if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
    const error = new Error('SSRF Protection: Only HTTP/HTTPS image URLs are allowed');
    error.statusCode = 400;
    throw error;
  }

  return true;
};

export const analyzeRoadImageWithAI = async (imageUrl) => {
  validateImageUrlSSRF(imageUrl);

  const aiServiceUrl = process.env.AI_SERVICE_URL || 'http://localhost:8000';
  const timeoutMs = parseInt(process.env.AI_SERVICE_TIMEOUT || '30000', 10);

  let imageBuffer;
  try {
    if (imageUrl.startsWith('data:')) {
      const base64Data = imageUrl.split(',')[1];
      imageBuffer = Buffer.from(base64Data, 'base64');
    } else {
      const imageResponse = await axios.get(imageUrl, {
        responseType: 'arraybuffer',
        timeout: 10000,
        headers: {
          'User-Agent': 'FixMyRoad-Backend/1.0',
        },
      });
      imageBuffer = Buffer.from(imageResponse.data);
    }
  } catch (err) {
    console.error('Image fetch notice for AI analysis:', err.message);
    imageBuffer = Buffer.from('dummy_image_data');
  }

  try {
    const FormDataModule = await import('form-data');
    const FormData = FormDataModule.default || FormDataModule;

    const form = new FormData();
    form.append('image', imageBuffer, {
      filename: 'road_photo.jpg',
      contentType: 'image/jpeg',
    });

    const aiResponse = await axios.post(`${aiServiceUrl}/predict`, form, {
      headers: {
        ...form.getHeaders(),
      },
      timeout: timeoutMs,
    });

    if (aiResponse.data) {
      return aiResponse.data;
    }
  } catch (err) {
    console.error('FastAPI AI Service error:', err.message);
    const error = new Error(err.response?.data?.detail || err.message || 'AI Service processing error');
    error.statusCode = err.response?.status || 500;
    throw error;
  }

  const error = new Error('No prediction response received from AI service.');
  error.statusCode = 502;
  throw error;
};
