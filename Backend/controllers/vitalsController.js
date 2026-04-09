const Hypertension = require('../models/Hypertension');
const HeartCondition = require('../models/HeartCondition');
const VitalReading = require('../models/VitalReadings'); // ✅ NEW

exports.processVitals = async (req, res) => {
    const { diseaseType, vitals } = req.body;

    try {
        let Model;
        // Disease ke mutabiq sahi model select karna
        if (diseaseType === 'Hypertension') {
            Model = Hypertension;
        } else if (diseaseType === 'Heart') {
            Model = HeartCondition;
        } else {
            return res.status(400).json({ message: "Invalid Disease Type" });
        }

        const newRecord = new Model(vitals);
        
        // Save hote hi Mongoose 'pre-save' hooks saari calculations khud kar lenge
        await newRecord.save();

        // Agla step: Prediction ke liye Flask server ko bhejain (Step 3 mein dekhenge)
        res.status(201).json({
            message: "Data processed and saved successfully",
            data: newRecord
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// ✅ NEW: Wearable se aane wala data save karna
// Frontend (useWearData.js) is function ko call karega
// Har interval pe (5min / 15min / 60min) ye data save hoga
exports.saveWearableVitals = async (req, res) => {
    try {
        const {
            heartRate,
            bloodOxygen,
            temperature,
            footsteps,
            restingHeartRate,
            bmi,
            accelerometer,
            patientCondition,  // 'normal' | 'abnormal' | 'critical'
        } = req.body;

        // ── Validation: heartRate aur bloodOxygen zaroori hain ──────────────
        if (!heartRate || !bloodOxygen) {
            return res.status(400).json({
                message: "heartRate aur bloodOxygen required hain"
            });
        }

        // ── temperature agar nahi aaya to default 37.0 lagao ───────────────
        const tempValue = temperature || 37.0;

        // ── Naya VitalReading record banao ──────────────────────────────────
        // req.user.id authMiddleware se aata hai (JWT token se)
        const newVital = new VitalReading({
            userId:           req.user.id,
            heartRate:        heartRate,
            bloodOxygen:      bloodOxygen,
            temperature:      tempValue,
            footsteps:        footsteps        || 0,
            restingHeartRate: restingHeartRate || null,
            bmi:              bmi              || null,
            accelerometer:    accelerometer    || { x: 0, y: 9.8, z: 0, intensity: 'Still' },
            // patientCondition frontend se aata hai (useWearData ka getPatientCondition)
            // Backend apni pre-save hook se condition, severity, alertLevel khud calculate karega
        });

        // Save — pre-save hook automatically sab calculate kar dega
        await newVital.save();

        console.log(`✅ Vital saved | User: ${req.user.id} | Condition: ${patientCondition} | HR: ${heartRate} | SpO2: ${bloodOxygen}`);

        res.status(201).json({
            message: "Vital reading saved successfully",
            data:    newVital,
        });

    } catch (error) {
        console.error('saveWearableVitals error:', error.message);
        res.status(500).json({ error: error.message });
    }
};