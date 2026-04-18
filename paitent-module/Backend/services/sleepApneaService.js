// ============================================
// SLEEP APNEA SERVICE
// All derived feature calculations + scoring
// ============================================

// --- SpO2 Score ---
function getSpO2Score(spo2, spo2_drop) {
  // Score based on SpO2 level
  let level_score = 0;
  if (spo2 < 85)       level_score = 2;
  else if (spo2 <= 90) level_score = 1;

  // Score based on drop
  let drop_score = 0;
  if (spo2_drop >= 4)  drop_score = 2;
  else if (spo2_drop >= 3) drop_score = 1;

  return Math.min(2, Math.max(level_score, drop_score));
}

// --- HR Score ---
function getHRScore(heart_rate, hr_spike) {
  if (heart_rate > 100 || hr_spike) return 2;
  if (heart_rate > 85)              return 1;
  return 0;
}

// --- Accelerometer Score ---
function getAccelScore(accel) {
  if (accel > 0.1)      return 2; // Very restless
  if (accel >= 0.03)    return 1; // Slightly restless
  return 0;                        // Still / normal
}

// --- Age/Gender Score & Risk Multiplier ---
function getAgeGenderScore(age, gender) {
  if (gender === 'Female') {
    if (age <= 35) return { age_gender_score: 0, risk_multiplier: 1.0 };
    if (age <= 50) return { age_gender_score: 1, risk_multiplier: 1.3 };
    return           { age_gender_score: 2, risk_multiplier: 1.6 };
  } else { // Male
    if (age <= 39) return { age_gender_score: 1, risk_multiplier: 1.3 };
    return           { age_gender_score: 2, risk_multiplier: 1.6 };
  }
}

// --- AHI Threshold (personalized) ---
function getAHIThreshold(age, gender) {
  if (gender === 'Female') {
    if (age <= 35) return 5.0;
    if (age <= 50) return 4.0;
    return 3.0;
  } else { // Male
    if (age <= 39) return 4.0;
    return 3.0;
  }
}

// --- AHI Severity ---
function getAHISeverity(ahi, threshold) {
  if (ahi < threshold) return 'Normal';
  if (ahi < 15)        return 'Mild';
  if (ahi < 30)        return 'Moderate';
  return 'Severe';
}

// --- Event Label from event_score ---
function getEventLabel(event_score) {
  if (event_score < 5)  return 0; // No event
  if (event_score <= 10) return 1; // Moderate event
  return 2;                         // Severe event
}

// ============================================
// MAIN FUNCTION - call this with raw vitals
// ============================================
function processSleepApnea(data) {
  const { age, gender, spo2, spo2_drop, heart_rate, hr_spike, accel, ahi } = data;

  // Scores
  const spo2_score  = getSpO2Score(spo2, spo2_drop);
  const hr_score    = getHRScore(heart_rate, hr_spike);
  const accel_score = getAccelScore(accel);

  // Age/Gender
  const { age_gender_score, risk_multiplier } = getAgeGenderScore(age, gender);

  // Physio Score
  const physio_score = (spo2_score * 3) + (hr_score * 2) + (accel_score * 1) + age_gender_score;

  // Event Score
  const event_score = parseFloat((physio_score * risk_multiplier).toFixed(2));
  const event_label = getEventLabel(event_score);

  // AHI-based Severity
  const ahi_threshold = getAHIThreshold(age, gender);
  const severity = ahi !== undefined ? getAHISeverity(ahi, ahi_threshold) : (
    event_label === 0 ? 'Normal' :
    event_label === 1 ? 'Moderate' : 'Severe'
  );

  return {
    spo2_score, hr_score, accel_score,
    age_gender_score, risk_multiplier,
    physio_score, event_score, event_label,
    ahi_threshold, severity
  };
}

module.exports = { processSleepApnea };