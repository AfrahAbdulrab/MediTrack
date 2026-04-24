const mongoose = require('mongoose');  // ← ye pehle se hona chahiye tha

const emergencyContactSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  name: String,
  phone: String,
  email: String,
  relationship: String,
  isPrimary: Boolean,
}, { collection: 'emergencycontacts' });

module.exports = mongoose.models.EmergencyContact || 
  mongoose.model('EmergencyContact', emergencyContactSchema);