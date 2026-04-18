const mongoose = require("mongoose");

const emergencyContactSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  phone: {
    type: String,
    required: true,
    trim: true,
  },
  relationship: {
    type: String,
    required: true,
    trim: true,
  },
  isPrimary: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true
});

// ✅ Duplicate prevention — same user same phone dobara add nahi hoga
emergencyContactSchema.index({ userId: 1, phone: 1 }, { unique: true });

module.exports = mongoose.model("EmergencyContact", emergencyContactSchema);