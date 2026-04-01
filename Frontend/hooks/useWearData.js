import { useState, useEffect } from 'react';
import { Linking } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  initialize,
  readRecords,
  getSdkStatus,
  SdkAvailabilityStatus,
} from 'react-native-health-connect';

export const useWearData = () => {
  const [heartRate, setHeartRate] = useState(null);
  const [spo2, setSpo2] = useState(null);
  const [steps, setSteps] = useState(null);
  const [restingHeartRate, setRestingHeartRate] = useState(null);
  const [bmi, setBmi] = useState(null);
  const [accelerometer, setAccelerometer] = useState({
    x: 0,
    y: 9.8,
    z: 0,
    intensity: 'Still',
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      initializeAndFetch();
    }, 1000);

    const interval = setInterval(() => {
      fetchData();
    }, 10000);

    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, []);

  // ─── BMI from backend profile ───────────────────────────────────────────────
  const loadBMIFromProfile = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      console.log('Token:', token ? 'Found' : 'NOT FOUND');
      if (!token) return;

      const response = await fetch('http://192.168.1.9:5000/api/auth/profile', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      console.log('Profile response:', JSON.stringify(data));

      if (data?.height && data?.weight) {
        const heightStr = data.height.toString();
        const parts = heightStr.split('.');
        const feet = parseInt(parts[0]) || 0;
        const inches = parseInt(parts[1]) || 0;
        const totalInches = feet * 12 + inches;
        const heightMeters = totalInches * 0.0254;
        const weightKg = parseFloat(data.weight);
        console.log(
          `Height: ${feet}ft ${inches}in = ${heightMeters.toFixed(3)}m, Weight: ${weightKg}kg`
        );
        if (heightMeters > 0 && weightKg > 0) {
          const bmiValue = weightKg / (heightMeters * heightMeters);
          const finalBMI = parseFloat(bmiValue.toFixed(1));
          console.log('BMI from profile:', finalBMI);
          setBmi(finalBMI);
        }
      } else if (data?.bmi) {
        console.log('Using stored BMI:', data.bmi);
        setBmi(parseFloat(data.bmi));
      } else {
        console.log('Profile fields:', Object.keys(data));
      }
    } catch (e) {
      console.log('BMI load error:', e.message);
    }
  };

  // ─── Init + first fetch ──────────────────────────────────────────────────────
  const initializeAndFetch = async () => {
    try {
      await loadBMIFromProfile();

      const status = await getSdkStatus();
      console.log('Health Connect SDK status:', status);
      if (status !== SdkAvailabilityStatus.SDK_AVAILABLE) {
        console.log('Health Connect not available');
        return;
      }

      const isInitialized = await initialize();
      console.log('Health Connect initialized:', isInitialized);
      if (!isInitialized) return;

      await fetchData();
    } catch (error) {
      console.log('Init Error:', error.message);
    }
  };

  // ─── Open Health Connect permissions ────────────────────────────────────────
  const askPermissions = async () => {
    try {
      await Linking.openURL('package:com.google.android.apps.healthdata');
    } catch (e) {
      try {
        await Linking.openURL(
          'https://play.google.com/store/apps/details?id=com.google.android.apps.healthdata'
        );
      } catch (err) {
        console.log('Linking error:', err.message);
      }
    }
  };

  // ─── Helper: steps/min → accel values ───────────────────────────────────────
  const getAccelFromRate = (stepsPerMinute) => {
    let intensity, x, y, z;

    if (stepsPerMinute < 1) {
      // Resting / Still
      intensity = 'Still';
      x = 0.0;
      y = 9.8;
      z = 0.0;
    } else if (stepsPerMinute < 40) {
      // Slow walk
      intensity = 'Light';
      x = parseFloat((stepsPerMinute * 0.04).toFixed(2));
      y = parseFloat((9.8 - stepsPerMinute * 0.01).toFixed(2));
      z = parseFloat((stepsPerMinute * 0.025).toFixed(2));
    } else if (stepsPerMinute < 80) {
      // Normal walk
      intensity = 'Moderate';
      x = parseFloat((stepsPerMinute * 0.06).toFixed(2));
      y = parseFloat((9.8 - stepsPerMinute * 0.02).toFixed(2));
      z = parseFloat((stepsPerMinute * 0.04).toFixed(2));
    } else {
      // Running / fast walk
      intensity = 'Active';
      x = parseFloat((stepsPerMinute * 0.09).toFixed(2));
      y = parseFloat((9.8 - stepsPerMinute * 0.035).toFixed(2));
      z = parseFloat((stepsPerMinute * 0.065).toFixed(2));
    }

    return { x, y, z, intensity };
  };

  // ─── Core: calculate accelerometer from step records ────────────────────────
  //
  //  OLD approach  → raw diff of last 2 records  (almost always 0 → "Still")
  //  NEW approach  → steps counted in the last 10-minute window → steps/min rate
  //
  const calculateAccelerometerFromSteps = (stepsRecords) => {
    try {
      if (!stepsRecords || stepsRecords.length === 0) {
        return { x: 0.0, y: 9.8, z: 0.0, intensity: 'Still' };
      }

      const now = new Date();
      const tenMinutesAgo = new Date(now.getTime() - 10 * 60 * 1000);

      // Filter records that fall inside the last 10 minutes
      const recentRecords = stepsRecords.filter((r) => {
        const recordTime = new Date(r.endTime || r.startTime);
        return recordTime >= tenMinutesAgo;
      });

      if (recentRecords.length > 0) {
        // Sum steps from the recent window
        let recentSteps = 0;
        recentRecords.forEach((r) => (recentSteps += r.count || 0));

        const stepsPerMinute = recentSteps / 10; // window = 10 min
        console.log(
          `Accel → recent steps (10 min): ${recentSteps} | steps/min: ${stepsPerMinute.toFixed(1)}`
        );
        return getAccelFromRate(stepsPerMinute);
      }

      // ── Fallback: no record in last 10 min → use daily average ──────────────
      const totalSteps = stepsRecords.reduce((sum, r) => sum + (r.count || 0), 0);
      const firstTime = new Date(
        stepsRecords[0].startTime || stepsRecords[0].endTime
      );
      const minutesElapsed = Math.max(1, (now - firstTime) / 1000 / 60);
      const avgStepsPerMinute = totalSteps / minutesElapsed;

      console.log(
        `Accel → fallback avg: ${totalSteps} steps over ${minutesElapsed.toFixed(0)} min = ${avgStepsPerMinute.toFixed(1)} steps/min`
      );
      return getAccelFromRate(avgStepsPerMinute);
    } catch (e) {
      console.log('Accel calc error:', e.message);
      return { x: 0.0, y: 9.8, z: 0.0, intensity: 'Still' };
    }
  };

  // ─── Main data fetch (runs on init + every 10 sec) ──────────────────────────
  const fetchData = async () => {
    try {
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 1 * 60 * 60 * 1000).toISOString();
      const endTime = now.toISOString();

      // ── Heart Rate (live — last 1 hour, stale after 5 min) ──────────────────
      try {
        const heartRateData = await readRecords('HeartRate', {
          timeRangeFilter: { operator: 'between', startTime: oneHourAgo, endTime },
        });

        if (heartRateData.records.length > 0) {
          const latest = heartRateData.records[heartRateData.records.length - 1];
          const bpm =
            latest.samples?.[0]?.beatsPerMinute ?? latest.beatsPerMinute ?? null;
          const recordTime = new Date(latest.endTime ?? latest.time);
          const diffMinutes = (now - recordTime) / 1000 / 60;

          if (diffMinutes <= 5) {
            setHeartRate(bpm);
          } else {
            setHeartRate(null);
          }
        } else {
          setHeartRate(null);
        }
      } catch (e) {
        console.log('HR error:', e.message);
      }

      // ── Resting Heart Rate (min BPM in last 24 h, must be > 40) ─────────────
      try {
        const restingHRData = await readRecords('HeartRate', {
          timeRangeFilter: {
            operator: 'between',
            startTime: new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString(),
            endTime,
          },
        });

        console.log('HR records for resting:', restingHRData.records.length);

        if (restingHRData.records.length > 0) {
          let minBPM = Infinity;
          restingHRData.records.forEach((record) => {
            const bpm =
              record.samples?.[0]?.beatsPerMinute ?? record.beatsPerMinute ?? null;
            if (bpm && bpm > 40 && bpm < minBPM) {
              minBPM = bpm;
            }
          });
          if (minBPM !== Infinity) {
            console.log('Resting HR (min):', minBPM);
            setRestingHeartRate(minBPM);
          }
        }
      } catch (e) {
        console.log('Resting HR error:', e.message);
      }

      // ── SPO2 ─────────────────────────────────────────────────────────────────
      try {
        const spo2Data = await readRecords('OxygenSaturation', {
          timeRangeFilter: { operator: 'between', startTime: oneHourAgo, endTime },
        });

        if (spo2Data.records.length > 0) {
          const latest = spo2Data.records[spo2Data.records.length - 1];
          const value = latest.percentage ?? latest.value ?? null;
          // Handle both 0-1 and 0-100 ranges
          setSpo2(value !== null && value <= 1 ? value * 100 : value);
        } else {
          setSpo2(null);
        }
      } catch (e) {
        console.log('SPO2 error:', e.message);
      }

      // ── Steps + Accelerometer ────────────────────────────────────────────────
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
          // Total daily steps
          let totalSteps = 0;
          stepsData.records.forEach((r) => (totalSteps += r.count));
          setSteps(totalSteps);

          // Accelerometer — uses time-windowed steps/min rate
          const accelData = calculateAccelerometerFromSteps(stepsData.records);
          console.log('Accel result:', JSON.stringify(accelData));
          setAccelerometer(accelData);
        }
      } catch (e) {
        console.log('Steps error:', e.message);
      }

      // ── Height + Weight → BMI (Health Connect, last 30 days) ────────────────
      try {
        const last30Days = new Date(
          now.getTime() - 30 * 24 * 60 * 60 * 1000
        ).toISOString();

        const heightData = await readRecords('Height', {
          timeRangeFilter: { operator: 'between', startTime: last30Days, endTime },
        });
        const weightData = await readRecords('Weight', {
          timeRangeFilter: { operator: 'between', startTime: last30Days, endTime },
        });

        console.log('Height records:', heightData.records.length);
        console.log('Weight records:', weightData.records.length);

        if (heightData.records.length > 0 && weightData.records.length > 0) {
          const latestHeight =
            heightData.records[heightData.records.length - 1];
          const latestWeight =
            weightData.records[weightData.records.length - 1];

          const heightMeters =
            latestHeight.height?.inMeters ?? latestHeight.value ?? null;
          const weightKg =
            latestWeight.weight?.inKilograms ?? latestWeight.value ?? null;

          console.log('Height meters:', heightMeters, 'Weight kg:', weightKg);

          if (heightMeters && weightKg) {
            const bmiValue = weightKg / (heightMeters * heightMeters);
            setBmi(parseFloat(bmiValue.toFixed(1)));
          }
        }
      } catch (e) {
        console.log('Height/Weight HC error:', e.message);
      }
    } catch (error) {
      console.log('Fetch Error:', error.message);
    }
  };

  return {
    heartRate,
    spo2,
    steps,
    restingHeartRate,
    bmi,
    accelerometer,
    askPermissions,
  };
};