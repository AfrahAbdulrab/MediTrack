import { readRecords } from 'react-native-health-connect';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../constants/constants';  // ✅ constants use

export const syncHealthData = async (userProfile, diseaseType) => {
  try {
    const token = await AsyncStorage.getItem('userToken');
    if (!token) throw new Error('User logged in nahi hai');

   
    const timeRangeFilter = {
      operator: 'between',
      startTime: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      endTime: new Date().toISOString(),
    };

    // Data fetch
    let latestHR = 72;
    let systolic = 120;
    let diastolic = 80;
    let latestSpo2 = 95;       // ✅ spo2
    let spo2Drop = 2;           // ✅ spo2 drop
    let stepsArray = [0, 0, 0, 0, 0, 0, 0];

    try {
      const hrData = await readRecords('HeartRate', { timeRangeFilter });
      if (hrData.records.length > 0) {
        latestHR = hrData.records[hrData.records.length - 1].samples[0].beatsPerMinute;
      }
    } catch (e) { console.warn('HR skip:', e.message); }

    try {
      const bpData = await readRecords('BloodPressure', { timeRangeFilter });
      if (bpData.records.length > 0) {
        const latest = bpData.records[bpData.records.length - 1];
        systolic = latest.systolic.value;
        diastolic = latest.diastolic.value;
      }
    } catch (e) { console.warn('BP skip:', e.message); }

    // ✅ SpO2 fetch
    try {
      const spo2Data = await readRecords('OxygenSaturation', { timeRangeFilter });
      if (spo2Data.records.length > 0) {
        const latest = spo2Data.records[spo2Data.records.length - 1];
        const value = latest.percentage ?? latest.value ?? 95;
        latestSpo2 = value <= 1 ? value * 100 : value;

        // spo2 drop calculate karo
        if (spo2Data.records.length > 1) {
          const prev = spo2Data.records[spo2Data.records.length - 2];
          const prevVal = prev.percentage ?? prev.value ?? latestSpo2;
          const prevSpo2 = prevVal <= 1 ? prevVal * 100 : prevVal;
          spo2Drop = Math.max(0, parseFloat((prevSpo2 - latestSpo2).toFixed(1)));
        }
      }
    } catch (e) { console.warn('SpO2 skip:', e.message); }

    try {
      const stepsData = await readRecords('Steps', { timeRangeFilter });
      if (stepsData.records.length > 0) {
        stepsArray = stepsData.records.map(r => r.count);
        while (stepsArray.length < 7) stepsArray.unshift(0);
        stepsArray = stepsArray.slice(-7);
      }
    } catch (e) { console.warn('Steps skip:', e.message); }

    // Payloads
    let endpoint = '';
    let payload = {};

    if (diseaseType === 'Hypertension') {
      endpoint = '/api/vitals/hypertension';
      payload = {
        age:          userProfile.age,
        gender:       userProfile.gender,
        weight_kg:    userProfile.weight,
        height_cm:    userProfile.height,
        systolic_bp:  systolic,
        diastolic_bp: diastolic,
        resting_hr:   latestHR,
        steps_7days:  stepsArray,
      };

    } else if (diseaseType === 'SleepApnea') {
      endpoint = '/api/vitals/sleep-apnea';
      payload = {
        age:        userProfile.age,
        gender:     userProfile.gender,
        spo2:       latestSpo2,    // ✅ real spo2
        spo2_drop:  spo2Drop,      // ✅ real drop
        heart_rate: latestHR,
        hr_spike:   latestHR > 100,  // ✅ auto detect
        accel:      0.02,
      };

    } else if (diseaseType === 'TachyBrady') {
      endpoint = '/api/vitals/tachy-brady';
      payload = {
        age:          userProfile.age,
        gender:       userProfile.gender,
        heart_rate:   latestHR,
        systolic_bp:  systolic,
        diastolic_bp: diastolic,
        spo2:         latestSpo2,  // ✅ real spo2
      };
    }

    const response = await axios.post(
      `${API_BASE_URL}${endpoint}`,  // ✅ constants use
      payload,
      {
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      }
    );

    console.log(`✅ ${diseaseType} data saved:`, response.data);
    return response.data;

  } catch (error) {
    console.error('Sync error:', error.message);
    throw error;
  }
};