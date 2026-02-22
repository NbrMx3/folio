import multer from 'multer';
import path from 'path';
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');

// Set up storage for image uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../../uploads/images'));
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ storage: storage });

// POST /uploads/images
router.get('/uploads/profile', upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  res.status(200).json({
    message: 'Image uploaded successfully',
    filename: req.file.filename,
    path: req.file.path
  });
});

module.exports = router;
