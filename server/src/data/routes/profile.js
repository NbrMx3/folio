import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { verifyToken } from '../routes/middleware/auth.js';
import { getProfile, updateProfile } from '../utils/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `profile-${Date.now()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|webp/;
    const ext = allowed.test(path.extname(file.originalname).toLowerCase());
    const mime = allowed.test(file.mimetype);
    if (ext && mime) return cb(null, true);
    cb(new Error('Only image files are allowed'));
  },
});

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
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const profile = await getProfile();
    // Delete old picture if exists
    if (profile.picture) {
      const oldPath = path.join(uploadsDir, path.basename(profile.picture));
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }

    const picturePath = `/uploads/${req.file.filename}`;
    await updateProfile({ picture: picturePath });

    res.json({ picture: picturePath });
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
