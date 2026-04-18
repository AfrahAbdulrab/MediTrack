import { readRecords, initialize } from 'react-native-health-connect';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../constants/constants';

export const syncHealthData = async (userProfile, diseaseType) => {
  try {
    const token = await AsyncStorage.getItem('userToken');
    if (!token) throw new Error('User logged in nahi hai');

    // ✅ Health Connect Initialize
    const initialized = await initialize();
    if (!initialized) {
      console.warn('Health Connect initialize nahi hua');
      return;
    }

    const timeRangeFilter = {
      operator: 'between',
      startTime: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      endTime: new Date().toISOString(),
    };

    // ── Default values ────────────────────────────────────
    let latestHR     = 72;
    let systolic     = 120;
    let diastolic    = 80;
    let latestSpo2   = 95;
    let spo2Drop     = 2;
    let restingHR    = 65;
    let stepsArray   = [0, 0, 0, 0, 0, 0, 0];

    // ── Heart Rate ────────────────────────────────────────
    try {
      const hrData = await readRecords('HeartRate', { timeRangeFilter });
      if (hrData.records.length > 0) {
        const latest = hrData.records[hrData.records.length - 1];
        latestHR = latest.samples?.[0]?.beatsPerMinute ?? latest.beatsPerMinute ?? 72;

        let minHR = Infinity;
        hrData.records.forEach(r => {
          const bpm = r.samples?.[0]?.beatsPerMinute ?? r.beatsPerMinute ?? null;
          if (bpm && bpm > 40 && bpm < minHR) minHR = bpm;
        });
        if (minHR !== Infinity) restingHR = minHR;
      }
    } catch (e) { console.warn('HR skip:', e.message); }

    // ── Blood Pressure ────────────────────────────────────
    try {
      const bpData = await readRecords('BloodPressure', { timeRangeFilter });
      if (bpData.records.length > 0) {
        const latest = bpData.records[bpData.records.length - 1];
        systolic  = latest.systolic?.inMillimetersOfMercury  ?? latest.systolic?.value  ?? 120;
        diastolic = latest.diastolic?.inMillimetersOfMercury ?? latest.diastolic?.value ?? 80;
      }
    } catch (e) { console.warn('BP skip:', e.message); }

    // ── SpO2 ──────────────────────────────────────────────
    try {
      const spo2Data = await readRecords('OxygenSaturation', { timeRangeFilter });
      if (spo2Data.records.length > 0) {
        const latest = spo2Data.records[spo2Data.records.length - 1];
        const value  = latest.percentage ?? latest.value ?? 95;
        latestSpo2   = value <= 1 ? Math.round(value * 100) : Math.round(value);

        if (spo2Data.records.length > 1) {
          const prev    = spo2Data.records[spo2Data.records.length - 2];
          const prevVal = prev.percentage ?? prev.value ?? latestSpo2;
          const prevSpo2 = prevVal <= 1 ? prevVal * 100 : prevVal;
          spo2Drop = Math.max(0, parseFloat((prevSpo2 - latestSpo2).toFixed(1)));
        }
      }
    } catch (e) { console.warn('SpO2 skip:', e.message); }

    // ── Steps (7 days) ────────────────────────────────────
    try {
      const dailySteps = [];
      for (let i = 6; i >= 0; i--) {
        const dayStart = new Date();
        dayStart.setDate(dayStart.getDate() - i);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(dayStart);
        dayEnd.setHours(23, 59, 59, 999);

        try {
          const daySteps = await readRecords('Steps', {
            timeRangeFilter: {
              operator: 'between',
              startTime: dayStart.toISOString(),
              endTime: dayEnd.toISOString(),
            },
          });
          const total = daySteps.records.reduce((sum, r) => sum + (r.count || 0), 0);
          dailySteps.push(total);
        } catch {
          dailySteps.push(0);
        }
      }
      stepsArray = dailySteps;
    } catch (e) { console.warn('Steps skip:', e.message); }

    // ── Profile se height/weight ──────────────────────────
    const heightFt  = parseFloat(userProfile.height) || 5.6;
    const heightCm  = heightFt * 30.48;
    const weightKg  = parseFloat(userProfile.weight) || 70;
    const heightM   = heightCm / 100;
    const bmi       = parseFloat((weightKg / (heightM * heightM)).toFixed(1));
    const age       = parseInt(userProfile.age) || 30;
    const gender    = userProfile.gender || 'Male';

    // ── Payload aur endpoint ──────────────────────────────
    let endpoint = '';
    let payload  = {};

    if (diseaseType === 'Hypertension') {
      endpoint = '/api/vitals/hypertension';
      payload  = {
        age,
        gender,
        weight_kg:    weightKg,
        height_cm:    heightCm,
        systolic_bp:  systolic,
        diastolic_bp: diastolic,
        resting_hr:   restingHR,
        steps_7days:  stepsArray,
      };

    } else if (diseaseType === 'SleepApnea') {
      endpoint = '/api/vitals/sleep-apnea';
      payload  = {
        age,
        gender,
        spo2:                 latestSpo2,
        spo2_drop:            spo2Drop,
        heart_rate:           latestHR,
        hr_spike:             latestHR > 100,
        accel:                0.02,
        sleep_duration_hours: 7,
        time_in_bed_hours:    8,
      };

    } else if (diseaseType === 'TachyBrady') {
      endpoint = '/api/vitals/tachy-brady';
      payload  = {
        age,
        gender,
        heart_rate:   latestHR,
        systolic_bp:  systolic,
        diastolic_bp: diastolic,
        spo2:         latestSpo2,
      };
    }

    const response = await axios.post(
      `${API_BASE_URL}${endpoint}`,
      payload,
      {
        timeout: 15000,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      }
    );

    console.log(`✅ ${diseaseType} synced | ML: ${response.data?.ml_result?.severity || 'N/A'}`);
    return response.data;

  } catch (error) {
    console.error(`❌ ${diseaseType} sync error:`, error.message);
    throw error;
  }
};