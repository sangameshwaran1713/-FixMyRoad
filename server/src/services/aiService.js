import axios from 'axios';
import { URL } from 'url';

/**
 * Validates image URL against Server-Side Request Forgery (SSRF) risks.
 * Restricts hostnames strictly to permitted public image hosts (e.g. Cloudinary, Unsplash).
 */
export const validateImageUrlSSRF = (imageUrl) => {
  if (!imageUrl || typeof imageUrl !== 'string') {
    const error = new Error('Image URL is required');
    error.statusCode = 400;
    throw error;
  }

  let parsedUrl;
  try {
    parsedUrl = new URL(imageUrl);
  } catch (err) {
    const error = new Error('Invalid Image URL format');
    error.statusCode = 400;
    throw error;
  }

  // Enforce HTTP / HTTPS protocol
  if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
    const error = new Error('SSRF Protection: Only HTTP/HTTPS image URLs are allowed');
    error.statusCode = 400;
    throw error;
  }

  const hostname = parsedUrl.hostname.toLowerCase();

  // Block private, loopback, link-local, and internal metadata IP ranges
  const isPrivateOrInternal =
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname === '::1' ||
    hostname === '0.0.0.0' ||
    hostname.startsWith('169.254.') || // AWS metadata
    hostname.startsWith('10.') ||
    hostname.startsWith('192.168.') ||
    /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(hostname);

  if (isPrivateOrInternal) {
    const error = new Error('SSRF Protection: Internal/private IP addresses are forbidden');
    error.statusCode = 400;
    throw error;
  }

  // Verify hostname matches allowed Cloudinary / Demo hosts
  const allowedHostPattern = process.env.CLOUDINARY_ALLOWED_HOST || 'cloudinary.com';
  const isAllowedHost =
    hostname.endsWith(allowedHostPattern) ||
    hostname.endsWith('res.cloudinary.com') ||
    hostname.endsWith('images.unsplash.com') ||
    hostname.endsWith('unsplash.com');

  if (!isAllowedHost) {
    const error = new Error(`SSRF Protection: Host '${hostname}' is not permitted for AI image analysis.`);
    error.statusCode = 400;
    throw error;
  }

  return true;
};

/**
 * Downloads secure image from Cloudinary and forwards payload to FastAPI AI prediction endpoint.
 */
export const analyzeRoadImageWithAI = async (imageUrl) => {
  // 1. SSRF URL validation
  validateImageUrlSSRF(imageUrl);

  const aiServiceUrl = process.env.AI_SERVICE_URL || 'http://localhost:8000';
  const timeoutMs = parseInt(process.env.AI_SERVICE_TIMEOUT || '30000', 10);

  // 2. Fetch image bytes securely from validated host
  let imageBuffer;
  try {
    const imageResponse = await axios.get(imageUrl, {
      responseType: 'arraybuffer',
      timeout: 10000,
      headers: {
        'User-Agent': 'FixMyRoad-Backend/1.0',
      },
    });
    imageBuffer = Buffer.from(imageResponse.data);
  } catch (err) {
    const error = new Error('Failed to download validated road image for AI analysis.');
    error.statusCode = 400;
    throw error;
  }

  // 3. Construct FormData & post to Python FastAPI /predict endpoint
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

    return aiResponse.data;
  } catch (err) {
    if (err.response && err.response.data) {
      const data = err.response.data;
      if (data.modelLoaded === false) {
        return {
          success: false,
          modelLoaded: false,
          modelName: data.modelName || 'road_damage.pt',
          detections: [],
          primaryIssue: null,
          overallConfidence: 0,
          severity: 'LOW',
          message: data.message || 'Road damage AI model is not configured. Please place road_damage.pt in ai-service/models/ directory.',
        };
      }
    }

    console.error('❌ FastAPI Service Error:', err.message);
    const error = new Error('AI analysis service is temporarily unavailable.');
    error.statusCode = 503;
    throw error;
  }
};
