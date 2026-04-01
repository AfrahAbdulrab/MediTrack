// ============================================
// HYPERTENSION SERVICE
// All derived feature calculations + scoring
// ============================================

// --- BMI ---
function calcBMI(weight_kg, height_cm) {
  const height_m = height_cm / 100;
  return parseFloat((weight_kg / (height_m * height_m)).toFixed(2));
}

function getBMIScore(bmi) {
  if (bmi < 18.5) return 0.20;
  if (bmi <= 24.9) return 0.05;
  if (bmi <= 29.9) return 0.45;
  if (bmi <= 34.9) return 0.70;
  if (bmi <= 39.9) return 0.85;
  return 1.00;
}

// --- Blood Pressure ---
function getBPScore(systolic, diastolic) {
  if (systolic > 180 || diastolic > 120) return 1.00;
  if (systolic >= 140 || diastolic >= 90)  return 0.85;
  if (systolic >= 130 || diastolic >= 80)  return 0.60;
  if (systolic >= 120 && diastolic < 80)   return 0.30;
  return 0.00;
}

// --- Pulse Pressure ---
function calcPulsePressure(systolic, diastolic) {
  return systolic - diastolic;
}

function getPPScore(pp) {
  if (pp < 30)  return 0.30;
  if (pp <= 40) return 0.05;
  if (pp <= 50) return 0.35;
  if (pp <= 99) return 0.65;
  return 1.00;
}

// --- MAP ---
function calcMAP(diastolic, pp) {
  return parseFloat((diastolic + pp / 3).toFixed(2));
}

function getMAPScore(map) {
  if (map < 60)   return 0.30;
  if (map <= 100) return 0.05;
  if (map <= 120) return 0.55;
  return 0.90;
}

// --- HRR Proxy ---
function calcHRRProxy(rhr, age) {
  return parseFloat((rhr / (220 - age)).toFixed(4));
}

function getHRRScore(hrr_percent) {
  if (hrr_percent < 40) return 0.10;
  if (hrr_percent < 60) return 0.35;
  if (hrr_percent < 85) return 0.65;
  return 0.90;
}

// --- Steps ---
function calcSteps7DayAvg(steps_array) {
  const total = steps_array.reduce((a, b) => a + b, 0);
  return parseFloat((total / 7).toFixed(2));
}

function calcStepsScore(avg) {
  return parseFloat((1 - avg / 10000).toFixed(4));
}

// --- Age Score ---
function getAgeScore(age) {
  if (age < 35)  return 0.05;
  if (age < 45)  return 0.15;
  if (age < 55)  return 0.30;
  if (age < 65)  return 0.55;
  return 0.85;
}

// --- Gender Adjustment ---
function getGenderAdj(gender) {
  return gender === 'Male' ? 0.05 : 0.00;
}

// --- Final Risk Score ---
function calcRiskScore({ bp_score, age_score, bmi_score, map_score, hrr_score, pp_score, steps_score, gender_adj }) {
  const score =
    0.35 * bp_score +
    0.20 * age_score +
    0.15 * bmi_score +
    0.10 * map_score +
    0.08 * hrr_score +
    0.07 * pp_score +
    0.03 * steps_score +
    0.02 * gender_adj;
  return parseFloat(score.toFixed(4));
}

// --- Severity Classification ---
function getSeverity(risk_score) {
  if (risk_score <= 0.30) return 'Normal';
  if (risk_score <= 0.55) return 'Mild';
  if (risk_score <= 0.75) return 'Moderate';
  return 'Severe';
}

// ============================================
// MAIN FUNCTION - call this with raw vitals
// ============================================
function processHypertension(data) {
  const { age, gender, weight_kg, height_cm, systolic_bp, diastolic_bp, resting_hr, steps_7days } = data;

  // Derived Features
  const bmi           = calcBMI(weight_kg, height_cm);
  const bmi_score     = getBMIScore(bmi);
  const bp_score      = getBPScore(systolic_bp, diastolic_bp);
  const pulse_pressure = calcPulsePressure(systolic_bp, diastolic_bp);
  const pp_score      = getPPScore(pulse_pressure);
  const map_mmhg      = calcMAP(diastolic_bp, pulse_pressure);
  const map_score     = getMAPScore(map_mmhg);
  const hrr_proxy     = calcHRRProxy(resting_hr, age);
  const hrr_percent   = parseFloat((hrr_proxy * 100).toFixed(2));
  const hrr_score     = getHRRScore(hrr_percent);
  const steps_7day_avg = calcSteps7DayAvg(steps_7days);
  const steps_score   = calcStepsScore(steps_7day_avg);
  const age_score     = getAgeScore(age);
  const gender_adj    = getGenderAdj(gender);

  // Risk Score
  const risk_score = calcRiskScore({ bp_score, age_score, bmi_score, map_score, hrr_score, pp_score, steps_score, gender_adj });
  const severity   = getSeverity(risk_score);

  return {
    bmi, bmi_score,
    bp_score,
    pulse_pressure, pp_score,
    map_mmhg, map_score,
    hrr_proxy, hrr_score,
    steps_7day_avg, steps_score,
    age_score, gender_adj,
    risk_score, severity
  };
}

module.exports = { processHypertension };