const mongoose = require('mongoose');

const SleepApneaSchema = new mongoose.Schema({
  // Patient Info
  patient_id: { type: String, required: true },
  age: { type: Number, required: true },
  gender: { type: String, enum: ['Male', 'Female'], required: true },

  // Raw Vitals (from Health Connect - per 30-sec window)
  spo2: { type: Number, required: true },         // e.g. 88%
  spo2_drop: { type: Number, required: true },    // drop from baseline
  heart_rate: { type: Number, required: true },
  hr_spike: { type: Boolean, default: false },
  accel: { type: Number, required: true },        // movement in g
  sleep_duration_hours: { type: Number },
  time_in_bed_hours: { type: Number },

  // Derived / Scored Features (auto-calculated)
  spo2_score: { type: Number },     // 0, 1, or 2
  hr_score: { type: Number },       // 0, 1, or 2
  accel_score: { type: Number },    // 0, 1, or 2
  age_gender_score: { type: Number },
  risk_multiplier: { type: Number },
  physio_score: { type: Number },
  event_score: { type: Number },
  ahi: { type: Number },
  ahi_threshold: { type: Number },

  // Final Result
  event_label: { type: Number, enum: [0, 1, 2] }, // 0=None, 1=Moderate, 2=Severe
  severity: { type: String, enum: ['Normal', 'Mild', 'Moderate', 'Severe'] },

  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('SleepApnea', SleepApneaSchema, 'SleepApnea');