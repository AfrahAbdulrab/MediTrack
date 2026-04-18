const mongoose = require('mongoose');

// ─────────────────────────────────────────────────────────────────────────────
// VitalReading Schema
// Dataset: heart_dataset_20000.csv ke sab fields cover kiye hain
// Wearable se aane wale extra fields bhi include hain
// ─────────────────────────────────────────────────────────────────────────────

const VitalReadingSchema = new mongoose.Schema(
  {
    // ── User reference ────────────────────────────────────────────────────────
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    // ── Dataset fields (CSV ke exact columns) ────────────────────────────────

    // Patient_ID — optional
    patientId: {
      type: String,
      default: null,
    },

    // Age
    age: {
      type: Number,
      default: null,
    },

    // Gender
    gender: {
      type: String,
      enum: ['Male', 'Female', 'Other', null],
      default: null,
    },

    // HR (bpm) — Heart Rate
    heartRate: {
      type: Number,
      required: true,
      min: 30,
      max: 250,
    },

    // SpO2 (%) — Blood Oxygen
    bloodOxygen: {
      type: Number,
      required: true,
      min: 70,
      max: 100,
    },

    // Body_Temp (°C)
    temperature: {
      type: Number,
      required: true,
      min: 35,
      max: 42,
    },

    // Systolic_BP (mmHg)
    systolicBP: {
      type: Number,
      default: null,
    },

    // Diastolic_BP (mmHg)
    diastolicBP: {
      type: Number,
      default: null,
    },

    // Blood_Sugar (mg/dL)
    bloodSugar: {
      type: Number,
      default: null,
    },

    // Respiratory_Rate
    respiratoryRate: {
      type: Number,
      default: null,
    },

    // Pulse_Pressure = Systolic - Diastolic (auto-calculated pre-save)
    pulsePressure: {
      type: Number,
      default: null,
    },

    // MAP (mmHg) — Mean Arterial Pressure (auto-calculated)
    // Formula: Diastolic + (Pulse_Pressure / 3)
    map: {
      type: Number,
      default: null,
    },

    // Max_HR — Maximum Heart Rate (auto-calculated)
    // Formula: 220 - Age
    maxHR: {
      type: Number,
      default: null,
    },

    // HRR — Heart Rate Reserve (auto-calculated)
    // Formula: Max_HR - Resting_HR
    hrr: {
      type: Number,
      default: null,
    },

    // Shock_Index (auto-calculated)
    // Formula: HR / Systolic_BP
    shockIndex: {
      type: Number,
      default: null,
    },

    // RPP — Rate Pressure Product (auto-calculated)
    // Formula: HR * Systolic_BP
    rpp: {
      type: Number,
      default: null,
    },

    // SpO2_Deficit (auto-calculated)
    // Formula: 100 - SpO2
    spo2Deficit: {
      type: Number,
      default: null,
    },

    // Condition — rule-based (matches dataset categories)
    condition: {
      type: String,
      enum: [
        'Normal',
        'Tachycardia',
        'Bradycardia',
        'Hypoxia',
        'Hyperthermia',
        'Hypothermia',
        'Hypertension',
        'Hypotension',
        'Critical',
        'Unknown',
      ],
      default: 'Unknown',
    },

    // Risk_Score (0.0 - 1.0)
    riskScore: {
      type: Number,
      default: null,
      min: 0,
      max: 1,
    },

    // Severity
    severity: {
      type: String,
      enum: ['Normal', 'Mild', 'Moderate', 'Severe', 'Critical', null],
      default: null,
    },

    // ── Wearable extra fields (Health Connect se) ────────────────────────────

    footsteps: {
      type: Number,
      default: 0,
    },

    restingHeartRate: {
      type: Number,
      default: null,
    },

    bmi: {
      type: Number,
      default: null,
    },

    accelerometer: {
      x:         { type: Number, default: 0 },
      y:         { type: Number, default: 9.8 },
      z:         { type: Number, default: 0 },
      intensity: {
        type: String,
        enum: ['Still', 'Light', 'Moderate', 'Active'],
        default: 'Still',
      },
    },

    // ── Alert level (auto in pre-save) ───────────────────────────────────────
    alertLevel: {
      type: String,
      enum: ['normal', 'warning', 'critical'],
      default: 'normal',
    },

    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// ── Indexes ───────────────────────────────────────────────────────────────────
VitalReadingSchema.index({ userId: 1, timestamp: -1 });
VitalReadingSchema.index({ timestamp: -1 });
VitalReadingSchema.index({ alertLevel: 1 });
VitalReadingSchema.index({ condition: 1 });

// ── Pre-save: sab calculated fields auto compute ──────────────────────────────
VitalReadingSchema.pre('save', function (next) {
  const hr   = this.heartRate;
  const spo2 = this.bloodOxygen;
  const temp = this.temperature;
  const sys  = this.systolicBP;
  const dia  = this.diastolicBP;
  const age  = this.age;
  const rhr  = this.restingHeartRate;

  // Pulse Pressure
  if (sys && dia) {
    this.pulsePressure = parseFloat((sys - dia).toFixed(2));
  }

  // MAP: Diastolic + (Pulse_Pressure / 3)
  if (sys && dia) {
    this.map = parseFloat((dia + (sys - dia) / 3).toFixed(2));
  }

  // Max HR: 220 - Age
  if (age) {
    this.maxHR = 220 - age;
  }

  // HRR: Max_HR - Resting_HR
  if (this.maxHR && rhr) {
    this.hrr = this.maxHR - rhr;
  }

  // Shock Index: HR / Systolic_BP
  if (sys && hr) {
    this.shockIndex = parseFloat((hr / sys).toFixed(3));
  }

  // RPP: HR * Systolic_BP
  if (sys && hr) {
    this.rpp = hr * sys;
  }

  // SpO2 Deficit: 100 - SpO2
  if (spo2) {
    this.spo2Deficit = parseFloat((100 - spo2).toFixed(2));
  }

  // Condition (dataset ki categories se match)
  if (hr > 100) {
    this.condition = 'Tachycardia';
  } else if (hr < 60) {
    this.condition = 'Bradycardia';
  } else if (spo2 < 90) {
    this.condition = 'Hypoxia';
  } else if (temp > 38.5) {
    this.condition = 'Hyperthermia';
  } else if (temp < 36.0) {
    this.condition = 'Hypothermia';
  } else if (sys && sys > 140) {
    this.condition = 'Hypertension';
  } else if (sys && sys < 90) {
    this.condition = 'Hypotension';
  } else {
    this.condition = 'Normal';
  }

  // Risk Score (0.0 - 1.0)
  let risk = 0;
  if (hr > 120 || hr < 50)        risk += 0.30;
  else if (hr > 100 || hr < 60)   risk += 0.15;
  if (spo2 < 90)                  risk += 0.30;
  else if (spo2 < 95)             risk += 0.15;
  if (temp > 39 || temp < 35.5)   risk += 0.20;
  else if (temp > 38.5)           risk += 0.10;
  if (sys && sys > 160)           risk += 0.20;
  else if (sys && sys > 140)      risk += 0.10;
  this.riskScore = parseFloat(Math.min(risk, 1).toFixed(4));

  // Severity
  if (this.riskScore >= 0.6)       this.severity = 'Critical';
  else if (this.riskScore >= 0.4)  this.severity = 'Severe';
  else if (this.riskScore >= 0.25) this.severity = 'Moderate';
  else if (this.riskScore >= 0.1)  this.severity = 'Mild';
  else                             this.severity = 'Normal';

  // Alert Level
  if (this.severity === 'Critical' || this.severity === 'Severe') {
    this.alertLevel = 'critical';
  } else if (this.severity === 'Moderate' || this.severity === 'Mild') {
    this.alertLevel = 'warning';
  } else {
    this.alertLevel = 'normal';
  }

  next();
});

module.exports = mongoose.model('VitalReading', VitalReadingSchema);