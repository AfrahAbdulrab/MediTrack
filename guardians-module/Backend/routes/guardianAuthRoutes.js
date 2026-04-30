const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const crypto = require('crypto');

const Guardian = require('../models/Guardian');
const EmergencyContact = require('../models/EmergencyContact');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'meditrack_super_secret_key_2024';

// ── Nodemailer Setup (Gmail) ──────────────────────────────────────────────────
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,   // .env mein apni Gmail daalo
    pass: process.env.EMAIL_PASS,   // .env mein App Password daalo (Google 2FA wala)
  },
});

// ── OTP Email Bhejne Ka Helper ────────────────────────────────────────────────
const sendOTPEmail = async (email, otp, guardianName) => {
  await transporter.sendMail({
    from: `"MediTrack" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'MediTrack - Your OTP Code',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: auto; padding: 24px; border: 1px solid #eee; border-radius: 12px;">
        <h2 style="color: #2979ff;">🏥 MediTrack</h2>
        <p>Hello <strong>${guardianName}</strong>,</p>
        <p>Your OTP to verify your Guardian account is:</p>
        <div style="font-size: 36px; font-weight: bold; letter-spacing: 10px; color: #2979ff; text-align: center; padding: 20px 0;">
          ${otp}
        </div>
        <p style="color: #888; font-size: 13px;">This OTP is valid for <strong>10 minutes</strong>. Do not share it with anyone.</p>
        <hr style="border: none; border-top: 1px solid #eee;" />
        <p style="color: #aaa; font-size: 12px;">MediTrack Guardian Health Monitor</p>
      </div>
    `,
  });
};

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
// Phone check karo → OTP guardian ki EMAIL pe bhejo
// ─────────────────────────────────────────────────────────────────────────────
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, phone, relation } = req.body;

    if (!name || !email || !password || !phone) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }

    // Check: phone number kisi patient ke emergency contacts mein hai?
    const emergencyContact = await EmergencyContact.findOne({ phone: phone.trim() });
    if (!emergencyContact) {
      return res.status(404).json({
        success: false,
        message: 'This number has not been added by any patient. Please ask the patient to add your number first.',
      });
    }

    // ✅ NEW: Agar patient ne email bhi daali hai toh match karo
    if (emergencyContact.email && emergencyContact.email !== email.toLowerCase().trim()) {
      return res.status(403).json({
        success: false,
        message: 'This email does not match the registered number. Please enter the correct email..',
      });
    }

    const patientId = emergencyContact.userId;

    // 6-digit OTP banao
    const otp = crypto.randomInt(100000, 999999).toString();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Guardian save karo ya update karo
    let guardian = await Guardian.findOne({ email: email.toLowerCase() });
    if (!guardian) {
      guardian = new Guardian({
        name,
        email: email.toLowerCase(),
        password,
        phone: phone.trim(),
        relation: relation || 'Guardian',
        patientId,
        isVerified: false,
        otp,
        otpExpiry,
      });
    } else {
      // Already exists — update karo
      guardian.name = name;
      guardian.password = password;
      guardian.phone = phone.trim();
      guardian.patientId = patientId;
      guardian.relation = relation || guardian.relation;
      guardian.otp = otp;
      guardian.otpExpiry = otpExpiry;
      guardian.isVerified = false;
    }

    await guardian.save();

    // ✅ OTP guardian ki email pe bhejo
    await sendOTPEmail(email.toLowerCase(), otp, name);

    console.log(`✅ OTP sent via Email to ${email} | Patient: ${patientId}`);

    res.status(200).json({
      success: true,
      message: 'OTP sent successfully! Please check your email.',
      email: email.toLowerCase(),
    });

  } catch (err) {
    console.error('❌ Register error:', err.message);
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// STEP 2: POST /api/guardian/auth/verify-otp
// Email + OTP verify karo → JWT token do
// ─────────────────────────────────────────────────────────────────────────────
router.post('/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ success: false, message: 'Email and OTP are required' });
    }

    const guardian = await Guardian.findOne({ email: email.toLowerCase() });
    if (!guardian) {
      return res.status(404).json({ success: false, message: 'Account not found' });
    }

    // OTP check karo
    if (guardian.otp !== otp.trim()) {
      return res.status(400).json({ success: false, message: 'Incorrect OTP. Please try again.' });
    }

    // Expiry check karo
    if (new Date() > guardian.otpExpiry) {
      return res.status(400).json({ success: false, message: 'OTP has expired. Please register again' });
    }

    // Verify mark karo, OTP clear karo
    guardian.isVerified = true;
    guardian.otp = null;
    guardian.otpExpiry = null;
    await guardian.save();

    // JWT token banao
    const token = jwt.sign(
      { guardianId: guardian._id, email: guardian.email },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    const patient = await User.findById(guardian.patientId)
      .select('name age gender bloodType patientId phone');

    console.log(`✅ Guardian verified | ${guardian.name} → Patient: ${patient?.name}`);

    res.status(200).json({
      success: true,
      message: 'Account verified successfully!!',
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
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    const guardian = await Guardian.findOne({ email: email.toLowerCase() });
    if (!guardian) {
      return res.status(401).json({ success: false, message: 'Incorrect email Please write again' });
    }

    if (!guardian.isVerified) {
      return res.status(403).json({
        success: false,
        message: 'Please verify your account with OTP first',
        needsVerification: true,
        email: guardian.email,
      });
    }

    const isMatch = await guardian.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Incorrect  password.!!' });
    }

    const token = jwt.sign(
      { guardianId: guardian._id, email: guardian.email },
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