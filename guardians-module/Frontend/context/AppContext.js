import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authFetch } from './api';

const AppContext = createContext();

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

  const intervalRef = useRef(null);

  const buildAlertsFromVitals = (reading) => {
    if (!reading) return [];
    const newAlerts = [];
    let id = Date.now();

    if (reading.heartRate > 100) {
      newAlerts.push({
        id: id++, icon: '!', iconBg: '#fdecea', iconColor: '#e74c3c',
        title: 'Heart rate critical',
        sub: `HR ${reading.heartRate} bpm • ${reading.alertLevel === 'critical' ? 'Critical' : 'High'}`,
        time: new Date(reading.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        badge: reading.alertLevel === 'critical' ? 'Critical' : 'Warning',
        badgeBg: reading.alertLevel === 'critical' ? '#fdecea' : '#fff3e0',
        badgeColor: reading.alertLevel === 'critical' ? '#e74c3c' : '#e67e22',
        seen: false, group: 'TODAY',
      });
    }
    if (reading.bloodOxygen < 95) {
      newAlerts.push({
        id: id++, icon: '~', iconBg: '#fff3e0', iconColor: '#e67e22',
        title: 'SpO2 low',
        sub: `SpO2 ${reading.bloodOxygen}% • Below normal`,
        time: new Date(reading.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        badge: 'Warning', badgeBg: '#fff3e0', badgeColor: '#e67e22',
        seen: false, group: 'TODAY',
      });
    }
    if (reading.systolicBP && reading.systolicBP > 140) {
      newAlerts.push({
        id: id++, icon: '!', iconBg: '#fdecea', iconColor: '#e74c3c',
        title: 'Blood pressure high',
        sub: `BP ${reading.systolicBP}/${reading.diastolicBP} mmHg`,
        time: new Date(reading.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        badge: 'Critical', badgeBg: '#fdecea', badgeColor: '#e74c3c',
        seen: false, group: 'TODAY',
      });
    }
    if (reading.bloodSugar && reading.bloodSugar > 180) {
      newAlerts.push({
        id: id++, icon: '~', iconBg: '#fff3e0', iconColor: '#e67e22',
        title: 'Blood sugar elevated',
        sub: `BS ${reading.bloodSugar} mg/dL`,
        time: new Date(reading.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        badge: 'Moderate', badgeBg: '#fff3e0', badgeColor: '#e67e22',
        seen: false, group: 'TODAY',
      });
    }
    if (newAlerts.length === 0) {
      newAlerts.push({
        id: id++, icon: '✓', iconBg: '#e8f8f0', iconColor: '#27ae60',
        title: 'Vitals normal',
        sub: 'All readings stable',
        time: new Date(reading.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        badge: 'Normal', badgeBg: '#e8f8f0', badgeColor: '#27ae60',
        seen: true, group: 'TODAY',
      });
    }
    return newAlerts;
  };

  const getOverallStatus = (reading) => {
    if (!reading) return 'Normal';
    if (reading.alertLevel === 'critical') return 'Critical';
    if (reading.alertLevel === 'warning') return 'Moderate';
    return 'Normal';
  };

  const formatVitals = (reading, history) => {
    const hrGraph = history.slice(0, 10).reverse().map(r => r.heartRate || 0);
    const spo2Graph = history.slice(0, 10).reverse().map(r => r.bloodOxygen || 0);
    const tempGraph = history.slice(0, 10).reverse().map(r => r.temperature || 0);
    const stepsGraph = history.slice(0, 10).reverse().map(r => r.footsteps || 0);
    const bpGraph = history.slice(0, 10).reverse().map(r => r.systolicBP || 0);
    const bsGraph = history.slice(0, 10).reverse().map(r => r.bloodSugar || 0);

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

    const hrVals = history.map(r => r.heartRate).filter(Boolean);
    const spo2Vals = history.map(r => r.bloodOxygen).filter(Boolean);
    const tempVals = history.map(r => r.temperature).filter(Boolean);
    const stepsVals = history.map(r => r.footsteps).filter(Boolean);
    const bpVals = history.map(r => r.systolicBP).filter(Boolean);
    const bsVals = history.map(r => r.bloodSugar).filter(Boolean);

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

  // ── Main fetch — SIRF YAHAN 3 LINES BADLI HAIN ────────────────────────────
  const fetchAllData = async () => {
    try {
      // ✅ LINE 1 BADLI: /api/auth/profile → /api/guardian/auth/profile
      const profileData = await authFetch('/api/guardian/auth/profile');
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

        // Other guardians real data
        if (profileData.otherGuardians) {
          setOtherGuardians(profileData.otherGuardians.map(c => ({
            name: c.name,
            initials: c.name ? c.name.split(' ').map(n => n[0]).join('').toUpperCase() : '--',
            relation: c.relationship || 'Guardian',
            phone: c.phone,
            color: '#fff3e0',
            textColor: '#e67e22',
          })));
        }
      }

      // ✅ LINE 2 BADLI: /api/vitals/latest → /api/guardian/vitals/latest
      const latestData = await authFetch('/api/guardian/vitals/latest');

      // ✅ LINE 3 BADLI: /api/vitals/history → /api/guardian/vitals/history
      const historyData = await authFetch('/api/guardian/vitals/history?limit=20');

      if (latestData?.success && latestData?.data) {
        const reading = latestData.data;
        const history = historyData?.data || [reading];

        setVitals(formatVitals(reading, history));
        setAlerts(buildAlertsFromVitals(reading));
        setOverallStatus(getOverallStatus(reading));

        const lastTime = new Date(reading.timestamp);
        const minutesAgo = Math.floor((Date.now() - lastTime) / 60000);
        setWatchConnected(minutesAgo < 30);
        setLastSynced(
          minutesAgo < 1 ? 'Just now' :
          minutesAgo < 60 ? `${minutesAgo} min ago` :
          `${Math.floor(minutesAgo / 60)} hr ago`
        );
      }

      // ✅ BONUS: Reports data bhi fetch karo
      const monthlyData = await authFetch('/api/guardian/reports/monthly');
      if (monthlyData?.success) setMonthlyReports(monthlyData.data);

      const diseasesData = await authFetch('/api/guardian/reports/diseases');
      if (diseasesData?.success) setDiseases(diseasesData.diseases);

    } catch (error) {
      console.error('❌ fetchAllData error:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const markSeen = (id) => {
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, seen: true } : a));
  };

  useEffect(() => {
    fetchAllData();
    intervalRef.current = setInterval(fetchAllData, 30000);
    return () => clearInterval(intervalRef.current);
  }, []);

  return (
    <AppContext.Provider value={{
      guardian, patient, vitals, alerts, markSeen,
      watchConnected, lastSynced, overallStatus,
      otherGuardians, monthlyReports, diseases,
      loading, refreshData: fetchAllData,
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);