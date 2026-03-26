import { useState, useEffect } from 'react';
import { Linking } from 'react-native';
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

  const initializeAndFetch = async () => {
    try {
      const status = await getSdkStatus();
      console.log('SDK Status:', status);
      if (status !== SdkAvailabilityStatus.SDK_AVAILABLE) return;

      const isInitialized = await initialize();
      console.log('Initialized:', isInitialized);
      if (!isInitialized) return;

      await fetchData();
    } catch (error) {
      console.log('Init Error:', error.message);
    }
  };

  // Health Connect app seedha kholega — wahan se manually allow karo
  const askPermissions = async () => {
    try {
      // Health Connect app ka settings page kholega
      await Linking.openURL('package:com.google.android.apps.healthdata');
    } catch (e) {
      try {
        // Agar upar wala kaam na kare toh Play Store pe bhejo
        await Linking.openURL('https://play.google.com/store/apps/details?id=com.google.android.apps.healthdata');
      } catch (err) {
        console.log('Linking error:', err.message);
      }
    }
  };

  const fetchData = async () => {
    try {
      const now = new Date();
      const startTime = new Date(now.getTime() - 1 * 60 * 60 * 1000).toISOString();
      const endTime = now.toISOString();

      try {
        const heartRateData = await readRecords('HeartRate', {
          timeRangeFilter: { operator: 'between', startTime, endTime },
        });
        console.log('HeartRate records:', heartRateData.records.length);
        if (heartRateData.records.length > 0) {
          const latest = heartRateData.records[heartRateData.records.length - 1];
          const bpm = latest.samples?.[0]?.beatsPerMinute ?? latest.beatsPerMinute ?? null;
          console.log('Latest HR:', bpm);
          setHeartRate(bpm);
        }
      } catch (e) { console.log('HR error:', e.message); }

      try {
        const spo2Data = await readRecords('OxygenSaturation', {
          timeRangeFilter: { operator: 'between', startTime, endTime },
        });
        console.log('SPO2 records:', spo2Data.records.length);
        if (spo2Data.records.length > 0) {
          const latest = spo2Data.records[spo2Data.records.length - 1];
          const value = latest.percentage ?? latest.value ?? null;
          setSpo2(value !== null && value <= 1 ? value * 100 : value);
        }
      } catch (e) { console.log('SPO2 error:', e.message); }

      try {
        const stepsData = await readRecords('Steps', {
          timeRangeFilter: { operator: 'between', startTime, endTime },
        });
        if (stepsData.records.length > 0) {
          let totalSteps = 0;
          stepsData.records.forEach(r => totalSteps += r.count);
          console.log('Total steps:', totalSteps);
          setSteps(totalSteps);
        }
      } catch (e) { console.log('Steps error:', e.message); }

    } catch (error) {
      console.log('Fetch Error:', error.message);
    }
  };

  return { heartRate, spo2, steps, askPermissions };
};