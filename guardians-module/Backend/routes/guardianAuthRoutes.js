const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const twilio = require('twilio');
const mongoose = require('mongoose');

const Guardian = require('../models/Guardian');
const JWT_SECRET = process.env.JWT_SECRET || 'meditrack_super_secret_key_2024';

// ── EmergencyContact Model (same DB connection) ───────────────────────────────
const EmergencyContact = mongoose.models.EmergencyContact || mongoose.model('EmergencyContact', new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  name: String,
  phone: String,
  relationship: String,
  isPrimary: { type: Boolean, default: false }
}, { timestamps: true }));

// ── User Model (same DB connection) ──────────────────────────────────────────
const User = mongoose.models.User || mongoose.model('User', new mongoose.Schema({
  name: String,
  age: Number,
  gender: String,
  bloodType: String,
  patientId: String,
  phone: String,
  address: String,
  monitoringSince: String,
  status: String
}));

// ── Twilio Verify setup ───────────────────────────────────────────────────────
const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

// ── Guardian Auth Middleware ──────────────────────────────────────────────────
const guardianAuth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ success: false, message: 'Token required' });

    const decoded = jwt.verify(token, JWT_SECRET);
    const guardian = await Guardian.findById(decoded.guardianId);
    if (!guardian) return res.status(401).json({ success: false, message: 'Guardian not found' });

    req.guardian = guardian;
    next();
  } catch (err) {
    res.status(401).json({ success: false, message: 'Invalid token' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// STEP 1: POST /api/guardian/auth/register
// Phone number check karo → OTP bhejo
// ─────────────────────────────────────────────────────────────────────────────
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, phone, relation } = req.body;

    if (!name || !email || !password || !phone) {
      return res.status(400).json({ success: false, message: 'Sab fields required hain' });
    }

    // Check: email already registered?
    const existingGuardian = await Guardian.findOne({ email: email.toLowerCase() });
    if (existingGuardian && existingGuardian.isVerified) {
      return res.status(400).json({ success: false, message: 'Email already registered hai' });
    }

    // Phone ko international format mein convert karo
    let formattedPhone = phone.trim();
    if (formattedPhone.startsWith('0')) {
      formattedPhone = '+92' + formattedPhone.slice(1);
    }

    console.log('🔍 Searching for phone:', formattedPhone, '| Original:', phone.trim());

    // Check: phone number kisi patient ke emergency contacts mein hai?
    const emergencyContact = await EmergencyContact.findOne({ 
      $or: [
        { phone: phone.trim() },
        { phone: formattedPhone }
      ]
    });

    console.log('📋 Emergency contact found:', emergencyContact);

    if (!emergencyContact) {
      return res.status(404).json({
        success: false,
        message: 'Yeh number kisi patient ne add nahi kiya. Pehle patient se apna number add karwao.',
      });
    }

    const patientId = emergencyContact.userId;

    // Guardian save karo ya update karo
    let guardian = await Guardian.findOne({ phone: phone.trim() });
    if (!guardian) {
      guardian = new Guardian({
        name,
        email: email.toLowerCase(),
        password,
        phone: phone.trim(),
        relation: relation || 'Guardian',
        patientId,
        isVerified: false,
      });
    } else {
      guardian.name = name;
      guardian.email = email.toLowerCase();
      guardian.password = password;
      guardian.patientId = patientId;
      guardian.relation = relation || guardian.relation;
    }

    await guardian.save();

    // ✅ Twilio Verify se OTP bhejo (international format mein)
    await twilioClient.verify.v2
      .services(process.env.TWILIO_VERIFY_SERVICE_SID)
      .verifications.create({
        to: formattedPhone,
        channel: 'sms'
      });

    console.log(`✅ OTP sent via Twilio Verify to ${formattedPhone} | Patient: ${patientId}`);

    res.status(200).json({
      success: true,
      message: 'OTP bhej diya gaya! Phone check karo.',
      phone: phone.trim(),
    });

  } catch (err) {
    console.error('❌ Register error:', err.message);
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// STEP 2: POST /api/guardian/auth/verify-otp
// OTP verify karo → JWT token do
// ─────────────────────────────────────────────────────────────────────────────
router.post('/verify-otp', async (req, res) => {
  try {
    const { phone, otp } = req.body;

    if (!phone || !otp) {
      return res.status(400).json({ success: false, message: 'Phone aur OTP required hain' });
    }

    // Phone ko international format mein convert karo
    let formattedPhone = phone.trim();
    if (formattedPhone.startsWith('0')) {
      formattedPhone = '+92' + formattedPhone.slice(1);
    }

    // ✅ Twilio Verify se check karo
    const verification = await twilioClient.verify.v2
      .services(process.env.TWILIO_VERIFY_SERVICE_SID)
      .verificationChecks.create({
        to: formattedPhone,
        code: otp
      });

    if (verification.status !== 'approved') {
      return res.status(400).json({ success: false, message: 'Galat OTP hai ya expire ho gaya' });
    }

    // Guardian dhundo
    const guardian = await Guardian.findOne({ phone: phone.trim() });
    if (!guardian) {
      return res.status(404).json({ success: false, message: 'Guardian nahi mila' });
    }

    // Verify mark karo
    guardian.isVerified = true;
    await guardian.save();

    // JWT token banao
    const token = jwt.sign(
      { guardianId: guardian._id, phone: guardian.phone },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    // Patient info bhi bhejo
    const patient = await User.findById(guardian.patientId)
      .select('name age gender bloodType patientId phone');

    console.log(`✅ Guardian verified | ${guardian.name} → Patient: ${patient?.name}`);

    res.status(200).json({
      success: true,
      message: 'Guardian account verify ho gaya!',
      token,
      guardian: guardian.toPublicJSON(),
      patient: patient || null,
    });

  } catch (err) {
    console.error('❌ Verify OTP error:', err.message);
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// STEP 3: POST /api/guardian/auth/login
// ─────────────────────────────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email aur password required hain' });
    }

    const guardian = await Guardian.findOne({ email: email.toLowerCase() });
    if (!guardian) {
      return res.status(401).json({ success: false, message: 'Email ya password galat hai' });
    }

    if (!guardian.isVerified) {
      return res.status(403).json({
        success: false,
        message: 'Pehle OTP se verify karo',
        needsVerification: true,
        phone: guardian.phone,
      });
    }

    const isMatch = await guardian.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Email ya password galat hai' });
    }

    const token = jwt.sign(
      { guardianId: guardian._id, phone: guardian.phone },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    const patient = await User.findById(guardian.patientId)
      .select('name age gender bloodType patientId phone address monitoringSince status');

    console.log(`✅ Guardian login | ${guardian.name}`);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      guardian: guardian.toPublicJSON(),
      patient,
    });

  } catch (err) {
    console.error('❌ Login error:', err.message);
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/guardian/auth/profile
// ─────────────────────────────────────────────────────────────────────────────
router.get('/profile', guardianAuth, async (req, res) => {
  try {
    const patient = await User.findById(req.guardian.patientId)
      .select('name age gender bloodType patientId phone address monitoringSince status');

    const otherContacts = await EmergencyContact.find({
      userId: req.guardian.patientId,
      phone: { $ne: req.guardian.phone },
    });

    res.json({
      success: true,
      guardian: req.guardian.toPublicJSON(),
      patient,
      otherGuardians: otherContacts,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/guardian/auth/save-push-token
// ─────────────────────────────────────────────────────────────────────────────
router.post('/save-push-token', guardianAuth, async (req, res) => {
  try {
    const { expoPushToken } = req.body;
    await Guardian.findByIdAndUpdate(req.guardian._id, { expoPushToken });
    res.json({ success: true, message: 'Push token saved' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = { router, guardianAuth };