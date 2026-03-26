// Backend/models/VitalReading.js
const mongoose = require('mongoose');

const VitalReadingSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  timestamp: {
    type: Date,
    required: true,
    default: Date.now
  },
  heartRate: {
    type: Number,
    required: true,
    min: 30,
    max: 250
  },
  bloodOxygen: {
    type: Number,
    required: true,
    min: 70,
    max: 100
  },
  temperature: {
    type: Number,
    required: true,
    min: 35,
    max: 42
  },
  systolicBP: Number,
  diastolicBP: Number,
  respiratoryRate: Number,
  hrVariability: Number,
  hasHeartDisease: {
    type: Boolean,
    default: null
  },
  diseaseType: {
    type: String,
    enum: ['None', 'Arrhythmia', 'Coronary', 'Heart Failure', 'Other']
  },
  dataQuality: {
    type: String,
    enum: ['Good', 'Fair', 'Poor'],
    default: 'Good'
  }
}, {
  timestamps: true
});

VitalReadingSchema.index({ userId: 1, timestamp: -1 });
VitalReadingSchema.index({ timestamp: -1 });

module.exports = mongoose.model('VitalReading', VitalReadingSchema);