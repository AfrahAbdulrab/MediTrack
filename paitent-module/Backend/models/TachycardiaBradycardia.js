const mongoose = require('mongoose');

const TachyBradySchema = new mongoose.Schema({
  // Patient Info
  patient_id: { type: String, required: true },
  age: { type: Number, required: true },
  gender: { type: String, enum: ['Male', 'Female'], required: true },

  // Raw Vitals (from Health Connect)
  heart_rate: { type: Number, required: true },
  systolic_bp: { type: Number, required: true },
  diastolic_bp: { type: Number, required: true },
  spo2: { type: Number, required: true },

  // HR Condition (auto-detected)
  hr_condition: { type: String, enum: ['Normal', 'Tachycardia', 'Bradycardia'] },

  // Derived Features (auto-calculated)
  pulse_pressure: { type: Number },
  map_mmhg: { type: Number },
  max_hr: { type: Number },
  hrr: { type: Number },
  shock_index: { type: Number },
  rpp: { type: Number },
  spo2_deficit: { type: Number },

  // Final Result
  risk_score: { type: Number },
  severity: { type: String, enum: ['Normal', 'Mild', 'Moderate', 'Severe'] },

  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('TachycardiaBradycardia', TachyBradySchema, 'Tachycardia_Bradycardia');