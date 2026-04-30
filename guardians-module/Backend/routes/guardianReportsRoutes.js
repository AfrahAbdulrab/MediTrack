const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { guardianAuth } = require('./guardianAuthRoutes');

// ─── Models ───────────────────────────────────────────────────────────────────
const VitalReading = mongoose.models.VitalReading || mongoose.model('VitalReading', new mongoose.Schema({
  userId:       mongoose.Schema.Types.ObjectId,
  heartRate:    Number,
  bloodOxygen:  Number,
  temperature:  Number,
  systolicBP:   Number,
  diastolicBP:  Number,
  bloodSugar:   Number,
  footsteps:    Number,
  alertLevel:   String,
  condition:    String,
  severity:     String,
  riskScore:    Number,
  timestamp:    Date,
}, { timestamps: true, collection: 'vitalreadings' }));

const Hypertension = mongoose.models.Hypertension || mongoose.model('Hypertension', new mongoose.Schema({
  patient_id:  mongoose.Schema.Types.ObjectId,
  severity:    String,
  systolic_bp: Number,
  diastolic_bp: Number,
}, { timestamps: true, collection: 'hypertensions' }));

const SleepApnea = mongoose.models.SleepApnea || mongoose.model('SleepApnea', new mongoose.Schema({
  patient_id: mongoose.Schema.Types.ObjectId,
  severity:   String,
  spo2:       Number,
  heart_rate: Number,
}, { timestamps: true, collection: 'sleepapneas' }));

const TachycardiaBradycardia = mongoose.models.TachycardiaBradycardia || mongoose.model('TachycardiaBradycardia', new mongoose.Schema({
  patient_id:   mongoose.Schema.Types.ObjectId,
  severity:     String,
  hr_condition: String,
  heart_rate:   Number,
}, { timestamps: true, collection: 'tachycardiabradycardias' }));

// ─── Helper: Average of array (ignore nulls) ──────────────────────────────────
const avg = (arr) => {
  const valid = arr.filter(v => v != null && !isNaN(v));
  if (!valid.length) return null;
  return Math.round(valid.reduce((a, b) => a + b, 0) / valid.length);
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/guardian/reports/vitals?range=24h|30d|all|custom&from=ISO&to=ISO
// ─────────────────────────────────────────────────────────────────────────────
router.get('/vitals', guardianAuth, async (req, res) => {
  try {
    // ── FIX 1: patientId ko ObjectId mein convert karo ──
    const patientId = new mongoose.Types.ObjectId(req.guardian.patientId);
    const { range = '24h', from, to } = req.query;

    const now = new Date();
    let start, end, rangeLabel, groupBy;

    if (range === '24h') {
      start      = new Date(now - 24 * 60 * 60 * 1000);
      end        = now;
      rangeLabel = 'Last 24 Hours';
      groupBy    = 'hour';
    } else if (range === '30d') {
      start = new Date(now);
      start.setDate(start.getDate() - 29);
      start.setHours(0, 0, 0, 0);
      end        = now;
      rangeLabel = 'Last 30 Days';
      groupBy    = 'day';
    } else if (range === 'all') {
      start      = new Date(0);
      end        = now;
      rangeLabel = 'Since Watch Connected';
      groupBy    = 'day';
    } else if (range === 'custom' && from && to) {
      start = new Date(from);
      end   = new Date(to);
      // end ko us din ki midnight tak rakho
      end.setHours(23, 59, 59, 999);
      const diffDays = (end - start) / (1000 * 60 * 60 * 24);
      groupBy    = diffDays <= 3 ? 'hour' : 'day';
      const fmtOpts = { day: 'numeric', month: 'short', year: 'numeric' };
      rangeLabel = `${start.toLocaleDateString('en-US', fmtOpts)} – ${end.toLocaleDateString('en-US', fmtOpts)}`;
    } else {
      return res.status(400).json({ success: false, error: 'Invalid range or missing from/to params' });
    }

    // ── DB se readings fetch karo ──
    const readings = await VitalReading.find({
      userId:    patientId,           // FIX 1: proper ObjectId
      timestamp: { $gte: start, $lte: end },
    }).sort({ timestamp: 1 });

    console.log(`📊 Vitals query: userId=${patientId}, range=${range}, found=${readings.length} readings`);

    // ── FIX 2: Bucket key — timestamp store karo saath mein sorting ke liye ──
    const buckets = {}; // key -> { label, sortKey (timestamp ms), readings[] }

    readings.forEach(r => {
      const d = new Date(r.timestamp);
      let key, sortKey, label;

      if (groupBy === 'hour') {
        // Har ghante ka bucket — sort key = timestamp of that hour start
        const hourStart = new Date(d);
        hourStart.setMinutes(0, 0, 0);
        sortKey = hourStart.getTime();
        label   = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                + ', ' + String(d.getHours()).padStart(2, '0') + ':00';
        key = sortKey.toString();
      } else {
        // Har din ka bucket
        const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate());
        sortKey = dayStart.getTime();
        label   = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        key = sortKey.toString();
      }

      if (!buckets[key]) buckets[key] = { label, sortKey, readings: [] };
      buckets[key].readings.push(r);
    });

    // ── FIX 3: 24h ke liye khali buckets bhi inject karo (sirf data waale ghante dikhao) ──
    // Khali buckets nahi dikhana — sirf real data wale rows
    // Agar 24h mein koi reading nahi to empty array OK hai

    // ── Rows banao — sirf wahan data ho ──
    const rows = Object.values(buckets)
      .sort((a, b) => a.sortKey - b.sortKey)   // FIX 2: proper chronological sort
      .filter(bucket => bucket.readings.length > 0) // FIX 3: null rows nahi
      .map(bucket => {
        const group = bucket.readings;

        // Temperature: average, 1 decimal
        const tempVals = group.filter(r => r.temperature != null).map(r => r.temperature);
        const temperature = tempVals.length
          ? parseFloat((tempVals.reduce((a, b) => a + b, 0) / tempVals.length).toFixed(1))
          : null;

        // FIX 4: Steps — daily ke liye sum, hourly ke liye sum of that hour
        const steps = group.reduce((sum, r) => sum + (r.footsteps || 0), 0);

        // Alert level — worst wala
        const alertLevel = group.some(r => r.alertLevel === 'critical') ? 'critical'
          : group.some(r => r.alertLevel === 'warning') ? 'warning'
          : 'normal';

        return {
          label:       bucket.label,
          heartRate:   avg(group.map(r => r.heartRate)),
          spo2:        avg(group.map(r => r.bloodOxygen)),
          temperature,
          steps,
          systolicBP:  avg(group.map(r => r.systolicBP)),
          diastolicBP: avg(group.map(r => r.diastolicBP)),
          bloodSugar:  avg(group.map(r => r.bloodSugar)),
          bmi:         null,
          alertLevel,
        };
      });

    const columnLabel = groupBy === 'hour' ? 'Time' : 'Date';

    res.json({
      success:       true,
      rangeLabel,
      columnLabel,
      totalReadings: readings.length,
      rows,
    });

  } catch (err) {
    console.error('❌ Vitals report error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/guardian/reports/monthly
// ─────────────────────────────────────────────────────────────────────────────
router.get('/monthly', guardianAuth, async (req, res) => {
  try {
    // FIX: ObjectId conversion
    const patientId = new mongoose.Types.ObjectId(req.guardian.patientId);

    const months = [];
    for (let i = 0; i < 3; i++) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const year  = date.getFullYear();
      const month = date.getMonth();

      const start = new Date(year, month, 1);
      const end   = new Date(year, month + 1, 0, 23, 59, 59);

      const readings = await VitalReading.find({
        userId:    patientId,
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

      months.push({
        month:         date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
        critical:      readings.filter(r => r.alertLevel === 'critical').length,
        moderate:      readings.filter(r => r.alertLevel === 'warning').length,
        data:          dailyAlerts,
        totalReadings: readings.length,
      });
    }

    res.json({ success: true, data: months });
  } catch (err) {
    console.error('❌ Monthly reports error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/guardian/reports/diseases
// ─────────────────────────────────────────────────────────────────────────────
router.get('/diseases', guardianAuth, async (req, res) => {
  try {
    // FIX: ObjectId conversion
    const patientId = new mongoose.Types.ObjectId(req.guardian.patientId);

    const [hypertension, sleepApnea, tachyBrady] = await Promise.all([
      Hypertension.findOne({ patient_id: patientId }).sort({ createdAt: -1 }),
      SleepApnea.findOne({ patient_id: patientId }).sort({ createdAt: -1 }),
      TachycardiaBradycardia.findOne({ patient_id: patientId }).sort({ createdAt: -1 }),
    ]);

    const diseases = [];

    if (hypertension) {
      diseases.push({
        name:       'Hypertension',
        badge:      hypertension.severity || 'Detected',
        badgeBg:    hypertension.severity === 'Critical' ? '#fdecea' : '#fff3e0',
        badgeColor: hypertension.severity === 'Critical' ? '#e74c3c' : '#e67e22',
        detectedAt: hypertension.createdAt,
      });
    }

    if (tachyBrady) {
      diseases.push({
        name:       tachyBrady.hr_condition || 'Tachycardia/Bradycardia',
        badge:      tachyBrady.severity || 'Detected',
        badgeBg:    tachyBrady.severity === 'Critical' ? '#fdecea' : '#fff3e0',
        badgeColor: tachyBrady.severity === 'Critical' ? '#e74c3c' : '#e67e22',
        detectedAt: tachyBrady.createdAt,
      });
    }

    if (sleepApnea) {
      diseases.push({
        name:       'Sleep Apnea',
        badge:      sleepApnea.severity || 'Monitoring',
        badgeBg:    '#eef2ff',
        badgeColor: '#5c6bc0',
        detectedAt: sleepApnea.createdAt,
      });
    }

    res.json({ success: true, diseases });
  } catch (err) {
    console.error('❌ Diseases reports error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;