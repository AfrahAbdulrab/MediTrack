const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const User = require('../models/User');
const authMiddleware = require('../middleware/authMiddleware');

// Multer configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = 'uploads/profiles';
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'profile-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only images are allowed!'));
    }
  }
});

// POST - upload profile picture (route 1)
router.post('/profile-picture', authMiddleware, upload.single('profilePicture'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const profilePicturePath = `/uploads/profiles/${req.file.filename}`;

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { profilePicture: profilePicturePath },
      { new: true }
    ).select('-password');

    console.log('✅ Profile picture uploaded:', profilePicturePath);

    res.json({
      message: 'Profile picture updated successfully',
      profilePicture: profilePicturePath,
      user
    });
  } catch (error) {
    console.error('❌ Error uploading profile picture:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// GET - profile picture for guardian
router.get('/profile', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password -__v');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST - upload profile photo (route 2)
router.post('/profile/upload-photo', authMiddleware, upload.single('profilePhoto'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

    const photoUrl = `${req.protocol}://${req.get('host')}/uploads/profiles/${req.file.filename}`;

 await User.findByIdAndUpdate(req.user.id, { profilePhoto: photoUrl });

    res.json({ profilePhotoUrl: photoUrl });
  } catch (error) {
    console.error('❌ Upload error:', error);
    res.status(500).json({ message: 'Upload failed' });
  }
});

module.exports = router;