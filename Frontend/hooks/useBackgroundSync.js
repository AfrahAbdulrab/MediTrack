import BackgroundFetch from 'react-native-background-fetch';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { readRecords, initialize, getSdkStatus, SdkAvailabilityStatus } from 'react-native-health-connect';
import { API_BASE_URL } from '../app/constants/constants';

const fetchAndSaveToBackend = async () => {
  try {
    const status = await getSdkStatus();
    if (status !== SdkAvailabilityStatus.SDK_AVAILABLE) return;
    const isInitialized = await initialize();
    if (!isInitialized) return;

    const now = new Date();
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
    const endTime = now.toISOString();

    // HR
    let heartRate = 0;
    const hrData = await readRecords('HeartRate', {
      timeRangeFilter: { operator: 'between', startTime: last24h, endTime },
    });
    if (hrData.records.length > 0) {
      const latest = hrData.records[hrData.records.length - 1];
      heartRate = latest.samples?.[0]?.beatsPerMinute ?? latest.beatsPerMinute ?? 0;
    }

    // SPO2
    let spo2 = 0;
    const spo2Data = await readRecords('OxygenSaturation', {
      timeRangeFilter: { operator: 'between', startTime: last24h, endTime },
    });
    if (spo2Data.records.length > 0) {
      const latest = spo2Data.records[spo2Data.records.length - 1];
      const value = latest.percentage ?? latest.value ?? null;
      if (value !== null) spo2 = value <= 1 ? Math.round(value * 100) : Math.round(value);
    }

    // Steps
    let steps = 0;
    const midnight = new Date();
    midnight.setHours(0, 0, 0, 0);
    const stepsData = await readRecords('Steps', {
      timeRangeFilter: { operator: 'between', startTime: midnight.toISOString(), endTime },
    });
    if (stepsData.records.length > 0) {
      stepsData.records.forEach((r) => (steps += r.count));
    }

    // Backend pe save karo
    const token = await AsyncStorage.getItem('userToken');
    console.log('🔑 Token:', token ? 'EXISTS' : 'NULL');
    if (!token) return;

    const response = await fetch(`${API_BASE_URL}/api/vitals/record`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        heartRate,
        bloodOxygen: spo2,
        temperature: 98.6,
        footsteps: steps,
        restingHeartRate: heartRate,
      }),
    });

    const result = await response.json();
    console.log('🔴 Backend response:', JSON.stringify(result));
    console.log('✅ Background sync done:', { heartRate, spo2, steps });
  } catch (e) {
    console.log('Background sync error:', e.message);
  }
};

export const configureBackgroundFetch = () => {
  BackgroundFetch.configure(
    {
      minimumFetchInterval: 15,
      stopOnTerminate: false,
      startOnBoot: true,
      enableHeadless: true,
      requiredNetworkType: BackgroundFetch.NETWORK_TYPE_ANY,
    },
    async (taskId) => {
      console.log('📡 Background fetch triggered:', taskId);
      await fetchAndSaveToBackend();
      BackgroundFetch.finish(taskId);
    },
    (taskId) => {
      console.log('❌ Background fetch timeout:', taskId);
      BackgroundFetch.finish(taskId);
    }
  );
};

export const testBackgroundSync = fetchAndSaveToBackend;