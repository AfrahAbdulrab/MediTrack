const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { guardianAuth } = require('./guardianAuthRoutes');

// ── VitalReading Model (same DB connection) ───────────────────────────────────
const VitalReading = mongoose.models.VitalReading || mongoose.model('VitalReading', new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  heartRate: Number,
  bloodOxygen: Number,
  temperature: Number,
  footsteps: Number,
  alertLevel: { type: String, enum: ['normal', 'warning', 'critical'], default: 'normal' },
  timestamp: { type: Date, default: Date.now },
}, { timestamps: true }));

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/guardian/vitals/latest
// ─────────────────────────────────────────────────────────────────────────────
router.get('/latest', guardianAuth, async (req, res) => {
  try {
    const patientId = req.guardian.patientId;
    const latest = await VitalReading.findOne({ userId: patientId }).sort({ timestamp: -1 });

    if (!latest) {
      return res.status(404).json({ success: false, message: 'Koi vital reading nahi mili' });
    }

    res.json({ success: true, data: latest });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/guardian/vitals/history
// ─────────────────────────────────────────────────────────────────────────────
router.get('/history', guardianAuth, async (req, res) => {
  try {
    const patientId = req.guardian.patientId;
    const { limit = 20, startDate, endDate } = req.query;

    const query = { userId: patientId };
    if (startDate && endDate) {
      query.timestamp = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }

    const readings = await VitalReading.find(query)
      .sort({ timestamp: -1 })
      .limit(parseInt(limit));

    res.json({ success: true, count: readings.length, data: readings });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/guardian/vitals/stats
// ─────────────────────────────────────────────────────────────────────────────
router.get('/stats', guardianAuth, async (req, res) => {
  try {
    const patientId = req.guardian.patientId;
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const readings = await VitalReading.find({
      userId: patientId,
      timestamp: { $gte: sevenDaysAgo },
    }).sort({ timestamp: -1 });

    if (!readings.length) {
      return res.json({ success: true, message: 'No data', stats: null });
    }

    const avg = (field) =>
      parseFloat((readings.reduce((s, r) => s + (r[field] || 0), 0) / readings.length).toFixed(2));

    res.json({
      success: true,
      stats: {
        totalReadings: readings.length,
        avgHeartRate: avg('heartRate'),
        avgBloodOxygen: avg('bloodOxygen'),
        avgTemperature: avg('temperature'),
        totalSteps: readings.reduce((s, r) => s + (r.footsteps || 0), 0),
        alerts: {
          critical: readings.filter(r => r.alertLevel === 'critical').length,
          warning: readings.filter(r => r.alertLevel === 'warning').length,
          normal: readings.filter(r => r.alertLevel === 'normal').length,
        },
        latestReading: readings[0],
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;