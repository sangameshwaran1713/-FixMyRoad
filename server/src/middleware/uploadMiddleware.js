import multer from 'multer';

// Use memoryStorage so image buffer is processed in memory via Sharp without writing to server disk
const storage = multer.memoryStorage();

// First-level extension and MIME filter
const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
  const allowedExtensions = /\.(jpg|jpeg|png|webp)$/i;

  const isMimeValid = allowedMimeTypes.includes(file.mimetype);
  const isExtensionValid = allowedExtensions.test(file.originalname);

  if (isMimeValid && isExtensionValid) {
    return cb(null, true);
  }

  const error = new Error('Invalid file format. Only JPG, PNG, and WEBP images are allowed.');
  error.statusCode = 400;
  cb(error, false);
};

export const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB maximum file size
  },
  fileFilter,
});

export const uploadSingleImage = upload.single('image');
