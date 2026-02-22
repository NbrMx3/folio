import express from 'express';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import { verifyToken } from '../routes/middleware/auth.js';
import { getProfile, updateProfile } from '../utils/db.js';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'folio-profile',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
    transformation: [{ width: 400, height: 400, crop: 'limit' }],
  },
});

const upload = multer({ storage });

const router = express.Router();

// GET /api/profile — public
router.get('/', async (req, res) => {
  try {
    const profile = await getProfile();
    res.json(profile);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// POST /api/profile/upload — admin only
router.post('/upload', verifyToken, upload.single('picture'), async (req, res) => {
  try {
    if (!req.file || !req.file.path) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    // req.file.path is the Cloudinary URL
    await updateProfile({ picture: req.file.path });
    res.json({ picture: req.file.path });
  } catch (error) {
    res.status(500).json({ error: 'Upload failed' });
  }
});

// PUT /api/profile — admin only
router.put('/', verifyToken, async (req, res) => {
  try {
    const { name, title, bio, github, linkedin, email } = req.body;
    const updated = await updateProfile({ name, title, bio, github, linkedin, email });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Update failed' });
  }
});

export default router;
