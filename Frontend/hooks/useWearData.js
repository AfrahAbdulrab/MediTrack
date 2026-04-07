import { useState, useEffect } from 'react';
import { Linking } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  initialize,
  readRecords,
  getSdkStatus,
  SdkAvailabilityStatus,
} from 'react-native-health-connect';
import { API_BASE_URL } from '../app/constants/constants';

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

  useEffect(() => {
    // ✅ FIX 1: interval 10000 → 30000 (30 seconds)
    const timer = setTimeout(() => { initializeAndFetch(); }, 1000);
    const interval = setInterval(() => { fetchData(); }, 30000);
    return () => { clearTimeout(timer); clearInterval(interval); };
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
      // ✅ BMI sirf startup pe load hoti hai (profile + Health Connect dono)
      await loadBMIFromProfile();
      const status = await getSdkStatus();
      if (status !== SdkAvailabilityStatus.SDK_AVAILABLE) return;
      const isInitialized = await initialize();
      if (!isInitialized) return;

      // ✅ Startup pe ek baar Height/Weight bhi check karo
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

  // ✅ FIX 3: Height/Weight alag function mein — sirf startup pe call hoga
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

      // ── Heart Rate ──────────────────────────────────────────────────────────
      try {
        const heartRateData = await readRecords('HeartRate', {
          timeRangeFilter: { operator: 'between', startTime: last24h, endTime },
        });

        if (heartRateData.records.length > 0) {
          // Latest HR
          const latest = heartRateData.records[heartRateData.records.length - 1];
          const bpm = latest.samples?.[0]?.beatsPerMinute ?? latest.beatsPerMinute ?? null;
          const recordTime = new Date(latest.endTime ?? latest.startTime ?? latest.time);
          if (bpm) {
            setHeartRate(bpm);
            setLastHeartRateTime(recordTime);
            updateLastSynced(recordTime);
            console.log('✅ HR:', bpm, '| Recorded at:', recordTime.toLocaleTimeString());
          }

          // ✅ FIX 2: Resting HR — same heartRateData reuse, alag API call nahi
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
            setSpo2(value <= 1 ? Math.round(value * 100) : Math.round(value));
            updateLastSynced(spo2Time);
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
          setAccelerometer(calculateAccelerometerFromSteps(stepsData.records));

          const lastStepRecord = stepsData.records[stepsData.records.length - 1];
          const stepTime = new Date(lastStepRecord.endTime ?? lastStepRecord.startTime);
          updateLastSynced(stepTime);
        }
      } catch (e) { console.log('Steps error:', e.message); }

      // ✅ Height/Weight fetchData se hata diya — sirf startup pe hoga

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
    askPermissions,
  };
};