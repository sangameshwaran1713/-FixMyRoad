import sharp from 'sharp';
import cloudinary from '../config/cloudinary.js';

/**
 * Validates, processes, and uploads a road image buffer to Cloudinary.
 * @param {Buffer} buffer - Image buffer from Multer
 * @param {String|Object} folderOrOptions - Destination folder or options
 * @returns {Promise<Object>} Object containing secure_url / imageUrl, publicId, dimensions, format, size
 */
export const processAndUploadRoadImage = async (buffer, folderOrOptions = {}) => {
  // 1. Authoritative Binary Inspection using Sharp
  let metadata;
  try {
    metadata = await sharp(buffer).metadata();
  } catch (err) {
    const error = new Error('Invalid or corrupted image file. Failed binary inspection.');
    error.statusCode = 400;
    throw error;
  }

  const { format, width, height } = metadata;

  // Validate allowed format
  const allowedFormats = ['jpeg', 'png', 'webp', 'jpg'];
  if (!format || !allowedFormats.includes(format.toLowerCase())) {
    const error = new Error(`Unsupported image format (${format || 'unknown'}). Only JPG, PNG, and WEBP are supported.`);
    error.statusCode = 400;
    throw error;
  }

  // Validate dimension boundaries (320x240 min, 10000x10000 max)
  if (!width || !height || width < 320 || height < 240) {
    const error = new Error('Image dimensions are too small. Minimum size is 320x240 pixels.');
    error.statusCode = 400;
    throw error;
  }

  if (width > 10000 || height > 10000) {
    const error = new Error('Image dimensions exceed maximum limits (10000x10000 pixels).');
    error.statusCode = 400;
    throw error;
  }

  // 2. Image Processing & Optimization via Sharp
  let sharpPipeline = sharp(buffer).rotate(); // Auto-orient using EXIF orientation tag before stripping

  // Resize if excessively large (> 3840px width) while maintaining aspect ratio
  if (width > 3840) {
    sharpPipeline = sharpPipeline.resize({ width: 3840, fit: 'inside', withoutEnlargement: true });
  }

  let processedBuffer;
  if (format === 'png') {
    processedBuffer = await sharpPipeline.png({ compressionLevel: 8 }).toBuffer();
  } else if (format === 'webp') {
    processedBuffer = await sharpPipeline.webp({ quality: 85 }).toBuffer();
  } else {
    processedBuffer = await sharpPipeline.jpeg({ quality: 85, mozjpeg: true }).toBuffer();
  }

  const processedMeta = await sharp(processedBuffer).metadata();
  const processedBytes = processedBuffer.length;

  // 3. Cloudinary Folder Path Construction
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  
  let folderPath = typeof folderOrOptions === 'string' ? folderOrOptions : `fixmyroad/road-reports/${year}/${month}`;
  const publicId = `img_${now.getTime()}_${Math.random().toString(36).substring(2, 8)}`;

  // 4. Stream Upload to Cloudinary
  return new Promise((resolve, reject) => {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;

    if (!cloudName || !apiKey || cloudName.includes('demo') || cloudName.includes('your_')) {
      const mimeType = format === 'png' ? 'image/png' : format === 'webp' ? 'image/webp' : 'image/jpeg';
      const base64DataUrl = `data:${mimeType};base64,${processedBuffer.toString('base64')}`;
      return resolve({
        imageUrl: base64DataUrl,
        secure_url: base64DataUrl,
        publicId: `${folderPath}/${publicId}`,
        width: processedMeta.width || width,
        height: processedMeta.height || height,
        format: format || 'jpg',
        bytes: processedBytes,
        size: processedBytes,
      });
    }

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: folderPath,
        public_id: publicId,
        resource_type: 'image',
        overwrite: false,
      },
      (error, result) => {
        if (error) {
          console.error('❌ Cloudinary Upload Error:', error);
          const err = new Error('Image upload to cloud storage failed. Please try again.');
          err.statusCode = 502;
          return reject(err);
        }

        resolve({
          imageUrl: result.secure_url,
          secure_url: result.secure_url,
          publicId: result.public_id,
          width: result.width,
          height: result.height,
          format: result.format,
          bytes: result.bytes,
          size: result.bytes,
        });
      }
    );

    uploadStream.end(processedBuffer);
  });
};

export const processAndUploadImage = processAndUploadRoadImage;
