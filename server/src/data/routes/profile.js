import express from 'express';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { verifyToken } from '../routes/middleware/auth.js';
import { getDefaultProfile, getProfile, updateProfile } from '../utils/db.js';

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
const resumeUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

const uploadResumeBuffer = (buffer) => new Promise((resolve, reject) => {
  const stream = cloudinary.uploader.upload_stream(
    {
      folder: 'folio-profile',
      resource_type: 'raw',
      public_id: 'resume',
      overwrite: true,
      invalidate: true,
    },
    (error, result) => {
      if (error) {
        reject(error);
        return;
      }
      resolve(result);
    }
  );

  stream.end(buffer);
});

const uploadProfileImage = (buffer) => new Promise((resolve, reject) => {
  const stream = cloudinary.uploader.upload_stream(
    {
      folder: 'folio-profile',
      resource_type: 'image',
      allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
      transformation: [{ width: 400, height: 400, crop: 'limit' }],
    },
    (error, result) => (error ? reject(error) : resolve(result))
  );
  stream.end(buffer);
});

const router = express.Router();

// GET /api/profile — public
router.get('/', async (req, res) => {
  try {
    const profile = await getProfile();
    res.json(profile);
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.json(getDefaultProfile());
  }
});

// POST /api/profile/upload — admin only
router.post('/upload', verifyToken, (req, res, next) => {
  upload.single('picture')(req, res, (error) => {
    if (!error) return next();
    const status = error instanceof multer.MulterError && error.code === 'LIMIT_FILE_SIZE' ? 413 : 400;
    return res.status(status).json({ error: status === 413 ? 'File too large. Max size is 10MB.' : 'Only JPG, PNG, GIF, and WebP images are allowed.' });
  });
}, async (req, res) => {
  try {
    if (!req.file?.buffer) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    const result = await uploadProfileImage(req.file.buffer);
    const picture = result.secure_url || result.url;
    await updateProfile({ picture });
    return res.json({ picture });
  } catch (error) {
    res.status(500).json({ error: 'Upload failed' });
  }
});

// POST /api/profile/resume — admin only
router.post('/resume', verifyToken, resumeUpload.single('resume'), async (req, res) => {
  try {
    if (!req.file || !req.file.buffer) {
      return res.status(400).json({ error: 'No resume uploaded' });
    }

    const mimeType = String(req.file.mimetype || '').toLowerCase();
    const fileName = String(req.file.originalname || '').toLowerCase();
    if (mimeType !== 'application/pdf' && !fileName.endsWith('.pdf')) {
      return res.status(400).json({ error: 'Resume must be a PDF file' });
    }

    const result = await uploadResumeBuffer(req.file.buffer);
    const resumeUrl = result.secure_url || result.url;
    await updateProfile({ resume: resumeUrl });
    res.json({ resume: resumeUrl });
  } catch (error) {
    console.error('Resume upload failed:', error);
    res.status(500).json({ error: 'Resume upload failed' });
  }
});

// PUT /api/profile — admin only
router.put('/', verifyToken, async (req, res) => {
  try {
    const {
      name,
      title,
      bio,
      github,
      linkedin,
      twitter,
      facebook,
      instagram,
      tiktok,
      phone,
      whatsapp,
      resume,
      email,
    } = req.body;
    const updated = await updateProfile({
      name,
      title,
      bio,
      github,
      linkedin,
      twitter,
      facebook,
      instagram,
      tiktok,
      phone,
      whatsapp,
      resume,
      email,
    });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Update failed' });
  }
});

export default router;
