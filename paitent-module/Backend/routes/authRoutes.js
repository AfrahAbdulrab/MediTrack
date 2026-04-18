const express = require("express");
const router = express.Router();
const User = require("../models/User");
const jwt = require("jsonwebtoken");


const JWT_SECRET = process.env.JWT_SECRET || "meditrack_super_secret_key_2024";

const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = 'uploads/profiles/';
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'profile-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'));
    }
  }
});

// ===== MIDDLEWARE: Authenticate Token (DECLARE ONLY ONCE!) =====
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ message: "Access token required" });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch (error) {
    return res.status(403).json({ message: "Invalid or expired token" });
  }
};

// ===== SIGNUP =====
router.post("/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ 
        message: "Please provide name, email and password" 
      });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ 
        message: "Email already registered" 
      });
    }

    const user = new User({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: password,
      fullName: name.trim(),
    });

    await user.save();

    const token = jwt.sign(
      { userId: user._id, email: user.email },
      JWT_SECRET,
      { expiresIn: "30d" }
    );

    res.status(201).json({
      message: "Account created successfully",
      token: token,
      user: user.toPublicJSON(),
    });
  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({ 
      message: "Server error during signup",
      error: error.message 
    });
  }
});

// ===== SIGNIN =====
router.post("/signin", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ 
        message: "Please provide email and password" 
      });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ 
        message: "Invalid email or password" 
      });
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ 
        message: "Invalid email or password" 
      });
    }

    // Update monitoring days
    const daysSinceCreation = Math.floor(
      (Date.now() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24)
    );
    user.dayMonitored = daysSinceCreation;
    await user.save();

    const token = jwt.sign(
      { userId: user._id, email: user.email },
      JWT_SECRET,
      { expiresIn: "30d" }
    );

    res.status(200).json({
      message: "Login successful",
      token: token,
      user: user.toPublicJSON(),
    });
  } catch (error) {
    console.error("Signin error:", error);
    res.status(500).json({ 
      message: "Server error during signin",
      error: error.message 
    });
  }
});

// ===== GET PROFILE =====
router.get("/profile", authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      message: "Profile retrieved successfully",
      user: user.toPublicJSON(),
    });
  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({ 
      message: "Server error",
      error: error.message 
    });
  }
});

// ===== UPDATE PROFILE =====
router.put("/profile", authenticateToken, async (req, res) => {
  try {
    const updates = req.body;
    
    // Don't allow updating email and password through this route
    delete updates.email;
    delete updates.password;
    delete updates._id;

    // Calculate BMI if height and weight are provided
    if (updates.height && updates.weight) {
      const heightInMeters = parseFloat(updates.height) * 0.3048;
      const weightInKg = parseFloat(updates.weight);
      updates.bmi = (weightInKg / (heightInMeters ** 2)).toFixed(1);
    }

    const user = await User.findByIdAndUpdate(
      req.userId,
      { ...updates, updatedAt: Date.now() },
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      message: "Profile updated successfully",
      user: user.toPublicJSON(),
    });
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({ 
      message: "Server error during update",
      error: error.message 
    });
  }
});

// ===== UPLOAD PROFILE IMAGE =====
router.post("/upload-profile-image", authenticateToken, upload.single('profileImage'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No image file uploaded" });
    }
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Delete old image if exists
    if (user.profileImage) {
      const oldImagePath = user.profileImage.replace('http://localhost:5000/', '');
      const fullPath = path.join(__dirname, '..', oldImagePath);
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
        console.log('✅ Old image deleted');
      }
    }

    // Save new image URL
    const imageUrl = `http://localhost:5000/uploads/profiles/${req.file.filename}`;
    user.profileImage = imageUrl;
    await user.save();

    console.log('✅ Profile image uploaded:', imageUrl);

    res.status(200).json({
      message: "Profile image uploaded successfully",
      imageUrl: imageUrl,
      user: user.toPublicJSON(),
    });
  } catch (error) {
    console.error("Upload image error:", error);
    res.status(500).json({ 
      message: "Failed to upload image",
      error: error.message 
    });
  }
});

// ===== ✅ SAVE EXPO PUSH TOKEN =====
router.post("/save-push-token", authenticateToken, async (req, res) => {
  try {
    const { expoPushToken } = req.body;
    
    if (!expoPushToken) {
      return res.status(400).json({ message: "Token required" });
    }

    await User.findByIdAndUpdate(req.userId, { expoPushToken });
    console.log(`✅ Push token saved for user: ${req.userId}`);
    
    res.json({ success: true, message: "Push token saved successfully" });
  } catch (error) {
    console.error("Save push token error:", error);
    res.status(500).json({ message: "Failed to save token", error: error.message });
  }
});

// ===== ✅ NEW: UPDATE MANUAL VITALS (BP, Blood Sugar, Body Temp) =====
// Frontend (MyProfile.js) is route ko call karega jab patient vitals enter kare
// ===== ✅ NEW: UPDATE MANUAL VITALS =====
router.put("/vitals", authenticateToken, async (req, res) => {
  try {
    const { bpSystolic, bpDiastolic, bloodSugar, temperature, recordedAt } = req.body;

    if (!bpSystolic && !bpDiastolic && !bloodSugar && !temperature) {
      return res.status(400).json({ message: "Kam az kam ek vital enter karo" });
    }

    let isAbnormal = false;
    if (bpSystolic && (bpSystolic > 140 || bpSystolic < 90))   isAbnormal = true;
    if (bpDiastolic && (bpDiastolic > 90 || bpDiastolic < 60)) isAbnormal = true;
    if (bloodSugar && (bloodSugar > 140 || bloodSugar < 70))   isAbnormal = true;
    if (temperature && (temperature > 99.5 || temperature < 97)) isAbnormal = true;

    const vitalsStatus = isAbnormal ? 'abnormal' : 'normal';
    const now = new Date();
    const nextReminderAt = isAbnormal
      ? new Date(now.getTime() + 1 * 60 * 60 * 1000)
      : new Date(now.getTime() + 24 * 60 * 60 * 1000);

    const user = await User.findByIdAndUpdate(
      req.userId,
      {
        vitals: {
          bpSystolic:  bpSystolic  || null,
          bpDiastolic: bpDiastolic || null,
          bloodSugar:  bloodSugar  || null,
          temperature: temperature || null,
          recordedAt:  recordedAt  || now,
          vitalsStatus,
          nextReminderAt,
        },
        updatedAt: now,
      },
      { new: true }
    );

    if (!user) return res.status(404).json({ message: "User not found" });

    // ✅ YEH NAYA CODE ADD KARO — Guardian ko dikhne ke liye
  try {
  const VitalReading = require('../models/VitalReadings');
  
  let tempCelsius = 37.0;
  if (temperature) {
    tempCelsius = parseFloat(((temperature - 32) * 5 / 9).toFixed(1));
  }

  // ✅ Latest reading UPDATE karo — naya mat banao
  const lastReading = await VitalReading.findOne({ userId: req.userId })
    .sort({ timestamp: -1 });

  if (lastReading) {
    // Sirf null fields update karo
    if (bpSystolic)  lastReading.systolicBP  = bpSystolic;
    if (bpDiastolic) lastReading.diastolicBP = bpDiastolic;
    if (bloodSugar)  lastReading.bloodSugar  = bloodSugar;
    if (temperature) lastReading.temperature = tempCelsius;
    await lastReading.save();
    console.log('✅ Manual vitals updated in latest VitalReading for guardian');
  } else {
    // Koi reading nahi — naya banao
    const newReading = new VitalReading({
      userId:      req.userId,
      timestamp:   now,
      heartRate:   75,
      bloodOxygen: 97,
      temperature: tempCelsius,
      systolicBP:  bpSystolic  || null,
      diastolicBP: bpDiastolic || null,
      bloodSugar:  bloodSugar  || null,
    });
    await newReading.save();
    console.log('✅ New VitalReading created with manual vitals');
  }
} catch (e) {
  console.warn('⚠️ VitalReading save failed (non-critical):', e.message);
}
    // ✅ NAYA CODE KHATAM

    console.log(`✅ Vitals saved | User: ${req.userId} | Status: ${vitalsStatus}`);

    res.status(200).json({
      success: true,
      message: `Vitals saved! ${isAbnormal ? '⚠️ Abnormal' : '✅ Normal'}`,
      vitals: user.vitals,
      vitalsStatus,
      nextReminderAt,
    });

  } catch (error) {
    console.error("❌ Update vitals error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// ===== ✅ NEW: GET VITALS REMINDER STATUS =====
// Frontend check karega ke reminder time aaya ya nahi
router.get("/vitals-reminder", authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const now = new Date();
    const nextReminder = user.vitals?.nextReminderAt;

    // Agar reminder time aa gaya hai
    const shouldRemind = nextReminder && now >= new Date(nextReminder);

    res.json({
      success: true,
      shouldRemind,
      vitalsStatus: user.vitals?.vitalsStatus || 'normal',
      nextReminderAt: nextReminder,
      vitals: user.vitals,
    });

  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

module.exports = router;