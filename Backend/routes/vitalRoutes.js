// Backend/routes/vitalsRoutes.js
const express = require('express');
const router = express.Router();
const VitalReading = require('../models/VitalReadings');
const auth = require('../middleware/authMiddleware');

// Store vital reading
router.post('/record', auth, async (req, res) => {
  try {
    const {
      heartRate,
      bloodOxygen,
      temperature,
      systolicBP,
      diastolicBP
    } = req.body;

    if (!heartRate || !bloodOxygen || !temperature) {
      return res.status(400).json({ 
        message: 'Missing required vital signs' 
      });
    }

    const reading = new VitalReading({
      userId: req.user.id,
      heartRate,
      bloodOxygen,
      temperature,
      systolicBP,
      diastolicBP,
      timestamp: new Date()
    });

    await reading.save();

    res.status(201).json({
      success: true,
      message: 'Vital signs recorded',
      data: reading
    });

  } catch (error) {
    console.error('Error recording vitals:', error);
    res.status(500).json({ 
      message: 'Failed to record vital signs' 
    });
  }
});

// Get last saved vitals
router.get('/latest', auth, async (req, res) => {
  try {
    const latest = await VitalReading.findOne({ userId: req.user.id })
      .sort({ timestamp: -1 });

    if (!latest) {
      return res.status(404).json({ 
        success: false,
        message: 'No vitals found' 
      });
    }

    res.json({
      success: true,
      data: latest
    });

  } catch (error) {
    console.error('Error fetching latest vitals:', error);
    res.status(500).json({ message: 'Failed to fetch latest vitals' });
  }
});

// Get user's historical data
router.get('/history', auth, async (req, res) => {
  try {
    const { startDate, endDate, limit = 1000 } = req.query;

    const query = { userId: req.user.id };
    
    if (startDate && endDate) {
      query.timestamp = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const readings = await VitalReading.find(query)
      .sort({ timestamp: -1 })
      .limit(parseInt(limit));

    res.json({
      success: true,
      count: readings.length,
      data: readings
    });

  } catch (error) {
    console.error('Error fetching history:', error);
    res.status(500).json({ message: 'Failed to fetch history' });
  }
});

module.exports = router;