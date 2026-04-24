const mongoose = require('mongoose');

const vitalReadingSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  heartRate: Number,
  bloodOxygen: Number,
  systolicBP: Number,
  diastolicBP: Number,
  bloodSugar: Number,
  temperature: Number,
  footsteps: Number,
  alertLevel: { type: String, enum: ['normal', 'warning', 'critical'], default: 'normal' },
  timestamp: { type: Date, default: Date.now },
}, { collection: 'vitalreadings' });

module.exports = mongoose.models.VitalReading ||
  mongoose.model('VitalReading', vitalReadingSchema);