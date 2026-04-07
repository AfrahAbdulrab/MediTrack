const express = require('express');
const router = express.Router();
const axios = require('axios');
const auth = require('../middleware/authMiddleware');

const Hypertension             = require('../models/Hypertension');
const HeartCondition           = require('../models/HeartCondition');
const VitalReading             = require('../models/VitalReadings');
const SleepApnea               = require('../models/SleepApnea');
const TachycardiaBradycardia   = require('../models/TachycardiaBradycardia');
const EmergencyContact         = require('../models/EmergencyContact');
const User                     = require('../models/User');

const { processHypertension }  = require('../services/hypertensionService');
const { processSleepApnea }    = require('../services/sleepApneaService');
const { processTachyBrady }    = require('../services/tachyBradyService');

// ─────────────────────────────────────────────────────────────────────────────
// 🔔 Guardian Notification Helper — Expo Push Notification
// ─────────────────────────────────────────────────────────────────────────────
const sendGuardianNotification = async (userId, title, body) => {
  try {
    // Step 1: Is patient ke saare emergency contacts fetch karo
    const contacts = await EmergencyContact.find({ userId });
    if (!contacts.length) {
      console.log(`⚠️ No emergency contacts found for user: ${userId}`);
      return;
    }

    // Step 2: Har contact ka expoPushToken fetch karo
    const messages = [];
    for (const contact of contacts) {
      // Contact ka userId se uska push token nikalo
      const guardianUser = await User.findOne({ 
        $or: [
          { phone: contact.phone },
          { _id: contact.userId }
        ]
      });

      // Patient khud bhi notify ho — uska apna token
      const patientUser = await User.findById(userId);
      if (patientUser?.expoPushToken) {
        messages.push({
          to: patientUser.expoPushToken,
          sound: 'default',
          title,
          body,
          data: { userId: userId.toString(), type: 'vital_alert' },
        });
      }

      console.log(`🔔 Notifying guardian: ${contact.name} (${contact.phone})`);
    }

    if (!messages.length) {
      console.log('⚠️ No push tokens found — notification skipped');
      return;
    }

    // Step 3: Expo Push Notification API ko call karo
    const response = await axios.post(
      'https://exp.host/--/api/v2/push/send',
      messages,
      {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        timeout: 5000,
      }
    );

    console.log(`✅ Push notifications sent: ${messages.length} message(s)`);

  } catch (err) {
    console.error('❌ Guardian notification error:', err.message);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// 🩺 Vital Alert Check Helper
// ─────────────────────────────────────────────────────────────────────────────
const checkAndNotifyVitals = async (userId, reading) => {
  const alerts = [];

  // Heart Rate
  if (reading.heartRate > 100)
    alerts.push({ title: '❤️ Heart Rate High', body: `Heart rate ${reading.heartRate} bpm — normal range 60-100` });
  else if (reading.heartRate < 60)
    alerts.push({ title: '❤️ Heart Rate Low', body: `Heart rate ${reading.heartRate} bpm — normal range 60-100` });

  // Blood Oxygen
  if (reading.bloodOxygen < 95)
    alerts.push({ title: '💨 Oxygen Level Low', body: `SpO2 ${reading.bloodOxygen}% — should be above 95%` });

  // BP
  if (reading.systolicBP && reading.systolicBP > 140)
    alerts.push({ title: '🩸 BP High', body: `BP ${reading.systolicBP}/${reading.diastolicBP} mmHg — high detected` });
  else if (reading.systolicBP && reading.systolicBP < 90)
    alerts.push({ title: '🩸 BP Low', body: `BP ${reading.systolicBP}/${reading.diastolicBP} mmHg — low detected` });

  // Blood Sugar
  if (reading.bloodSugar && reading.bloodSugar > 180)
    alerts.push({ title: '🩸 Sugar High', body: `Blood sugar ${reading.bloodSugar} mg/dL — high detected` });
  else if (reading.bloodSugar && reading.bloodSugar < 70)
    alerts.push({ title: '🩸 Sugar Low', body: `Blood sugar ${reading.bloodSugar} mg/dL — low detected` });

  // Disease Moderate+ trigger
  const moderateSeverities = ['Moderate', 'Severe', 'Critical'];
  if (moderateSeverities.includes(reading.severity)) {
    alerts.push({
      title: '🚨 Health Alert',
      body: `Patient condition is ${reading.severity} — ${reading.condition}. Monitoring activated.`
    });
  }

  // Har alert bhejo
  for (const alert of alerts) {
    await sendGuardianNotification(userId, alert.title, alert.body);
  }

  if (alerts.length > 0) {
    console.log(`🔔 ${alerts.length} alert(s) sent for user: ${userId}`);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/vitals/record
// ─────────────────────────────────────────────────────────────────────────────
router.post('/record', auth, async (req, res) => {
  try {
    const {
      heartRate, bloodOxygen, temperature, footsteps,
      restingHeartRate, bmi, accelerometer, age, gender,
      systolicBP, diastolicBP, bloodSugar, respiratoryRate,
      diseaseType, vitals,
    } = req.body;

    const hr   = heartRate   ?? vitals?.heartRate;
    const spo2 = bloodOxygen ?? vitals?.bloodOxygen;
    const temp = temperature ?? vitals?.temperature ?? 37.0;

    if (!hr || !spo2) {
      return res.status(400).json({
        success: false,
        message: 'heartRate aur bloodOxygen required hain',
      });
    }

    const tempCelsius = temp > 42
      ? parseFloat(((temp - 32) * 5 / 9).toFixed(1))
      : temp;

    const reading = new VitalReading({
      userId: req.user.id,
      timestamp: new Date(),
      heartRate:        hr,
      bloodOxygen:      spo2,
      temperature:      tempCelsius,
      age:              age             ?? vitals?.age             ?? null,
      gender:           gender          ?? vitals?.gender          ?? null,
      systolicBP:       systolicBP      ?? vitals?.systolicBP      ?? null,
      diastolicBP:      diastolicBP     ?? vitals?.diastolicBP     ?? null,
      bloodSugar:       bloodSugar      ?? vitals?.bloodSugar      ?? null,
      respiratoryRate:  respiratoryRate ?? vitals?.respiratoryRate ?? null,
      footsteps:        footsteps       ?? vitals?.footsteps       ?? 0,
      restingHeartRate: restingHeartRate ?? vitals?.restingHeartRate ?? null,
      bmi:              bmi             ?? vitals?.bmi             ?? null,
      accelerometer:    accelerometer   ?? vitals?.accelerometer   ?? {
        x: 0, y: 9.8, z: 0, intensity: 'Still',
      },
    });

    await reading.save();
    console.log(`✅ VitalReading saved | User: ${req.user.id} | Condition: ${reading.condition} | Severity: ${reading.severity} | Risk: ${reading.riskScore}`);

    // ✅ Vitals check karo aur guardian ko notify karo
    await checkAndNotifyVitals(req.user.id, reading);

    let specializedRecord = null;

    if (diseaseType === 'Hypertension') {
      try {
        specializedRecord = new Hypertension({ ...(vitals || req.body), userId: req.user.id });
        await specializedRecord.save();
        try {
          const flaskRes = await axios.post('http://localhost:5001/predict_hypertension', specializedRecord, { timeout: 5000 });
          specializedRecord.ml_prediction = flaskRes.data.prediction;
          await specializedRecord.save();
        } catch { console.warn('⚠️ Flask not responding — skipping ML prediction'); }
      } catch (e) { console.error('Hypertension save error:', e.message); }

    } else if (diseaseType === 'Heart') {
      try {
        specializedRecord = new HeartCondition({ ...(vitals || req.body), userId: req.user.id });
        await specializedRecord.save();
        try {
          const flaskRes = await axios.post('http://localhost:5001/predict_heart', specializedRecord, { timeout: 5000 });
          specializedRecord.ml_prediction = flaskRes.data.prediction;
          await specializedRecord.save();
        } catch { console.warn('⚠️ Flask not responding — skipping ML prediction'); }
      } catch (e) { console.error('HeartCondition save error:', e.message); }
    }

    res.status(201).json({
      success: true,
      message: 'Vitals saved successfully',
      data: {
        id: reading._id, heartRate: reading.heartRate,
        bloodOxygen: reading.bloodOxygen, temperature: reading.temperature,
        condition: reading.condition, riskScore: reading.riskScore,
        severity: reading.severity, alertLevel: reading.alertLevel,
        pulsePressure: reading.pulsePressure, map: reading.map,
        shockIndex: reading.shockIndex, rpp: reading.rpp,
        spo2Deficit: reading.spo2Deficit, timestamp: reading.timestamp,
      },
    });

  } catch (error) {
    console.error('❌ Error recording vitals:', error);
    res.status(500).json({ success: false, message: 'Failed to record vital signs', error: error.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/vitals/hypertension — notify with disease severity
// ─────────────────────────────────────────────────────────────────────────────
router.post('/hypertension', auth, async (req, res) => {
  try {
    const derived = processHypertension(req.body);
    const record = new Hypertension({
      patient_id:   req.user.id,
      age:          req.body.age,
      gender:       req.body.gender,
      weight_kg:    req.body.weight_kg,
      height_cm:    req.body.height_cm,
      systolic_bp:  req.body.systolic_bp,
      diastolic_bp: req.body.diastolic_bp,
      resting_hr:   req.body.resting_hr,
      steps_7days:  req.body.steps_7days,
      ...derived
    });
    await record.save();
    console.log(`✅ Hypertension saved | User: ${req.user.id} | Severity: ${derived.severity} | Risk: ${derived.risk_score}`);

    // ✅ Moderate+ disease notification
    const moderateSeverities = ['Moderate', 'Severe', 'Critical'];
    if (moderateSeverities.includes(derived.severity)) {
      await sendGuardianNotification(
        req.user.id,
        '🚨 Hypertension Alert',
        `Hypertension is ${derived.severity} — BP ${req.body.systolic_bp}/${req.body.diastolic_bp} mmHg`
      );
    }

    res.status(201).json({ success: true, message: '✅ Hypertension data saved', data: record });
  } catch (error) {
    console.error('❌ Hypertension error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/vitals/sleep-apnea — notify with disease severity
// ─────────────────────────────────────────────────────────────────────────────
router.post('/sleep-apnea', auth, async (req, res) => {
  try {
    const derived = processSleepApnea(req.body);
    const record = new SleepApnea({
      patient_id:           req.user.id,
      age:                  req.body.age,
      gender:               req.body.gender,
      spo2:                 req.body.spo2,
      spo2_drop:            req.body.spo2_drop,
      heart_rate:           req.body.heart_rate,
      hr_spike:             req.body.hr_spike,
      accel:                req.body.accel,
      sleep_duration_hours: req.body.sleep_duration_hours,
      time_in_bed_hours:    req.body.time_in_bed_hours,
      ahi:                  req.body.ahi,
      ...derived
    });
    await record.save();
    console.log(`✅ SleepApnea saved | User: ${req.user.id} | Severity: ${derived.severity}`);

    // ✅ Moderate+ disease notification
    const moderateSeverities = ['Moderate', 'Severe', 'Critical'];
    if (moderateSeverities.includes(derived.severity)) {
      await sendGuardianNotification(
        req.user.id,
        '🚨 Sleep Apnea Alert',
        `Sleep Apnea is ${derived.severity} — please check patient immediately`
      );
    }

    res.status(201).json({ success: true, message: '✅ Sleep Apnea data saved', data: record });
  } catch (error) {
    console.error('❌ Sleep Apnea error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/vitals/tachy-brady — notify with disease severity
// ─────────────────────────────────────────────────────────────────────────────
router.post('/tachy-brady', auth, async (req, res) => {
  try {
    const derived = processTachyBrady(req.body);
    const record = new TachycardiaBradycardia({
      patient_id:   req.user.id,
      age:          req.body.age,
      gender:       req.body.gender,
      heart_rate:   req.body.heart_rate,
      systolic_bp:  req.body.systolic_bp,
      diastolic_bp: req.body.diastolic_bp,
      spo2:         req.body.spo2,
      ...derived
    });
    await record.save();
    console.log(`✅ TachyBrady saved | User: ${req.user.id} | Condition: ${derived.hr_condition} | Severity: ${derived.severity}`);

    // ✅ Moderate+ disease notification
    const moderateSeverities = ['Moderate', 'Severe', 'Critical'];
    if (moderateSeverities.includes(derived.severity)) {
      await sendGuardianNotification(
        req.user.id,
        '🚨 Tachycardia/Bradycardia Alert',
        `${derived.hr_condition} is ${derived.severity} — Heart rate ${req.body.heart_rate} bpm`
      );
    }

    res.status(201).json({ success: true, message: '✅ Tachycardia/Bradycardia data saved', data: record });
  } catch (error) {
    console.error('❌ Tachy/Brady error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/vitals/latest
// ─────────────────────────────────────────────────────────────────────────────
router.get('/latest', auth, async (req, res) => {
  try {
    const latest = await VitalReading.findOne({ userId: req.user.id }).sort({ timestamp: -1 });
    if (!latest) return res.status(404).json({ success: false, message: 'No vitals found' });
    res.json({ success: true, data: latest });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch latest vitals' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/vitals/history
// ─────────────────────────────────────────────────────────────────────────────
router.get('/history', auth, async (req, res) => {
  try {
    const { startDate, endDate, limit = 1000 } = req.query;
    const query = { userId: req.user.id };
    if (startDate && endDate) {
      query.timestamp = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }
    const readings = await VitalReading.find(query).sort({ timestamp: -1 }).limit(parseInt(limit));
    res.json({ success: true, count: readings.length, data: readings });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch history' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/vitals/stats
// ─────────────────────────────────────────────────────────────────────────────
router.get('/stats', auth, async (req, res) => {
  try {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const readings = await VitalReading.find({ userId: req.user.id, timestamp: { $gte: sevenDaysAgo } }).sort({ timestamp: -1 });

    if (readings.length === 0) return res.json({ success: true, message: 'No data found', stats: null });

    const avg = (field) => parseFloat((readings.reduce((s, r) => s + (r[field] || 0), 0) / readings.length).toFixed(2));
    const conditionCount = readings.reduce((acc, r) => { acc[r.condition] = (acc[r.condition] || 0) + 1; return acc; }, {});

    res.json({
      success: true,
      stats: {
        totalReadings: readings.length,
        avgHeartRate: avg('heartRate'), avgBloodOxygen: avg('bloodOxygen'),
        avgTemperature: avg('temperature'), avgRiskScore: avg('riskScore'),
        totalSteps: readings.reduce((s, r) => s + (r.footsteps || 0), 0),
        conditionBreakdown: conditionCount,
        alerts: {
          critical: readings.filter((r) => r.alertLevel === 'critical').length,
          warning:  readings.filter((r) => r.alertLevel === 'warning').length,
          normal:   readings.filter((r) => r.alertLevel === 'normal').length,
        },
        latestReading: readings[0],
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch stats' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/vitals/patient/:patient_id
// ─────────────────────────────────────────────────────────────────────────────
router.get('/patient/:patient_id', auth, async (req, res) => {
  try {
    const { patient_id } = req.params;
    const [hypertension, sleepApnea, tachyBrady] = await Promise.all([
      Hypertension.find({ patient_id }).sort({ timestamp: -1 }).limit(10),
      SleepApnea.find({ patient_id }).sort({ timestamp: -1 }).limit(10),
      TachycardiaBradycardia.find({ patient_id }).sort({ timestamp: -1 }).limit(10),
    ]);
    res.json({ success: true, patient_id, data: { hypertension, sleepApnea, tachyBrady } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;