// ============================================================
//  Backend/services/mlService.js
//  Python ML server se baat karne ka kaam yeh karti hai
// ============================================================

const axios = require("axios");

const ML_SERVER = process.env.ML_SERVER_URL || "http://localhost:8000";

// ══════════════════════════════════════════════════════════
// DERIVED FEATURES — FORMULAS
// Watch se raw data aata hai, yahan calculate hote hain
// ══════════════════════════════════════════════════════════

function calcSleepFeatures(raw) {
  const {
    age, gender, spO2, hr, accel,
    spO2Baseline, hrVariability,
    sleepHours, eventsL1, eventsL2,
  } = raw;

  const spO2Drop = spO2Baseline - spO2;

  // HR Pattern
  let hrPattern;
  if (hrVariability < 9)        hrPattern = "steady";
  else if (hrVariability <= 18) hrPattern = "fluctuating";
  else                          hrPattern = "spike";

  // Accel Type
  let accelType;
  if (accel < 0.02)       accelType = "still";
  else if (accel <= 0.10) accelType = "restless";
  else                    accelType = "jerk";

  // SpO2 Score
  let spO2Score;
  if (spO2 >= 95 && spO2Drop < 2)                              spO2Score = 0;
  else if ((spO2 >= 90 && spO2 <= 94) || (spO2Drop >= 2 && spO2Drop <= 3)) spO2Score = 1;
  else                                                           spO2Score = 2;

  // HR Score
  let hrScore;
  if      (hr >= 50 && hr <= 70 && hrPattern === "steady")           hrScore = 0;
  else if (hr >= 71 && hr <= 85 && hrPattern === "fluctuating")      hrScore = 1;
  else                                                                hrScore = 2;

  // Accel Score
  let accelScore;
  if      (accel < 0.02)  accelScore = 0;
  else if (accel <= 0.10) accelScore = 1;
  else                    accelScore = 2;

  // Age/Gender Score + Risk Multiplier + AHI Threshold
  let ageGenderScore, riskMultiplier, ahiThreshold;
  const g = gender.toLowerCase();

  if      (g === "female" && age >= 18 && age <= 35) { ageGenderScore = 0; riskMultiplier = 1.0; ahiThreshold = 5.0; }
  else if (g === "female" && age >= 36 && age <= 50) { ageGenderScore = 1; riskMultiplier = 1.3; ahiThreshold = 4.0; }
  else if (g === "male"   && age >= 18 && age <= 39) { ageGenderScore = 1; riskMultiplier = 1.3; ahiThreshold = 4.0; }
  else if (g === "female" && age > 50)               { ageGenderScore = 2; riskMultiplier = 1.6; ahiThreshold = 3.0; }
  else                                               { ageGenderScore = 2; riskMultiplier = 1.6; ahiThreshold = 3.0; }

  const physioScore  = (spO2Score * 3) + (hrScore * 2) + (accelScore * 1);
  const eventScore   = physioScore * riskMultiplier;
  const totalEvents  = (eventsL1 || 0) + (eventsL2 || 0);
  const ahiScore     = ((eventsL1 || 0) + (eventsL2 || 0) * 1.5) / sleepHours;

  return {
    Age: age, Gender: gender, Sleep_Hours: sleepHours,
    SpO2: spO2, HR: hr, Accel: accel,
    SpO2_Baseline: spO2Baseline, SpO2_Drop: spO2Drop,
    HR_Variability: hrVariability, HR_Pattern: hrPattern,
    Accel_Type: accelType, SpO2_Score: spO2Score,
    HR_Score: hrScore, Accel_Score: accelScore,
    Age_Gender_Score: ageGenderScore, Risk_Multiplier: riskMultiplier,
    Physio_Score: physioScore, Event_Score: eventScore,
    Events_L1: eventsL1 || 0, Events_L2: eventsL2 || 0,
    Total_Events: totalEvents, AHI_Score: ahiScore,
    AHI_Threshold: ahiThreshold,
  };
}

function calcHeartFeatures(raw) {
  const {
    age, gender, hr, spO2, bodyTemp,
    systolicBP, diastolicBP, bloodSugar,
    respiratoryRate, condition, riskScore,
  } = raw;

  const pulsePressure = systolicBP - diastolicBP;
  const map           = parseFloat((diastolicBP + pulsePressure / 3).toFixed(2));
  const maxHR         = 220 - age;
  const hrr           = maxHR - hr;
  const shockIndex    = parseFloat((hr / systolicBP).toFixed(4));
  const rpp           = hr * systolicBP;
  const spO2Deficit   = parseFloat((100 - spO2).toFixed(2));

  // Condition decide karo agar provide nahi
  let cond = condition;
  if (!cond) {
    if      (hr > 100) cond = "Tachycardia";
    else if (hr < 60)  cond = "Bradycardia";
    else               cond = "Normal";
  }

  const rs = riskScore ??
    parseFloat(((shockIndex * 0.3) + (spO2Deficit * 0.01) + (pulsePressure / 200)).toFixed(4));

  return {
    Age: age, Gender: gender, HR: hr, SpO2: spO2,
    Body_Temp: bodyTemp, Systolic_BP: systolicBP,
    Diastolic_BP: diastolicBP, Blood_Sugar: bloodSugar,
    Respiratory_Rate: respiratoryRate, Pulse_Pressure: pulsePressure,
    MAP: map, Max_HR: maxHR, HRR: hrr,
    Shock_Index: shockIndex, RPP: rpp,
    SpO2_Deficit: spO2Deficit, Condition: cond, Risk_Score: rs,
  };
}

function calcHyperFeatures(raw) {
  const {
    age, gender, heightCm, weightKg, restingHR,
    stepsPerDay, systolicBP, diastolicBP,
    hypertensionRiskScore,
  } = raw;

  const heightM       = heightCm / 100;
  const bmi           = parseFloat((weightKg / (heightM * heightM)).toFixed(2));
  const steps         = stepsPerDay || [0, 0, 0, 0, 0, 0, 0];
  const avg7          = parseFloat((steps.reduce((a, b) => a + b, 0) / 7).toFixed(1));
  const stepsScore    = parseFloat(Math.min(avg7 / 10000, 1.0).toFixed(4));
  const pulsePressure = systolicBP - diastolicBP;
  const map           = parseFloat((diastolicBP + pulsePressure / 3).toFixed(2));
  const maxHR         = 220 - age;
  const hrrProxy      = parseFloat((restingHR / maxHR).toFixed(4));
  const riskScore     = hypertensionRiskScore ??
    parseFloat(((systolicBP / 200) * 0.5 + (diastolicBP / 120) * 0.3 + (bmi / 40) * 0.2).toFixed(4));

  return {
    Age: age, Gender: gender, Height_cm: heightCm, Weight_kg: weightKg,
    BMI: bmi, Resting_HR: restingHR,
    Steps_Day1: steps[0], Steps_Day2: steps[1], Steps_Day3: steps[2],
    Steps_Day4: steps[3], Steps_Day5: steps[4], Steps_Day6: steps[5],
    Steps_Day7: steps[6], Steps_7day_avg: avg7, Steps_Score: stepsScore,
    Systolic_BP: systolicBP, Diastolic_BP: diastolicBP,
    Pulse_Pressure: pulsePressure, MAP: map,
    HRR_Proxy: hrrProxy, Hypertension_Risk_Score: riskScore,
  };
}

// ══════════════════════════════════════════════════════════
// ML SERVER CALLS
// ══════════════════════════════════════════════════════════

async function callML(endpoint, body) {
  const response = await axios.post(`${ML_SERVER}${endpoint}`, body, {
    timeout: 10000,
  });
  return response.data;
}

// ── Export functions ──────────────────────────────────────

async function predictSleepApnea(rawData) {
  const features = calcSleepFeatures(rawData);
  return await callML("/predict/sleep-apnea", features);
}

async function predictHeart(rawData) {
  const features = calcHeartFeatures(rawData);
  return await callML("/predict/heart", features);
}

async function predictHypertension(rawData) {
  const features = calcHyperFeatures(rawData);
  return await callML("/predict/hypertension", features);
}

async function predictAll(sleepData, heartData, hyperData) {
  // Teeno parallel chalao — faster
  const [sleepResult, heartResult, hyperResult] = await Promise.all([
    callML("/predict/sleep-apnea", calcSleepFeatures(sleepData)),
    callML("/predict/heart",       calcHeartFeatures(heartData)),
    callML("/predict/hypertension", calcHyperFeatures(hyperData)),
  ]);

  return {
    sleep_apnea : sleepResult,
    heart       : heartResult,
    hypertension: hyperResult,
  };
}

module.exports = {
  predictSleepApnea,
  predictHeart,
  predictHypertension,
  predictAll,
};