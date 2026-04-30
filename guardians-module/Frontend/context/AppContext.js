import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authFetch } from './api';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import * as Location from 'expo-location';
import { Platform } from 'react-native';

const AppContext = createContext();

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export const AppProvider = ({ children }) => {
  const [guardian, setGuardian] = useState(null);
  const [patient, setPatient] = useState(null);
  const [vitals, setVitals] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [watchConnected, setWatchConnected] = useState(false);
  const [lastSynced, setLastSynced] = useState('--');
  const [overallStatus, setOverallStatus] = useState('Normal');
  const [loading, setLoading] = useState(true);
  const [otherGuardians, setOtherGuardians] = useState([]);
  const [monthlyReports, setMonthlyReports] = useState([]);
  const [diseases, setDiseases] = useState([]);

  // ✅ Live location state
  const [patientLiveLocation, setPatientLiveLocation] = useState(null);
  const [locationPermission, setLocationPermission] = useState(false);

  const intervalRef = useRef(null);
  const locationWatchRef = useRef(null);

  // ✅ Live location start karo (expo-location use karke)
  const startLiveLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.log('📍 Location permission denied');
        setLocationPermission(false);
        return;
      }
      setLocationPermission(true);

      // Current location ek dafa le lo
      const current = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      setPatientLiveLocation({
        latitude: current.coords.latitude,
        longitude: current.coords.longitude,
        accuracy: current.coords.accuracy,
        timestamp: current.timestamp,
      });

      // Continuous watch bhi shuru karo
      locationWatchRef.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 15000,   // 15 seconds
          distanceInterval: 10,  // 10 meter
        },
        (loc) => {
          setPatientLiveLocation({
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
            accuracy: loc.coords.accuracy,
            timestamp: loc.timestamp,
          });
        }
      );
    } catch (error) {
      console.log('📍 Location error:', error.message);
    }
  };

  const stopLiveLocation = () => {
    if (locationWatchRef.current) {
      locationWatchRef.current.remove();
      locationWatchRef.current = null;
    }
  };

  const registerPushToken = async () => {
    try {
      if (!Device.isDevice) return;

      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') return;

      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('meditrack-alerts', {
          name: 'MediTrack Health Alerts',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          sound: true,
        });
      }

      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId: 'a54c051a-2253-4f01-90d1-b2be303d6618',
      });

      await authFetch('/api/guardian/auth/save-push-token', {
        method: 'POST',
        body: JSON.stringify({ expoPushToken: tokenData.data }),
      });
    } catch (error) {
      console.log('⚠️ Push token error:', error.message);
    }
  };

  const buildAlertsFromHistory = (history, address) => {
    if (!history || history.length === 0) return [];

    const allAlerts = [];
    let id = Date.now();

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    history.forEach(reading => {
      if (!reading) return;

      const readingDate = new Date(reading.timestamp);
      const time = readingDate.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      });

      const readingDay = new Date(readingDate);
      readingDay.setHours(0, 0, 0, 0);
      const diffDays = Math.floor((today - readingDay) / (1000 * 60 * 60 * 24));
      const group = diffDays === 0
        ? 'TODAY'
        : diffDays === 1
        ? 'YESTERDAY'
        : readingDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase();

      if (reading.heartRate > 100 || reading.heartRate < 60) {
        const isHigh = reading.heartRate > 100;
        allAlerts.push({
          id: id++,
          icon: '!',
          iconBg: '#fdecea',
          iconColor: '#e74c3c',
          title: isHigh ? 'Heart rate high' : 'Heart rate low',
          sub: `HR ${reading.heartRate} bpm • ${isHigh ? 'Above normal' : 'Below normal'}`,
          time,
          badge: reading.alertLevel === 'critical' ? 'Critical' : 'Warning',
          badgeBg: reading.alertLevel === 'critical' ? '#fdecea' : '#fff3e0',
          badgeColor: reading.alertLevel === 'critical' ? '#e74c3c' : '#e67e22',
          seen: false,
          group,
          timestamp: readingDate.getTime(),
          location: address || '--',
        });
      }

      if (reading.bloodOxygen < 95) {
        allAlerts.push({
          id: id++,
          icon: '~',
          iconBg: '#fff3e0',
          iconColor: '#e67e22',
          title: 'SpO2 low',
          sub: `SpO2 ${reading.bloodOxygen}% • ${reading.bloodOxygen < 90 ? 'Critical' : 'Below normal'}`,
          time,
          badge: reading.bloodOxygen < 90 ? 'Critical' : 'Warning',
          badgeBg: reading.bloodOxygen < 90 ? '#fdecea' : '#fff3e0',
          badgeColor: reading.bloodOxygen < 90 ? '#e74c3c' : '#e67e22',
          seen: false,
          group,
          timestamp: readingDate.getTime(),
          location: address || '--',
        });
      }

      if (reading.systolicBP && reading.systolicBP > 140) {
        allAlerts.push({
          id: id++,
          icon: '!',
          iconBg: '#fdecea',
          iconColor: '#e74c3c',
          title: 'Blood pressure high',
          sub: `BP ${reading.systolicBP}/${reading.diastolicBP} mmHg`,
          time,
          badge: 'Critical',
          badgeBg: '#fdecea',
          badgeColor: '#e74c3c',
          seen: false,
          group,
          timestamp: readingDate.getTime(),
          location: address || '--',
        });
      }

      if (reading.bloodSugar && reading.bloodSugar > 180) {
        allAlerts.push({
          id: id++,
          icon: '~',
          iconBg: '#fff3e0',
          iconColor: '#e67e22',
          title: 'Blood sugar elevated',
          sub: `BS ${reading.bloodSugar} mg/dL`,
          time,
          badge: 'Moderate',
          badgeBg: '#fff3e0',
          badgeColor: '#e67e22',
          seen: false,
          group,
          timestamp: readingDate.getTime(),
          location: address || '--',
        });
      }

      if (reading.temperature && reading.temperature > 38.5) {
        allAlerts.push({
          id: id++,
          icon: '!',
          iconBg: '#fdecea',
          iconColor: '#e74c3c',
          title: 'High temperature / Fever',
          sub: `Temp ${reading.temperature}°C • Above normal`,
          time,
          badge: 'Warning',
          badgeBg: '#fff3e0',
          badgeColor: '#e67e22',
          seen: false,
          group,
          timestamp: readingDate.getTime(),
          location: address || '--',
        });
      }
    });

    const PRIORITY = { Critical: 0, Warning: 1, Moderate: 2, Normal: 3 };
    allAlerts.sort((a, b) => {
      const pa = PRIORITY[a.badge] ?? 99;
      const pb = PRIORITY[b.badge] ?? 99;
      if (pa !== pb) return pa - pb;
      return b.timestamp - a.timestamp;
    });

    if (allAlerts.length === 0) {
      const latest = history[0];
      const time = new Date(latest.timestamp).toLocaleTimeString([], {
        hour: '2-digit', minute: '2-digit',
      });
      allAlerts.push({
        id: id++,
        icon: '✓',
        iconBg: '#e8f8f0',
        iconColor: '#27ae60',
        title: 'Vitals normal',
        sub: 'All readings stable',
        time,
        badge: 'Normal',
        badgeBg: '#e8f8f0',
        badgeColor: '#27ae60',
        seen: true,
        group: 'TODAY',
        timestamp: Date.now(),
        location: address || '--',
      });
    }

    return allAlerts;
  };

  const getOverallStatus = (reading) => {
    if (!reading) return 'Normal';
    if (reading.alertLevel === 'critical') return 'Critical';
    if (reading.alertLevel === 'warning') return 'Moderate';
    return 'Normal';
  };

  const formatVitals = (reading, history) => {
    const hrGraph    = history.slice(0, 10).reverse().map(r => r.heartRate    || 0);
    const spo2Graph  = history.slice(0, 10).reverse().map(r => r.bloodOxygen  || 0);
    const tempGraph  = history.slice(0, 10).reverse().map(r => r.temperature  || 0);
    const stepsGraph = history.slice(0, 10).reverse().map(r => r.footsteps    || 0);
    const bpGraph    = history.slice(0, 10).reverse().map(r => r.systolicBP   || 0);
    const bsGraph    = history.slice(0, 10).reverse().map(r => r.bloodSugar   || 0);

    const hrReadings = history.slice(0, 5).map(r => ({
      time: new Date(r.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      value: r.heartRate,
      status: r.heartRate > 100 ? 'High' : r.heartRate < 60 ? 'Low' : 'Normal',
      color: r.heartRate > 100 ? '#e74c3c' : r.heartRate < 60 ? '#e67e22' : '#27ae60',
    }));

    const spo2Readings = history.slice(0, 5).map(r => ({
      time: new Date(r.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      value: r.bloodOxygen,
      status: r.bloodOxygen < 90 ? 'Critical' : r.bloodOxygen < 95 ? 'Low' : 'Normal',
      color: r.bloodOxygen < 90 ? '#e74c3c' : r.bloodOxygen < 95 ? '#e67e22' : '#27ae60',
    }));

    const hrVals    = history.map(r => r.heartRate).filter(Boolean);
    const spo2Vals  = history.map(r => r.bloodOxygen).filter(Boolean);
    const tempVals  = history.map(r => r.temperature).filter(Boolean);
    const stepsVals = history.map(r => r.footsteps).filter(Boolean);
    const bpVals    = history.map(r => r.systolicBP).filter(Boolean);
    const bsVals    = history.map(r => r.bloodSugar).filter(Boolean);

    const min = arr => arr.length ? Math.min(...arr) : 0;
    const max = arr => arr.length ? Math.max(...arr) : 0;
    const avg = arr => arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : 0;

    return {
      heartRate: {
        label: 'Heart Rate', current: reading.heartRate || 0, unit: 'bpm',
        status: reading.heartRate > 100 ? 'Above normal' : reading.heartRate < 60 ? 'Below normal' : 'Normal',
        statusColor: reading.heartRate > 100 ? '#e74c3c' : reading.heartRate < 60 ? '#e67e22' : '#27ae60',
        dotColor: reading.heartRate > 100 ? '#e74c3c' : '#27ae60',
        iconBg: reading.heartRate > 100 ? '#fdecea' : '#e8f8f0',
        iconColor: reading.heartRate > 100 ? '#e74c3c' : '#27ae60',
        abbr: '♥', min: min(hrVals), avg: avg(hrVals), max: max(hrVals),
        graphData: hrGraph.length ? hrGraph : [70],
        graphLabels: ['12AM', '6AM', '12PM', '6PM', 'Now'], readings: hrReadings,
      },
      spo2: {
        label: 'SpO2', current: reading.bloodOxygen || 0, unit: '%',
        status: reading.bloodOxygen < 90 ? 'Critical' : reading.bloodOxygen < 95 ? 'Low' : 'Normal',
        statusColor: reading.bloodOxygen < 90 ? '#e74c3c' : reading.bloodOxygen < 95 ? '#e67e22' : '#27ae60',
        dotColor: reading.bloodOxygen < 95 ? '#e67e22' : '#27ae60',
        iconBg: '#e8f8f0', iconColor: '#27ae60', abbr: 'O₂',
        min: min(spo2Vals), avg: avg(spo2Vals), max: max(spo2Vals),
        graphData: spo2Graph.length ? spo2Graph : [97],
        graphLabels: ['12AM', '6AM', '12PM', '6PM', 'Now'], readings: spo2Readings,
      },
      bloodPressure: {
        label: 'Blood Pressure',
        current: reading.systolicBP ? `${reading.systolicBP}/${reading.diastolicBP}` : '--/--',
        unit: 'mmHg',
        status: reading.systolicBP > 140 ? 'Elevated' : reading.systolicBP < 90 ? 'Low' : 'Normal',
        statusColor: reading.systolicBP > 140 ? '#e67e22' : '#27ae60',
        dotColor: reading.systolicBP > 140 ? '#e67e22' : '#27ae60',
        iconBg: '#fff3e0', iconColor: '#e67e22', abbr: 'BP',
        min: `${min(bpVals)}`, avg: `${avg(bpVals)}`, max: `${max(bpVals)}`,
        graphData: bpGraph.length ? bpGraph : [120],
        graphLabels: ['12AM', '6AM', '12PM', '6PM', 'Now'],
        readings: history.slice(0, 5).map(r => ({
          time: new Date(r.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          value: r.systolicBP ? `${r.systolicBP}/${r.diastolicBP}` : '--',
          status: r.systolicBP > 140 ? 'Elevated' : 'Normal',
          color: r.systolicBP > 140 ? '#e67e22' : '#27ae60',
        })),
      },
      bloodSugar: {
        label: 'Blood Sugar', current: reading.bloodSugar || '--', unit: 'mg/dL',
        status: reading.bloodSugar > 180 ? 'High' : reading.bloodSugar > 140 ? 'Borderline' : 'Normal',
        statusColor: reading.bloodSugar > 180 ? '#e74c3c' : reading.bloodSugar > 140 ? '#e67e22' : '#27ae60',
        dotColor: reading.bloodSugar > 140 ? '#e67e22' : '#27ae60',
        iconBg: '#fff3e0', iconColor: '#e67e22', abbr: 'BS',
        min: min(bsVals), avg: avg(bsVals), max: max(bsVals),
        graphData: bsGraph.length ? bsGraph : [100],
        graphLabels: ['12AM', '6AM', '12PM', '6PM', 'Now'],
        readings: history.slice(0, 5).map(r => ({
          time: new Date(r.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          value: r.bloodSugar || '--',
          status: r.bloodSugar > 180 ? 'High' : r.bloodSugar > 140 ? 'Borderline' : 'Normal',
          color: r.bloodSugar > 180 ? '#e74c3c' : r.bloodSugar > 140 ? '#e67e22' : '#27ae60',
        })),
      },
      temperature: {
        label: 'Temperature', current: reading.temperature || '--', unit: '°C',
        status: reading.temperature > 38.5 ? 'Fever' : reading.temperature < 36 ? 'Low' : 'Normal',
        statusColor: reading.temperature > 38.5 ? '#e74c3c' : '#27ae60',
        dotColor: reading.temperature > 38.5 ? '#e74c3c' : '#27ae60',
        iconBg: '#e8f8f0', iconColor: '#27ae60', abbr: '°C',
        min: min(tempVals), avg: avg(tempVals), max: max(tempVals),
        graphData: tempGraph.length ? tempGraph : [37],
        graphLabels: ['12AM', '6AM', '12PM', '6PM', 'Now'],
        readings: history.slice(0, 5).map(r => ({
          time: new Date(r.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          value: r.temperature,
          status: r.temperature > 38.5 ? 'Fever' : 'Normal',
          color: r.temperature > 38.5 ? '#e74c3c' : '#27ae60',
        })),
      },
      steps: {
        label: 'Steps today', current: reading.footsteps || 0, unit: '',
        status: reading.footsteps > 3000 ? 'Active' : reading.footsteps > 1000 ? 'Moderate' : 'Low',
        statusColor: reading.footsteps > 3000 ? '#27ae60' : '#e67e22',
        dotColor: reading.footsteps > 3000 ? '#27ae60' : '#e67e22',
        iconBg: '#e8f8f0', iconColor: '#27ae60', abbr: '👟',
        min: min(stepsVals), avg: avg(stepsVals), max: max(stepsVals),
        graphData: stepsGraph.length ? stepsGraph : [0],
        graphLabels: ['12AM', '6AM', '12PM', '6PM', 'Now'],
        readings: history.slice(0, 5).map(r => ({
          time: new Date(r.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          value: r.footsteps || 0,
          status: r.footsteps > 3000 ? 'Active' : 'Low',
          color: r.footsteps > 3000 ? '#27ae60' : '#e67e22',
        })),
      },
    };
  };

  const fetchAllData = async () => {
    try {
      const token = await AsyncStorage.getItem('guardianToken');
      if (!token) { setLoading(false); return; }

      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const todayISO = new Date().toISOString();

      const [profileRes, latestRes, historyRes, monthlyRes, diseasesRes] =
        await Promise.allSettled([
          authFetch('/api/guardian/auth/profile'),
          authFetch('/api/guardian/vitals/latest'),
          authFetch(`/api/guardian/vitals/history?limit=1000&startDate=${thirtyDaysAgo}&endDate=${todayISO}`),
          authFetch('/api/guardian/reports/monthly'),
          authFetch('/api/guardian/reports/diseases'),
        ]);

      const profileData  = profileRes.status  === 'fulfilled' ? profileRes.value  : null;
      const latestData   = latestRes.status   === 'fulfilled' ? latestRes.value   : null;
      const historyData  = historyRes.status  === 'fulfilled' ? historyRes.value  : null;
      const monthlyData  = monthlyRes.status  === 'fulfilled' ? monthlyRes.value  : null;
      const diseasesData = diseasesRes.status === 'fulfilled' ? diseasesRes.value : null;

      let patientAddress = '--';

      if (profileData?.success) {
        const g = profileData.guardian;
        const p = profileData.patient;

        setGuardian({
          name: g.name || 'Guardian',
          initials: g.name ? g.name.split(' ').map(n => n[0]).join('').toUpperCase() : 'GU',
          relation: g.relation || 'Guardian',
          email: g.email || '',
          phone: g.phone || '',
        });

        if (p) {
          patientAddress = p.address || '--';
          setPatient({
            name: p.name || 'Patient',
            initials: p.name ? p.name.split(' ').map(n => n[0]).join('').toUpperCase() : 'PT',
            age: p.age || '--',
            gender: p.gender || '--',
            bloodGroup: p.bloodType || '--',
            condition: p.status || 'Monitoring',
            patientId: p.patientId || '--',
            phone: p.phone || '--',
            address: p.address || '--',
            monitoringSince: p.monitoringSince || '--',
          });
        }

        if (profileData.otherGuardians) {
          setOtherGuardians(
            profileData.otherGuardians.map(c => ({
              name: c.name,
              initials: c.name ? c.name.split(' ').map(n => n[0]).join('').toUpperCase() : '--',
              relation: c.relationship || 'Guardian',
              phone: c.phone,
              color: '#fff3e0',
              textColor: '#e67e22',
            }))
          );
        }
      }

      if (latestData?.success && latestData?.data) {
        const reading = latestData.data;
        const history = historyData?.data || [reading];

        setVitals(formatVitals(reading, history));
        setAlerts(buildAlertsFromHistory(history, patientAddress));
        setOverallStatus(getOverallStatus(reading));

        const minutesAgo = Math.floor((Date.now() - new Date(reading.timestamp)) / 60000);
        setWatchConnected(minutesAgo < 30);
        setLastSynced(
          minutesAgo < 1  ? 'Just now' :
          minutesAgo < 60 ? `${minutesAgo} min ago` :
          `${Math.floor(minutesAgo / 60)} hr ago`
        );
      }

      if (monthlyData?.success)  setMonthlyReports(monthlyData.data);
      if (diseasesData?.success) setDiseases(diseasesData.diseases);

    } catch (error) {
      console.error('❌ fetchAllData error:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const refreshData = async () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setLoading(true);
    await fetchAllData();
    intervalRef.current = setInterval(fetchAllData, 30000);
  };

  const markSeen = (id) => {
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, seen: true } : a));
  };

  useEffect(() => {
    const init = async () => {
      const token = await AsyncStorage.getItem('guardianToken');
      if (token) {
        await registerPushToken();
        await startLiveLocation();   // ✅ Live location start
        await fetchAllData();
        intervalRef.current = setInterval(fetchAllData, 30000);
      } else {
        setLoading(false);
      }
    };
    init();
    return () => {
      clearInterval(intervalRef.current);
      stopLiveLocation();            // ✅ Cleanup
    };
  }, []);

  return (
    <AppContext.Provider value={{
      guardian, patient, vitals, alerts, markSeen,
      watchConnected, lastSynced, overallStatus,
      otherGuardians, monthlyReports, diseases,
      loading, refreshData,
      patientLiveLocation,   // ✅ Export live location
      locationPermission,    // ✅ Export permission status
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);