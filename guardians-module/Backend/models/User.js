const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: String,
  age: Number,
  gender: String,
  bloodType: String,
  patientId: String,
  phone: String,
  address: String,
  monitoringSince: Date,
  status: String,
}, { collection: 'users' });

module.exports = mongoose.models.User || 
  mongoose.model('User', userSchema);