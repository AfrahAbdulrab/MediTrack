const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { guardianAuth } = require('./guardianAuthRoutes');

// ── VitalReading Model ────────────────────────────────────────────────────────
const VitalReading = mongoose.models.VitalReading || mongoose.model('VitalReading', new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  heartRate: Number,
  bloodOxygen: Number,
  temperature: Number,
  footsteps: Number,
  alertLevel: { type: String, enum: ['normal', 'warning', 'critical'], default: 'normal' },
  timestamp: { type: Date, default: Date.now },
}, { timestamps: true }));

// ── Hypertension Model ────────────────────────────────────────────────────────
const Hypertension = mongoose.models.Hypertension || mongoose.model('Hypertension', new mongoose.Schema({
  patient_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  severity: String,
}, { timestamps: true }));

// ── SleepApnea Model ──────────────────────────────────────────────────────────
const SleepApnea = mongoose.models.SleepApnea || mongoose.model('SleepApnea', new mongoose.Schema({
  patient_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  severity: String,
}, { timestamps: true }));

// ── TachycardiaBradycardia Model ──────────────────────────────────────────────
const TachycardiaBradycardia = mongoose.models.TachycardiaBradycardia || mongoose.model('TachycardiaBradycardia', new mongoose.Schema({
  patient_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  hr_condition: String,
  severity: String,
}, { timestamps: true }));

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/guardian/reports/monthly
// ─────────────────────────────────────────────────────────────────────────────
router.get('/monthly', guardianAuth, async (req, res) => {
  try {
    const patientId = req.guardian.patientId;

    const months = [];
    for (let i = 0; i < 3; i++) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const year = date.getFullYear();
      const month = date.getMonth();

      const start = new Date(year, month, 1);
      const end = new Date(year, month + 1, 0, 23, 59, 59);

      const readings = await VitalReading.find({
        userId: patientId,
        timestamp: { $gte: start, $lte: end },
      }).sort({ timestamp: 1 });

      const daysInMonth = end.getDate();
      const dailyAlerts = Array(daysInMonth).fill(0);

      readings.forEach(r => {
        const day = new Date(r.timestamp).getDate() - 1;
        if (r.alertLevel === 'critical' || r.alertLevel === 'warning') {
          dailyAlerts[day]++;
        }
      });

      const criticalCount = readings.filter(r => r.alertLevel === 'critical').length;
      const moderateCount = readings.filter(r => r.alertLevel === 'warning').length;

      months.push({
        month: date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
        critical: criticalCount,
        moderate: moderateCount,
        data: dailyAlerts,
        totalReadings: readings.length,
      });
    }

    res.json({ success: true, data: months });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/guardian/reports/diseases
// ─────────────────────────────────────────────────────────────────────────────
router.get('/diseases', guardianAuth, async (req, res) => {
  try {
    const patientId = req.guardian.patientId;

    const [hypertension, sleepApnea, tachyBrady] = await Promise.all([
      Hypertension.findOne({ patient_id: patientId }).sort({ createdAt: -1 }),
      SleepApnea.findOne({ patient_id: patientId }).sort({ createdAt: -1 }),
      TachycardiaBradycardia.findOne({ patient_id: patientId }).sort({ createdAt: -1 }),
    ]);

    const diseases = [];

    if (hypertension) {
      diseases.push({
        name: 'Hypertension',
        badge: hypertension.severity || 'Detected',
        badgeBg: hypertension.severity === 'Critical' ? '#fdecea' : '#fff3e0',
        badgeColor: hypertension.severity === 'Critical' ? '#e74c3c' : '#e67e22',
        detectedAt: hypertension.createdAt,
      });
    }

    if (tachyBrady) {
      diseases.push({
        name: tachyBrady.hr_condition || 'Tachycardia/Bradycardia',
        badge: tachyBrady.severity || 'Detected',
        badgeBg: tachyBrady.severity === 'Critical' ? '#fdecea' : '#fff3e0',
        badgeColor: tachyBrady.severity === 'Critical' ? '#e74c3c' : '#e67e22',
        detectedAt: tachyBrady.createdAt,
      });
    }

    if (sleepApnea) {
      diseases.push({
        name: 'Sleep Apnea',
        badge: sleepApnea.severity || 'Monitoring',
        badgeBg: '#eef2ff',
        badgeColor: '#5c6bc0',
        detectedAt: sleepApnea.createdAt,
      });
    }

    res.json({ success: true, diseases });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;