import { useState, useEffect, useRef } from 'react';
import { Linking } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  initialize,
  readRecords,
  getSdkStatus,
  SdkAvailabilityStatus,
} from 'react-native-health-connect';
import { API_BASE_URL } from '../app/constants/constants';

// ✅ Patient ki condition check karne ka function
export const getPatientCondition = (heartRate, spo2) => {
  if (!heartRate && !spo2) return 'normal';

  const hr = heartRate || 75;
  const sp = spo2 || 98;

  if (hr > 150 || hr < 40 || sp < 90) return 'critical';
  if (hr > 120 || hr < 50 || sp < 94) return 'abnormal';
  return 'normal';
};

// ✅ Condition ke hisaab se interval (milliseconds)
export const getIntervalByCondition = (condition) => {
  switch (condition) {
    case 'critical': return 5 * 60 * 1000;
    case 'abnormal': return 15 * 60 * 1000;
    default:         return 60 * 60 * 1000;
  }
};

export const useWearData = () => {
  const [heartRate, setHeartRate] = useState(null);
  const [lastHeartRateTime, setLastHeartRateTime] = useState(null);
  const [spo2, setSpo2] = useState(null);
  const [steps, setSteps] = useState(null);
  const [restingHeartRate, setRestingHeartRate] = useState(null);
  const [bmi, setBmi] = useState(null);
  const [accelerometer, setAccelerometer] = useState({
    x: 0, y: 9.8, z: 0, intensity: 'Still',
  });
  const [lastSyncedTime, setLastSyncedTime] = useState(null);
  // ✅ NEW
  const [patientCondition, setPatientCondition] = useState('normal');

  // ✅ refs for dynamic interval
  const intervalRef = useRef(null);
  const heartRateRef = useRef(null);
  const spo2Ref = useRef(null);

  // ✅ NEW: Backend pe data save karne ka function
  // Ye function har interval ke baad fetchData ke andar call hoga
  const saveToBackend = async ({
    heartRate,
    bloodOxygen,
    temperature,
    footsteps,
    restingHeartRate,
    bmi,
    accelerometer,
    patientCondition,
  }) => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        console.log('⚠️ Token nahi mila, backend save skip');
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/vitals/record`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          heartRate,
          bloodOxygen,
          temperature:      temperature      || 37.0,
          footsteps:        footsteps        || 0,
          restingHeartRate: restingHeartRate || null,
          bmi:              bmi              || null,
          accelerometer:    accelerometer    || { x: 0, y: 9.8, z: 0, intensity: 'Still' },
          patientCondition: patientCondition || 'normal',
        }),
      });

      const data = await response.json();

      if (response.ok) {
        console.log(`✅ Backend save success | Condition: ${patientCondition} | HR: ${heartRate} | SpO2: ${bloodOxygen}`);
      } else {
        console.log('⚠️ Backend save failed:', data.message);
      }
    } catch (e) {
      console.log('❌ saveToBackend error:', e.message);
    }
  };

  // ✅ Adaptive interval setup
  const setupAdaptiveInterval = (hr, sp) => {
    const condition = getPatientCondition(hr, sp);
    const interval = getIntervalByCondition(condition);
    setPatientCondition(condition);
    if (intervalRef.current) clearInterval(intervalRef.current);
    console.log(`🔄 Condition: ${condition} | Next fetch: ${interval / 60000} min`);
    intervalRef.current = setInterval(() => {
      fetchData();
    }, interval);
  };

  useEffect(() => {
    const timer = setTimeout(() => { initializeAndFetch(); }, 1000);
    return () => {
      clearTimeout(timer);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const updateLastSynced = (recordTime) => {
    if (!recordTime) return;
    const newTime = new Date(recordTime);
    if (isNaN(newTime.getTime())) return;
    setLastSyncedTime(prev => {
      if (!prev || newTime > new Date(prev)) {
        return newTime;
      }
      return prev;
    });
  };

  const loadBMIFromProfile = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) return;
      const response = await fetch(`${API_BASE_URL}/api/auth/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data?.height && data?.weight) {
        const heightStr = data.height.toString();
        const parts = heightStr.split('.');
        const feet = parseInt(parts[0]) || 0;
        const inches = parseInt(parts[1]) || 0;
        const totalInches = feet * 12 + inches;
        const heightMeters = totalInches * 0.0254;
        const weightKg = parseFloat(data.weight);
        if (heightMeters > 0 && weightKg > 0) {
          const bmiValue = weightKg / (heightMeters * heightMeters);
          setBmi(parseFloat(bmiValue.toFixed(1)));
        }
      } else if (data?.bmi) {
        setBmi(parseFloat(data.bmi));
      }
    } catch (e) {
      console.log('BMI load error:', e.message);
    }
  };

  const initializeAndFetch = async () => {
    try {
      await loadBMIFromProfile();
      const status = await getSdkStatus();
      if (status !== SdkAvailabilityStatus.SDK_AVAILABLE) return;
      const isInitialized = await initialize();
      if (!isInitialized) return;
      await fetchHeightWeight();
      await fetchData();
    } catch (error) {
      console.log('Init Error:', error.message);
    }
  };

  const askPermissions = async () => {
    try {
      await Linking.openURL('package:com.google.android.apps.healthdata');
    } catch (e) {
      try {
        await Linking.openURL('https://play.google.com/store/apps/details?id=com.google.android.apps.healthdata');
      } catch (err) {
        console.log('Linking error:', err.message);
      }
    }
  };

  const getAccelFromRate = (stepsPerMinute) => {
    if (stepsPerMinute < 1) return { x: 0.0, y: 9.8, z: 0.0, intensity: 'Still' };
    if (stepsPerMinute < 40) return {
      x: parseFloat((stepsPerMinute * 0.04).toFixed(2)),
      y: parseFloat((9.8 - stepsPerMinute * 0.01).toFixed(2)),
      z: parseFloat((stepsPerMinute * 0.025).toFixed(2)),
      intensity: 'Light',
    };
    if (stepsPerMinute < 80) return {
      x: parseFloat((stepsPerMinute * 0.06).toFixed(2)),
      y: parseFloat((9.8 - stepsPerMinute * 0.02).toFixed(2)),
      z: parseFloat((stepsPerMinute * 0.04).toFixed(2)),
      intensity: 'Moderate',
    };
    return {
      x: parseFloat((stepsPerMinute * 0.09).toFixed(2)),
      y: parseFloat((9.8 - stepsPerMinute * 0.035).toFixed(2)),
      z: parseFloat((stepsPerMinute * 0.065).toFixed(2)),
      intensity: 'Active',
    };
  };

  const calculateAccelerometerFromSteps = (stepsRecords) => {
    try {
      if (!stepsRecords || stepsRecords.length === 0)
        return { x: 0.0, y: 9.8, z: 0.0, intensity: 'Still' };

      const now = new Date();
      const tenMinutesAgo = new Date(now.getTime() - 10 * 60 * 1000);
      const recentRecords = stepsRecords.filter((r) => {
        const recordTime = new Date(r.endTime || r.startTime);
        return recordTime >= tenMinutesAgo;
      });

      if (recentRecords.length > 0) {
        let recentSteps = 0;
        recentRecords.forEach((r) => (recentSteps += r.count || 0));
        return getAccelFromRate(recentSteps / 10);
      }

      const totalSteps = stepsRecords.reduce((sum, r) => sum + (r.count || 0), 0);
      const firstTime = new Date(stepsRecords[0].startTime || stepsRecords[0].endTime);
      const minutesElapsed = Math.max(1, (now - firstTime) / 1000 / 60);
      return getAccelFromRate(totalSteps / minutesElapsed);
    } catch (e) {
      return { x: 0.0, y: 9.8, z: 0.0, intensity: 'Still' };
    }
  };

  const fetchHeightWeight = async () => {
    try {
      const now = new Date();
      const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const endTime = now.toISOString();

      const heightData = await readRecords('Height', {
        timeRangeFilter: { operator: 'between', startTime: last30Days, endTime },
      });
      const weightData = await readRecords('Weight', {
        timeRangeFilter: { operator: 'between', startTime: last30Days, endTime },
      });

      if (heightData.records.length > 0 && weightData.records.length > 0) {
        const h = heightData.records[heightData.records.length - 1];
        const w = weightData.records[weightData.records.length - 1];
        const hm = h.height?.inMeters ?? h.value ?? null;
        const wk = w.weight?.inKilograms ?? w.value ?? null;
        if (hm && wk) setBmi(parseFloat((wk / (hm * hm)).toFixed(1)));

        const weightTime = new Date(w.endTime ?? w.startTime ?? w.time);
        updateLastSynced(weightTime);
      }
    } catch (e) {
      console.log('Height/Weight HC error:', e.message);
    }
  };

  const fetchData = async () => {
    try {
      const now = new Date();
      const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
      const endTime = now.toISOString();

      let latestHR = heartRateRef.current;
      let latestSpo2 = spo2Ref.current;
      let latestSteps = 0;
      let latestAccel = { x: 0, y: 9.8, z: 0, intensity: 'Still' };

      // ── Heart Rate ──────────────────────────────────────────────────────────
      try {
        const heartRateData = await readRecords('HeartRate', {
          timeRangeFilter: { operator: 'between', startTime: last24h, endTime },
        });

        if (heartRateData.records.length > 0) {
          const latest = heartRateData.records[heartRateData.records.length - 1];
          const bpm = latest.samples?.[0]?.beatsPerMinute ?? latest.beatsPerMinute ?? null;
          const recordTime = new Date(latest.endTime ?? latest.startTime ?? latest.time);
          if (bpm) {
            setHeartRate(bpm);
            setLastHeartRateTime(recordTime);
            updateLastSynced(recordTime);
            latestHR = bpm;
            heartRateRef.current = bpm;
            console.log('✅ HR:', bpm, '| Recorded at:', recordTime.toLocaleTimeString());
          }

          let minBPM = Infinity;
          heartRateData.records.forEach((record) => {
            const bpm = record.samples?.[0]?.beatsPerMinute ?? record.beatsPerMinute ?? null;
            if (bpm && bpm > 40 && bpm < minBPM) minBPM = bpm;
          });
          if (minBPM !== Infinity) setRestingHeartRate(minBPM);
        }
      } catch (e) { console.log('HR error:', e.message); }

      // ── SPO2 ────────────────────────────────────────────────────────────────
      try {
        const spo2Data = await readRecords('OxygenSaturation', {
          timeRangeFilter: { operator: 'between', startTime: last24h, endTime },
        });
        if (spo2Data.records.length > 0) {
          const latest = spo2Data.records[spo2Data.records.length - 1];
          const value = latest.percentage ?? latest.value ?? null;
          const spo2Time = new Date(latest.endTime ?? latest.startTime ?? latest.time);
          if (value !== null) {
            const spo2Val = value <= 1 ? Math.round(value * 100) : Math.round(value);
            setSpo2(spo2Val);
            updateLastSynced(spo2Time);
            latestSpo2 = spo2Val;
            spo2Ref.current = spo2Val;
          }
        }
      } catch (e) { console.log('SPO2 error:', e.message); }

      // ── Steps ───────────────────────────────────────────────────────────────
      try {
        const midnightToday = new Date();
        midnightToday.setHours(0, 0, 0, 0);
        const stepsData = await readRecords('Steps', {
          timeRangeFilter: {
            operator: 'between',
            startTime: midnightToday.toISOString(),
            endTime: now.toISOString(),
          },
        });
        if (stepsData.records.length > 0) {
          let totalSteps = 0;
          stepsData.records.forEach((r) => (totalSteps += r.count));
          setSteps(totalSteps);
          latestSteps = totalSteps; // ✅ NEW: backend ke liye store karo
          const accel = calculateAccelerometerFromSteps(stepsData.records);
          setAccelerometer(accel);
          latestAccel = accel; // ✅ NEW: backend ke liye store karo

          const lastStepRecord = stepsData.records[stepsData.records.length - 1];
          const stepTime = new Date(lastStepRecord.endTime ?? lastStepRecord.startTime);
          updateLastSynced(stepTime);
        }
      } catch (e) { console.log('Steps error:', e.message); }

      // ✅ NEW: Backend pe save karo — sirf tab jab HR ya SpO2 available ho
      if (latestHR || latestSpo2) {
        await saveToBackend({
          heartRate:        latestHR,
          bloodOxygen:      latestSpo2,
          temperature:      37.0,              // Health Connect se temperature nahi aata, default
          footsteps:        latestSteps,
          restingHeartRate: restingHeartRate,
          bmi:              bmi,
          accelerometer:    latestAccel,
          patientCondition: getPatientCondition(latestHR, latestSpo2),
        });
      }

      // ✅ Fetch ke baad adaptive interval update karo
      setupAdaptiveInterval(latestHR, latestSpo2);

    } catch (error) {
      console.log('Fetch Error:', error.message);
    }
  };

  return {
    heartRate,
    lastHeartRateTime,
    lastSyncedTime,
    spo2,
    steps,
    restingHeartRate,
    bmi,
    accelerometer,
    patientCondition,  // ✅
    askPermissions,
  };
};