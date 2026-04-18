// ============================================
// TACHYCARDIA / BRADYCARDIA SERVICE
// All derived feature calculations + scoring
// ============================================

// --- HR Condition ---
function getHRCondition(hr) {
  if (hr >= 60 && hr <= 100) return 'Normal';
  if (hr > 100)              return 'Tachycardia';
  return 'Bradycardia';
}

// --- Derived Features ---
function calcPulsePressure(systolic, diastolic) {
  return parseFloat((systolic - diastolic).toFixed(2));
}

function calcMAP(diastolic, pulse_pressure) {
  return parseFloat((diastolic + pulse_pressure / 3).toFixed(2));
}

function calcMaxHR(age) {
  return 220 - age;
}

function calcHRR(max_hr, hr) {
  return max_hr - hr;
}

function calcShockIndex(hr, systolic) {
  return parseFloat((hr / systolic).toFixed(4));
}

function calcRPP(hr, systolic) {
  return hr * systolic;
}

function calcSpO2Deficit(spo2) {
  return parseFloat((100 - spo2).toFixed(2));
}

// --- Risk Score (from derived features) ---
// Normalized scoring for each feature
function calcRiskScore({ hr_condition, shock_index, spo2_deficit, map_mmhg, pulse_pressure, rpp }) {
  let score = 0;

  // HR condition component (0.40 weight)
  if (hr_condition === 'Tachycardia') score += 0.40;
  else if (hr_condition === 'Bradycardia') score += 0.35;
  // Normal = 0

  // Shock Index (normal < 0.7, concerning > 1.0)
  if (shock_index > 1.0)       score += 0.20;
  else if (shock_index >= 0.7) score += 0.10;

  // SpO2 Deficit
  if (spo2_deficit > 10)      score += 0.15;
  else if (spo2_deficit >= 5) score += 0.08;
  else if (spo2_deficit >= 3) score += 0.04;

  // MAP
  if (map_mmhg < 60)        score += 0.10;
  else if (map_mmhg > 120)  score += 0.10;

  // Pulse Pressure
  if (pulse_pressure >= 100) score += 0.10;
  else if (pulse_pressure >= 50) score += 0.05;

  // RPP (Rate Pressure Product — > 20000 is high)
  if (rpp > 20000)       score += 0.05;
  else if (rpp > 12000)  score += 0.02;

  return parseFloat(Math.min(score, 1.00).toFixed(4));
}

// --- Severity Classification ---
function getSeverity(risk_score, hr_condition) {
  if (hr_condition === 'Normal') return 'Normal';
  if (risk_score < 0.15)        return 'Mild';
  if (risk_score < 0.45)        return 'Moderate';
  return 'Severe';
}

// ============================================
// MAIN FUNCTION - call this with raw vitals
// ============================================
function processTachyBrady(data) {
  const { age, heart_rate, systolic_bp, diastolic_bp, spo2 } = data;

  // HR Condition
  const hr_condition   = getHRCondition(heart_rate);

  // Derived Features
  const pulse_pressure = calcPulsePressure(systolic_bp, diastolic_bp);
  const map_mmhg       = calcMAP(diastolic_bp, pulse_pressure);
  const max_hr         = calcMaxHR(age);
  const hrr            = calcHRR(max_hr, heart_rate);
  const shock_index    = calcShockIndex(heart_rate, systolic_bp);
  const rpp            = calcRPP(heart_rate, systolic_bp);
  const spo2_deficit   = calcSpO2Deficit(spo2);

  // Risk Score
  const risk_score = calcRiskScore({ hr_condition, shock_index, spo2_deficit, map_mmhg, pulse_pressure, rpp });
  const severity   = getSeverity(risk_score, hr_condition);

  return {
    hr_condition,
    pulse_pressure, map_mmhg,
    max_hr, hrr,
    shock_index, rpp, spo2_deficit,
    risk_score, severity
  };
}

module.exports = { processTachyBrady };