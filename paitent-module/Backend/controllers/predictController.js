// ============================================================
//  Backend/controllers/predictController.js
// ============================================================

const mlService = require("../services/mlService");

// ── POST /api/predict/sleep-apnea ────────────────────────
const sleepApnea = async (req, res) => {
  try {
    const result = await mlService.predictSleepApnea(req.body);
    res.json({ success: true, result });
  } catch (error) {
    console.error("sleepApnea controller error:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ── POST /api/predict/heart ───────────────────────────────
const heart = async (req, res) => {
  try {
    const result = await mlService.predictHeart(req.body);
    res.json({ success: true, result });
  } catch (error) {
    console.error("heart controller error:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ── POST /api/predict/hypertension ───────────────────────
const hypertension = async (req, res) => {
  try {
    const result = await mlService.predictHypertension(req.body);
    res.json({ success: true, result });
  } catch (error) {
    console.error("hypertension controller error:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ── POST /api/predict/all — teeno ek saath ───────────────
const all = async (req, res) => {
  try {
    const { sleepData, heartData, hyperData } = req.body;

    if (!sleepData || !heartData || !hyperData) {
      return res.status(400).json({
        success: false,
        error: "sleepData, heartData, hyperData teeno chahiye",
      });
    }

    const result = await mlService.predictAll(sleepData, heartData, hyperData);
    res.json({ success: true, ...result });
  } catch (error) {
    console.error("predictAll controller error:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = { sleepApnea, heart, hypertension, all };