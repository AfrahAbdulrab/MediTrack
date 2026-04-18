const mongoose = require('mongoose');

const heartConditionSchema = new mongoose.Schema({
    patientName: String,
    age: Number,
    gender: { type: String, enum: ['Male', 'Female'] },
    rhr: Number,              // Current Resting Heart Rate from Watch
    systolic_bp: Number,      // From Watch/App
    diastolic_bp: Number,
    activity_level: String,    // Sedentary, Active, etc.
    
    // Derived Features (Auto-calculated)
    hr_category: String,       // Tachycardia, Bradycardia, or Normal
    heart_reserve: Number,     // Max HR - RHR
    map: Number,               // Mean Arterial Pressure
    risk_score: Number,
    condition_severity: String, // Normal, Mild, Moderate, Severe
    timestamp: { type: Date, default: Date.now }
});

// PRE-SAVE HOOK: Heart Rate Logic
heartConditionSchema.pre('save', function(next) {
    const doc = this;

    // 1. Determine Category based on BPM
    if (doc.rhr > 100) {
        doc.hr_category = 'Tachycardia';
    } else if (doc.rhr < 60) {
        doc.hr_category = 'Bradycardia';
    } else {
        doc.hr_category = 'Normal';
    }

    // 2. Heart Rate Reserve (HRR) Calculation
    // Formula: (220 - Age) - RHR
    const maxHR = 220 - doc.age;
    doc.heart_reserve = maxHR - doc.rhr;

    // 3. MAP Calculation (Important for Heart Stress)
    doc.map = doc.diastolic_bp + (doc.systolic_bp - doc.diastolic_bp) / 3;

    // 4. Custom Risk Score Logic for Heart Rate
    // Agar BPM extreme hai to score barh jaye
    let hrScore = 0;
    if (doc.rhr > 120 || doc.rhr < 45) hrScore = 0.90;      // Severe
    else if (doc.rhr > 100 || doc.rhr < 60) hrScore = 0.60; // Moderate
    else hrScore = 0.10;                                   // Normal

    // 5. Final Weightage (Example weights)
    doc.risk_score = (hrScore * 0.60) + ( (doc.map > 100 ? 0.70 : 0.10) * 0.40 );

    // 6. Severity Classification
    if (doc.risk_score <= 0.30) doc.condition_severity = "Normal";
    else if (doc.risk_score <= 0.60) doc.condition_severity = "Mild";
    else doc.condition_severity = "Severe";

    next();
});

module.exports = mongoose.model('HeartCondition', heartConditionSchema);