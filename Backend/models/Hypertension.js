const mongoose = require('mongoose');

const HypertensionSchema = new mongoose.Schema({
  // Patient Info
  patient_id: { type: String, required: true },
  age: { type: Number, required: true },
  gender: { type: String, enum: ['Male', 'Female'], required: true },
  weight_kg: { type: Number, required: true },
  height_cm: { type: Number, required: true },

  // Raw Vitals (from Health Connect)
  systolic_bp: { type: Number, required: true },
  diastolic_bp: { type: Number, required: true },
  resting_hr: { type: Number, required: true },
  steps_7days: { type: [Number], required: true }, // array of 7 days

  // Derived Features (auto-calculated)
  bmi: { type: Number },
  bmi_score: { type: Number },
  bp_score: { type: Number },
  pulse_pressure: { type: Number },
  pp_score: { type: Number },
  map_mmhg: { type: Number },
  map_score: { type: Number },
  hrr_proxy: { type: Number },
  hrr_score: { type: Number },
  steps_7day_avg: { type: Number },
  steps_score: { type: Number },
  age_score: { type: Number },
  gender_adj: { type: Number },

  // Final Result
  risk_score: { type: Number },
  severity: { type: String, enum: ['Normal', 'Mild', 'Moderate', 'Severe'] },

  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Hypertension', HypertensionSchema, 'Hypertension');