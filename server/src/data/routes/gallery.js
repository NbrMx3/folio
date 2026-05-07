import express from 'express';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import { verifyToken } from './middleware/auth.js';
import { getGallery, createGalleryItem, updateGalleryItem, deleteGalleryItem } from '../utils/db.js';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'folio-gallery',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'mp4', 'mov', 'avi', 'mkv', 'webm'],
    resource_type: 'auto',
  },
});

const upload = multer({ storage });

const router = express.Router();

// GET /api/gallery — public
router.get('/', async (req, res) => {
  try {
    const items = await getGallery();
    res.json(items);
  } catch (error) {
    console.error('Get gallery error:', error);
    res.status(500).json({ error: 'Failed to fetch gallery' });
  }
});

// POST /api/gallery/upload — admin only
router.post('/upload', verifyToken, upload.single('media'), async (req, res) => {
  try {
    if (!req.file || !req.file.path) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { title, description, type } = req.body;
    const mediaType = type || (req.file.resource_type === 'video' ? 'video' : 'photo');

    const item = await createGalleryItem({
      url: req.file.path,
      type: mediaType,
      title: title || '',
      description: description || '',
    });

    res.status(200).json({
      message: 'Media uploaded successfully',
      item,
    });
  } catch (error) {
    console.error('Upload gallery item error:', error);
    res.status(500).json({ error: 'Failed to upload media' });
  }
});

// PUT /api/gallery/:id — admin only
router.put('/:id', verifyToken, async (req, res) => {
  try {
    const item = await updateGalleryItem(parseInt(req.params.id), req.body);
    if (!item) return res.status(404).json({ error: 'Gallery item not found' });
    res.json(item);
  } catch (error) {
    console.error('Update gallery item error:', error);
    res.status(500).json({ error: 'Failed to update gallery item' });
  }
});

// DELETE /api/gallery/:id — admin only
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    await deleteGalleryItem(parseInt(req.params.id));
    res.json({ success: true });
  } catch (error) {
    console.error('Delete gallery item error:', error);
    res.status(500).json({ error: 'Failed to delete gallery item' });
  }
});

export default router;
