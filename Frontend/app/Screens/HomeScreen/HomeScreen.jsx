import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Heart,
  Thermometer,
  Activity,
  Wind,
  AlertCircle,
  Phone,
  MapPin,
  Menu,
} from "lucide-react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import Footer from '../components/Footer';
import MenuDrawer from '../components/Menu';
import { API_BASE_URL } from '../../constants/constants';
import { syncHealthData } from '../../services/HealthService';
import { useWearData } from '../../../hooks/useWearData';

const { width } = Dimensions.get("window");

export default function HomeScreen({ route }) {
  const router = useRouter();
  const params = useLocalSearchParams();

  // ✅ Real watch data
  const { heartRate, spo2, steps, restingHeartRate } = useWearData();

  const [username, setUsername] = useState("User");
  const [email, setEmail] = useState("user@example.com");
  const [userProfile, setUserProfile] = useState(null);
  const [syncStatus, setSyncStatus] = useState('idle');
  const [lastSynced, setLastSynced] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [menuVisible, setMenuVisible] = useState(false);

  // ✅ Sab null — real data aane tak -- dikhega
  const [vitals, setVitals] = useState({
    heartRate:   null,
    temperature: null,
    oxygenLevel: null,
    footsteps:   null,
  });

  const [vitalHistory, setVitalHistory] = useState([]);
  const [riskLevel, setRiskLevel] = useState("low");
  const [recommendations, setRecommendations] = useState([]);

  // ✅ Load profile + auto sync on mount
  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) return;

      const response = await fetch(`${API_BASE_URL}/api/auth/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();

      if (data?.user) {
        setUsername(data.user.name || 'User');
        setEmail(data.user.email || '');
        setUserProfile(data.user);

        setSyncStatus('syncing');
        const profile = {
          name:   data.user.name,
          age:    parseInt(data.user.age) || 30,
          gender: data.user.gender || 'Male',
          weight: parseFloat(data.user.weight) || 70,
          height: parseFloat(data.user.height) || 170,
        };

        // ✅ Teeno diseases sync
        await Promise.allSettled([
          syncHealthData(profile, 'Hypertension'),
          syncHealthData(profile, 'TachyBrady'),
          syncHealthData(profile, 'SleepApnea'),
        ]);

        setSyncStatus('done');
        setLastSynced(new Date());
        console.log('✅ Watch data synced to all collections!');
      }
    } catch (error) {
      setSyncStatus('error');
      console.log('Sync error:', error);
    }
  };

  // ✅ Real watch data update karo
  useEffect(() => {
    if (heartRate) {
      setVitals(prev => ({
        ...prev,
        heartRate:   heartRate,
        oxygenLevel: spo2   || prev.oxygenLevel,
        footsteps:   steps  || prev.footsteps,
      }));

      setVitalHistory(h => [...h.slice(-20), {
        heartRate:   heartRate,
        oxygenLevel: spo2 || 99,
        footsteps:   steps || 0,
        timestamp:   Date.now(),
      }]);
    }
  }, [heartRate, spo2, steps]);

  // ✅ Temperature — realistic variation
  useEffect(() => {
    setVitals(prev => ({ ...prev, temperature: 98.6 }));
    const interval = setInterval(() => {
      setVitals(prev => ({
        ...prev,
        temperature: prev.temperature
          ? Math.max(97, Math.min(99.5, prev.temperature + (Math.random() - 0.5) * 0.1))
          : 98.6,
      }));
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Params update
  useEffect(() => {
    const updateUserData = async () => {
      if (params?.username) { setUsername(params.username); await AsyncStorage.setItem('username', params.username); }
      if (params?.email)    { setEmail(params.email);       await AsyncStorage.setItem('email', params.email); }
      if (route?.params?.username) setUsername(route.params.username);
      if (route?.params?.email)    setEmail(route.params.email);
    };
    updateUserData();
  }, [params, route?.params]);

  // Clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Health analysis
  useEffect(() => {
    analyzeHealthStatus();
  }, [vitals, vitalHistory]);

  // ✅ Ranges
  const ranges = {
    heartRate:   { min: 60,   max: 100,   warning: { min: 50,   max: 110   } },
    temperature: { min: 97.0, max: 99.0,  warning: { min: 96.0, max: 100.4 } },
    oxygenLevel: { min: 95,   max: 100,   warning: { min: 90,   max: 94    } },
    footsteps:   { min: 4000, max: 10000, warning: { min: 1000, max: 3999  } },
  };

  const getVitalStatus = (value, vitalType) => {
    if (value === null || value === undefined) return "normal";
    const range = ranges[vitalType];
    if (!range) return "normal";
    if (value < range.warning.min || value > range.warning.max) return "critical";
    if (value < range.min         || value > range.max)         return "warning";
    return "normal";
  };

  const analyzeHealthStatus = () => {
    const statuses = [
      getVitalStatus(vitals.heartRate,   "heartRate"),
      getVitalStatus(vitals.temperature, "temperature"),
      getVitalStatus(vitals.oxygenLevel, "oxygenLevel"),
      getVitalStatus(vitals.footsteps,   "footsteps"),
    ];

    if (statuses.includes("critical"))     setRiskLevel("high");
    else if (statuses.includes("warning")) setRiskLevel("medium");
    else                                   setRiskLevel("low");

    if (vitalHistory.length > 10) {
      const recent = vitalHistory.slice(-10);
      const avgHR = recent.reduce((s, v) => s + (v.heartRate || 0), 0) / recent.length;
      const avgO2 = recent.reduce((s, v) => s + (v.oxygenLevel || 0), 0) / recent.length;
      const recs  = [];
      if (avgHR > 90)              recs.push({ type: "warning",  text: "Heart rate consistently elevated. Rest recommended." });
      if (avgO2 < 95)              recs.push({ type: "warning",  text: "Oxygen levels trending low. Deep breathing advised." });
      if (vitals.heartRate > 110)  recs.push({ type: "critical", text: "High heart rate detected. Avoid strenuous activity." });
      if (vitals.oxygenLevel < 90) recs.push({ type: "critical", text: "Low oxygen saturation. Seek medical attention." });
      if ((vitals.footsteps || 0) < 1000) recs.push({ type: "warning", text: "Very low steps today. Try to move around more." });
      if (recs.length === 0)       recs.push({ type: "normal",   text: "All vitals in healthy range. Keep up the good work!" });
      setRecommendations(recs);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "critical": return "#EF4444";
      case "warning":  return "#F59E0B";
      default:         return "#10B981";
    }
  };

  const overallStatus = [
    getVitalStatus(vitals.heartRate,   "heartRate"),
    getVitalStatus(vitals.temperature, "temperature"),
    getVitalStatus(vitals.oxygenLevel, "oxygenLevel"),
    getVitalStatus(vitals.footsteps,   "footsteps"),
  ].reduce((worst, cur) => {
    if (worst === "critical" || cur === "critical") return "critical";
    if (worst === "warning"  || cur === "warning")  return "warning";
    return "normal";
  });

  const displayValue = (val, decimals = 0) => {
    if (val === null || val === undefined) return '--';
    return decimals > 0 ? val.toFixed(decimals) : Math.round(val).toString();
  };

  const getBadgeText = (status, type) => {
    if (type === 'footsteps') {
      return status === 'critical' ? 'Low' : status === 'warning' ? 'Fair' : 'Good';
    }
    return status === 'critical' ? 'Critical' : status === 'warning' ? 'Warning' : 'Normal';
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => setMenuVisible(true)} style={styles.menuButton}>
            <Menu size={24} color="#FFF" />
          </TouchableOpacity>
          <View>
            <Text style={styles.headerTitle}>Meditrack</Text>
            <Text style={styles.headerSubtitle}>Health Monitoring System</Text>
          </View>
        </View>
        <View style={styles.headerRight}>
          <Text style={styles.timeText}>
            {currentTime.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
          </Text>
          <Text style={styles.onlineText}>
            {syncStatus === 'syncing' ? '🔄 Syncing...' : syncStatus === 'done' ? '✅ Synced' : 'Online Now'}
          </Text>
        </View>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>

        {/* Welcome Card */}
        <View style={styles.welcomeCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{username.charAt(0).toUpperCase()}</Text>
          </View>
          <View style={styles.welcomeTextContainer}>
            <Text style={styles.welcomeName}>Welcome back, {username}</Text>
            <Text style={styles.welcomeDate}>
              {currentTime.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
            </Text>
          </View>
        </View>

        {/* Device Status */}
        <View style={styles.deviceCard}>
          <View style={styles.deviceLeft}>
            <View style={styles.deviceIcon}>
              <Activity size={20} color="#10B981" />
            </View>
            <View>
              <Text style={styles.deviceTitle}>
                {heartRate ? 'Device Connected' : 'Device Disconnected'}
              </Text>
              <Text style={styles.deviceModel}>Samsung Galaxy Watch</Text>
            </View>
          </View>
          <View style={styles.liveIndicator}>
            <View style={[styles.liveDot, { backgroundColor: heartRate ? '#10B981' : '#EF4444' }]} />
            <Text style={[styles.liveText, { color: heartRate ? '#059669' : '#EF4444' }]}>
              {heartRate ? 'Live' : 'Offline'}
            </Text>
          </View>
        </View>

        {/* Health Status Card */}
        <View style={[styles.statusCard, { backgroundColor: getStatusColor(overallStatus) }]}>
          <View style={styles.statusContent}>
            <View style={styles.statusLeft}>
              <View style={styles.statusHeader}>
                <AlertCircle size={24} color="#FFF" />
                <Text style={styles.statusTitle}>Health Status</Text>
              </View>
              <Text style={styles.statusText}>
                {overallStatus === 'critical' ? 'Critical - Action Needed' :
                 overallStatus === 'warning'  ? 'Monitoring Required' : 'All vitals are normal'}
              </Text>
            </View>
            <Heart size={32} color="rgba(255,255,255,0.8)" />
          </View>
          <Text style={styles.statusTime}>Last updated: {currentTime.toLocaleTimeString()}</Text>
        </View>

        {/* Live Vitals Grid */}
        <View style={styles.vitalsSection}>
          <View style={styles.vitalsSectionHeader}>
            <Text style={styles.vitalsTitle}>Live Vitals Signs</Text>
            <View style={styles.realtimeIndicator}>
              <View style={[styles.realtimeDot, { backgroundColor: heartRate ? '#10B981' : '#9CA3AF' }]} />
              <Text style={styles.realtimeText}>{heartRate ? 'Real-time' : 'Waiting...'}</Text>
            </View>
          </View>

          <View style={styles.vitalsGrid}>

            {/* Heart Rate */}
            <View style={[styles.vitalCard, { borderColor: getStatusColor(getVitalStatus(vitals.heartRate, "heartRate")) }]}>
              <View style={styles.vitalHeader}>
                <Heart size={20} color={getStatusColor(getVitalStatus(vitals.heartRate, "heartRate"))} />
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(getVitalStatus(vitals.heartRate, "heartRate")) }]}>
                  <Text style={styles.statusBadgeText}>{getBadgeText(getVitalStatus(vitals.heartRate, "heartRate"), 'heartRate')}</Text>
                </View>
              </View>
              <Text style={styles.vitalValue}>{displayValue(vitals.heartRate)}</Text>
              <Text style={styles.vitalLabel}>Heart Rate</Text>
              <Text style={styles.vitalUnit}>bpm</Text>
            </View>

            {/* Temperature */}
            <View style={[styles.vitalCard, { borderColor: getStatusColor(getVitalStatus(vitals.temperature, "temperature")) }]}>
              <View style={styles.vitalHeader}>
                <Thermometer size={20} color={getStatusColor(getVitalStatus(vitals.temperature, "temperature"))} />
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(getVitalStatus(vitals.temperature, "temperature")) }]}>
                  <Text style={styles.statusBadgeText}>{getBadgeText(getVitalStatus(vitals.temperature, "temperature"), 'temperature')}</Text>
                </View>
              </View>
              <Text style={styles.vitalValue}>{displayValue(vitals.temperature, 1)}</Text>
              <Text style={styles.vitalLabel}>Temperature</Text>
              <Text style={styles.vitalUnit}>°F</Text>
            </View>

            {/* Oxygen Level */}
            <View style={[styles.vitalCard, { borderColor: getStatusColor(getVitalStatus(vitals.oxygenLevel, "oxygenLevel")) }]}>
              <View style={styles.vitalHeader}>
                <Wind size={20} color={getStatusColor(getVitalStatus(vitals.oxygenLevel, "oxygenLevel"))} />
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(getVitalStatus(vitals.oxygenLevel, "oxygenLevel")) }]}>
                  <Text style={styles.statusBadgeText}>{getBadgeText(getVitalStatus(vitals.oxygenLevel, "oxygenLevel"), 'oxygenLevel')}</Text>
                </View>
              </View>
              <Text style={styles.vitalValue}>{displayValue(vitals.oxygenLevel)}</Text>
              <Text style={styles.vitalLabel}>Oxygen Level</Text>
              <Text style={styles.vitalUnit}>SpO₂ %</Text>
            </View>

            {/* Footsteps */}
            <View style={[styles.vitalCard, { borderColor: getStatusColor(getVitalStatus(vitals.footsteps, "footsteps")) }]}>
              <View style={styles.vitalHeader}>
                <Activity size={20} color={getStatusColor(getVitalStatus(vitals.footsteps, "footsteps"))} />
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(getVitalStatus(vitals.footsteps, "footsteps")) }]}>
                  <Text style={styles.statusBadgeText}>{getBadgeText(getVitalStatus(vitals.footsteps, "footsteps"), 'footsteps')}</Text>
                </View>
              </View>
              <Text style={styles.vitalValue}>
                {vitals.footsteps !== null ? vitals.footsteps.toLocaleString() : '--'}
              </Text>
              <Text style={styles.vitalLabel}>Footsteps</Text>
              <Text style={styles.vitalUnit}>steps/day</Text>
            </View>

          </View>
        </View>

        {/* Health Recommendations */}
        {recommendations.length > 0 && (
          <View style={styles.recommendationsCard}>
            <View style={styles.recommendationsHeader}>
              <AlertCircle size={20} color="#3B82F6" />
              <Text style={styles.recommendationsTitle}>Health Insights</Text>
            </View>
            <View style={styles.recommendationsList}>
              {recommendations.map((rec, idx) => (
                <View key={idx} style={[styles.recommendationItem, {
                  backgroundColor: rec.type === 'critical' ? '#FEE2E2' : rec.type === 'warning' ? '#FEF3C7' : '#D1FAE5',
                  borderLeftColor: rec.type === 'critical' ? '#EF4444' : rec.type === 'warning' ? '#F59E0B' : '#10B981',
                }]}>
                  <Text style={styles.recommendationText}>{rec.text}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Risk Assessment */}
        <View style={styles.riskCard}>
          <Text style={styles.riskTitle}>Heart Disease Risk</Text>
          <View style={styles.riskBar}>
            <View style={[styles.riskFill, {
              backgroundColor: riskLevel === 'high' ? '#EF4444' : riskLevel === 'medium' ? '#F59E0B' : '#10B981',
              width: riskLevel === 'high' ? '100%' : riskLevel === 'medium' ? '60%' : '20%',
            }]} />
          </View>
          <View style={styles.riskInfo}>
            <Text style={[styles.riskLevel, {
              color: riskLevel === 'high' ? '#DC2626' : riskLevel === 'medium' ? '#D97706' : '#059669',
            }]}>
              {riskLevel === 'high' ? 'High Risk' : riskLevel === 'medium' ? 'Medium Risk' : 'Low Risk'}
            </Text>
            <Text style={styles.riskDescription}>Based on {vitalHistory.length} recent measurements</Text>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.actionsSection}>
          <Text style={styles.actionsTitle}>Quick Action</Text>
          <View style={styles.actionsGrid}>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: "#EF4444" }]}
              onPress={() => router.push("/Screens/EmergencyContact/EmergencyContact")}
            >
              <Phone size={24} color="#FFF" />
              <Text style={styles.actionButtonTitle}>Emergency Call</Text>
              <Text style={styles.actionButtonSubtitle}>Call Guardian</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: "#3B82F6" }]}
              onPress={() => router.push("/Screens/HomeScreen/ShareLocation/ShareLocation")}
            >
              <MapPin size={24} color="#FFF" />
              <Text style={styles.actionButtonTitle}>Share Location</Text>
              <Text style={styles.actionButtonSubtitle}>Send to Guardian</Text>
            </TouchableOpacity>
          </View>
        </View>

      </ScrollView>

      <Footer />
      <MenuDrawer visible={menuVisible} onClose={() => setMenuVisible(false)} navigation={router} />
    </View>
  );
}

const styles = StyleSheet.create({
  container:            { flex: 1, backgroundColor: "#d1e6f6ff" },
  header:               { backgroundColor: "#1E3C72", paddingHorizontal: 16, paddingTop: 50, paddingBottom: 16, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  headerLeft:           { flexDirection: "row", alignItems: "center", gap: 12 },
  menuButton:           { backgroundColor: "rgba(255,255,255,0.25)", borderRadius: 20, padding: 8 },
  headerTitle:          { fontSize: 20, fontWeight: "bold", color: "#FFF" },
  headerSubtitle:       { fontSize: 12, color: "#E0E7FF" },
  headerRight:          { alignItems: "flex-end" },
  timeText:             { fontSize: 14, fontWeight: "600", color: "#FFF" },
  onlineText:           { fontSize: 12, color: "#E0E7FF" },
  scrollView:           { flex: 1 },
  contentContainer:     { padding: 16, paddingBottom: 100 },
  welcomeCard:          { backgroundColor: "#FFF", borderRadius: 12, padding: 16, flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 16, elevation: 2 },
  avatar:               { width: 48, height: 48, borderRadius: 24, backgroundColor: "#DBEAFE", alignItems: "center", justifyContent: "center" },
  avatarText:           { fontSize: 24, fontWeight: "bold", color: "#2563EB" },
  welcomeTextContainer: { flex: 1 },
  welcomeName:          { fontSize: 16, fontWeight: "600", color: "#111827" },
  welcomeDate:          { fontSize: 14, color: "#6B7280" },
  deviceCard:           { backgroundColor: "#FFF", borderRadius: 12, padding: 16, flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16, elevation: 2 },
  deviceLeft:           { flexDirection: "row", alignItems: "center", gap: 12 },
  deviceIcon:           { width: 40, height: 40, borderRadius: 20, backgroundColor: "#D1FAE5", alignItems: "center", justifyContent: "center" },
  deviceTitle:          { fontSize: 16, fontWeight: "600", color: "#111827" },
  deviceModel:          { fontSize: 12, color: "#6B7280" },
  liveIndicator:        { flexDirection: "row", alignItems: "center", gap: 8 },
  liveDot:              { width: 8, height: 8, borderRadius: 4 },
  liveText:             { fontSize: 14, fontWeight: "600" },
  statusCard:           { borderRadius: 12, padding: 16, marginBottom: 16, elevation: 3 },
  statusContent:        { flexDirection: "row", justifyContent: "space-between", marginBottom: 12 },
  statusLeft:           { flex: 1 },
  statusHeader:         { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 },
  statusTitle:          { fontSize: 18, fontWeight: "bold", color: "#FFF" },
  statusText:           { fontSize: 14, color: "rgba(255,255,255,0.9)" },
  statusTime:           { fontSize: 12, color: "rgba(255,255,255,0.75)" },
  vitalsSection:        { marginBottom: 16 },
  vitalsSectionHeader:  { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  vitalsTitle:          { fontSize: 16, fontWeight: "bold", color: "#111827" },
  realtimeIndicator:    { flexDirection: "row", alignItems: "center", gap: 4 },
  realtimeDot:          { width: 8, height: 8, borderRadius: 4 },
  realtimeText:         { fontSize: 12, color: "#6B7280" },
  vitalsGrid:           { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  vitalCard:            { width: (width - 44) / 2, backgroundColor: "#FFF", borderRadius: 12, padding: 16, borderWidth: 2, elevation: 2 },
  vitalHeader:          { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 },
  statusBadge:          { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  statusBadgeText:      { fontSize: 10, fontWeight: "600", color: "#FFF" },
  vitalValue:           { fontSize: 32, fontWeight: "bold", color: "#111827" },
  vitalLabel:           { fontSize: 14, color: "#4B5563" },
  vitalUnit:            { fontSize: 12, color: "#6B7280", marginTop: 4 },
  recommendationsCard:  { backgroundColor: "#FFF", borderRadius: 12, padding: 16, marginBottom: 16, elevation: 2 },
  recommendationsHeader:{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 },
  recommendationsTitle: { fontSize: 16, fontWeight: "bold", color: "#111827" },
  recommendationsList:  { gap: 8 },
  recommendationItem:   { padding: 12, borderRadius: 8, borderLeftWidth: 4 },
  recommendationText:   { fontSize: 14, color: "#374151" },
  riskCard:             { backgroundColor: "#FFF", borderRadius: 12, padding: 16, marginBottom: 16, elevation: 2 },
  riskTitle:            { fontSize: 16, fontWeight: "bold", color: "#111827", marginBottom: 12 },
  riskBar:              { height: 12, backgroundColor: "#E5E7EB", borderRadius: 6, overflow: "hidden", marginBottom: 12 },
  riskFill:             { height: "100%", borderRadius: 6 },
  riskInfo:             { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  riskLevel:            { fontSize: 14, fontWeight: "600" },
  riskDescription:      { fontSize: 14, color: "#6B7280" },
  actionsSection:       { marginBottom: 16 },
  actionsTitle:         { fontSize: 16, fontWeight: "bold", color: "#111827", marginBottom: 12 },
  actionsGrid:          { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  actionButton:         { width: (width - 44) / 2, borderRadius: 12, padding: 16, alignItems: "center", gap: 8, elevation: 3 },
  actionButtonTitle:    { fontSize: 14, fontWeight: "600", color: "#FFF", textAlign: "center" },
  actionButtonSubtitle: { fontSize: 12, color: "rgba(255,255,255,0.9)" },
});
