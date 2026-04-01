const Hypertension = require('../models/Hypertension');
const HeartCondition = require('../models/HeartCondition');

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