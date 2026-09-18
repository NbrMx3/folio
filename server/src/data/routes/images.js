import express from 'express';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { verifyToken } from './middleware/auth.js';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const IMAGE_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/gif', 'image/webp']);
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => cb(null, IMAGE_MIME_TYPES.has(file.mimetype)),
});

function uploadImage(buffer) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: 'folio-images', resource_type: 'image', allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'] },
      (error, result) => (error ? reject(error) : resolve(result))
    );
    stream.end(buffer);
  });
}

const router = express.Router();

// POST /api/images/upload — admin only
router.post('/upload', verifyToken, (req, res, next) => {
  upload.single('image')(req, res, (error) => {
    if (!error) return next();
    const status = error instanceof multer.MulterError && error.code === 'LIMIT_FILE_SIZE' ? 413 : 400;
    return res.status(status).json({ error: status === 413 ? 'File too large. Max size is 10MB.' : 'Only JPG, PNG, GIF, and WebP images are allowed.' });
  });
}, async (req, res) => {
  if (!req.file?.buffer) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  try {
    const result = await uploadImage(req.file.buffer);
    return res.status(200).json({
      message: 'Image uploaded successfully',
      url: result.secure_url || result.url,
      filename: result.public_id,
    });
  } catch (error) {
    console.error('Image upload failed:', error);
    return res.status(500).json({ error: 'Image upload failed' });
  }
});

export default router;

