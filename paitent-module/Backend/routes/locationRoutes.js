const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const mongoose = require('mongoose');

// Location Schema
const LocationSchema = new mongoose.Schema({
  userId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  latitude:  { type: Number, required: true },
  longitude: { type: Number, required: true },
  city:      { type: String, default: '' },
  region:    { type: String, default: '' },
  address:   { type: String, default: '' },
  timestamp: { type: Date, default: Date.now },
}, { timestamps: true });

const Location = mongoose.models.Location || mongoose.model('Location', LocationSchema);

// POST /api/location/save
router.post('/save', auth, async (req, res) => {
  try {
    const { latitude, longitude, city, region, address } = req.body;
    if (!latitude || !longitude) {
      return res.status(400).json({ success: false, message: 'Latitude and longitude are required' });
    }

    // Purani location update karo ya nayi banao
    await Location.findOneAndUpdate(
      { userId: req.user.id },
      { latitude, longitude, city, region, address, timestamp: new Date() },
      { upsert: true, new: true }
    );

    res.json({ success: true, message: 'Location saved' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/location/patient/:userId
router.get('/patient/:userId', async (req, res) => {
  try {
    const location = await Location.findOne({ userId: req.params.userId });
    if (!location) return res.status(404).json({ success: false, message: 'Location not found' });
    res.json({ success: true, data: location });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;