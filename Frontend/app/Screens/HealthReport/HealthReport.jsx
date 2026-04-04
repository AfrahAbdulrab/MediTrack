// Path: app/Screens/HealthReport/HealthReport.jsx

import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ChevronLeft,
  Heart,
  Thermometer,
  Wind,
  Activity,
  Footprints,
  Pill,
  Moon,
  TrendingUp,
  CheckCircle,
  Download,
  Share2,
  AlertTriangle,
} from "lucide-react-native";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import Footer from "../components/Footer";
import { getProfile } from "../../services/api";
import AsyncStorage from "@react-native-async-storage/async-storage";

// ─── API base ────────────────────────────────────────────────────────────────
const API_URL = "http://192.168.1.3:5000/api";

const getToken = async () => AsyncStorage.getItem("userToken");

// ─── Fetch helpers ────────────────────────────────────────────────────────────
const fetchLatestVitals = async () => {
  const token = await getToken();
  const res = await fetch(`${API_URL}/vitals/latest`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const json = await res.json();
  if (!json.success) throw new Error("Failed to fetch latest vitals");
  return json.data;
};

const fetchHistory = async (days = 10) => {
  const token = await getToken();
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(endDate.getDate() - days);
  const url = `${API_URL}/vitals/history?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}&limit=500`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const json = await res.json();
  if (!json.success) throw new Error("Failed to fetch history");
  return json.data; // array newest-first
};

const fetchStats = async () => {
  const token = await getToken();
  const res = await fetch(`${API_URL}/vitals/stats`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const json = await res.json();
  if (!json.success) throw new Error("Failed to fetch stats");
  return json.stats;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const avg = (arr, key) => {
  const vals = arr.map((r) => r[key] || 0).filter((v) => v > 0);
  if (!vals.length) return 0;
  return parseFloat((vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1));
};

const getStatusForHR = (v) => (v >= 60 && v <= 100 ? "Normal" : v < 60 ? "Low" : "High");
const getStatusForSpo2 = (v) => (v >= 95 ? "Normal" : v >= 90 ? "Warning" : "Critical");
const getStatusForTemp = (v) => {
  // stored as Celsius
  if (v >= 36.1 && v <= 37.2) return "Normal";
  if (v > 37.2 && v <= 38) return "Warning";
  if (v > 38) return "Critical";
  return "Low";
};
const celsiusToF = (c) => parseFloat(((c * 9) / 5 + 32).toFixed(1));

// Build hourly buckets from history array (last 24 readings grouped by hour)
const buildHourlyData = (history) => {
  const byHour = {};
  history.forEach((r) => {
    const h = new Date(r.timestamp).getHours();
    if (!byHour[h]) byHour[h] = [];
    byHour[h].push(r.heartRate || 0);
  });
  return Array.from({ length: 24 }, (_, i) => {
    const vals = byHour[i] || [];
    const value = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
    return { hour: i, value };
  });
};

// Build daily summary for 10-days view
const buildDailySummary = (history) => {
  const byDay = {};
  history.forEach((r) => {
    const d = new Date(r.timestamp).toLocaleDateString("en-US", { month: "short", day: "numeric" });
    if (!byDay[d]) byDay[d] = [];
    byDay[d].push(r);
  });
  return Object.entries(byDay)
    .map(([date, records]) => ({
      date,
      heartRate: avg(records, "heartRate"),
      bloodOxygen: avg(records, "bloodOxygen"),
      temperature: avg(records, "temperature"),
      footsteps: records.reduce((s, r) => s + (r.footsteps || 0), 0),
      normalCount: records.filter((r) => r.alertLevel === "normal").length,
      total: records.length,
    }))
    .reverse() // oldest first
    .slice(-10);
};

// Health score calculation (simple weighted)
const calcHealthScore = (readings) => {
  if (!readings.length) return 0;
  const normal = readings.filter((r) => r.alertLevel === "normal" || r.condition === "Normal").length;
  return Math.round((normal / readings.length) * 100);
};

// Key insights from 10-day data
const buildInsights = (history, stats) => {
  const insights = [];
  if (stats?.totalSteps > 0) {
    const dailyAvgSteps = Math.round(stats.totalSteps / 7);
    insights.push({
      id: 1,
      icon: Footprints,
      color: "#3B82F6",
      bgColor: "#DBEAFE",
      text: `Average daily steps: ${dailyAvgSteps.toLocaleString()}. ${dailyAvgSteps >= 8000 ? "Great activity level!" : "Try to reach 8,000 steps/day."}`,
    });
  }
  if (stats?.avgHeartRate) {
    insights.push({
      id: 2,
      icon: Heart,
      color: "#EF4444",
      bgColor: "#FEE2E2",
      text: `Average heart rate over past 7 days: ${stats.avgHeartRate} bpm — ${stats.avgHeartRate >= 60 && stats.avgHeartRate <= 100 ? "within healthy range." : "consult your doctor."}`,
    });
  }
  if (stats?.avgBloodOxygen) {
    insights.push({
      id: 3,
      icon: Wind,
      color: "#10B981",
      bgColor: "#D1FAE5",
      text: `Blood oxygen averaging ${stats.avgBloodOxygen}% — ${stats.avgBloodOxygen >= 95 ? "excellent saturation levels." : "slightly low, monitor closely."}`,
    });
  }
  return insights;
};

// ─── Status colors ────────────────────────────────────────────────────────────
const statusColor = (s) =>
  ({ Normal: "#10B981", Warning: "#F59E0B", Critical: "#EF4444", Low: "#F59E0B" }[s] || "#6B7280");
const statusBg = (s) =>
  ({ Normal: "#D1FAE5", Warning: "#FEF3C7", Critical: "#FEE2E2", Low: "#FEF3C7" }[s] || "#F3F4F6");

// ─── Main Component ───────────────────────────────────────────────────────────
export default function HealthReport({ navigation }) {
  const [selectedPeriod, setSelectedPeriod] = useState("24hour");
  const [isExporting, setIsExporting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Data state
  const [latestVitals, setLatestVitals] = useState(null);
  const [history24h, setHistory24h] = useState([]);
  const [history10d, setHistory10d] = useState([]);
  const [stats, setStats] = useState(null);
  const [profileData, setProfileData] = useState(null);
  const [hourlyData, setHourlyData] = useState([]);
  const [dailySummary, setDailySummary] = useState([]);
  const [insights, setInsights] = useState([]);

  const loadData = useCallback(async () => {
    try {
      const [latest, hist10d, st, profile] = await Promise.all([
        fetchLatestVitals().catch(() => null),
        fetchHistory(10).catch(() => []),
        fetchStats().catch(() => null),
        getProfile().catch(() => null),
      ]);

      // 24h subset from history
      const cutoff24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const hist24h = hist10d.filter((r) => new Date(r.timestamp) >= cutoff24h);

      setLatestVitals(latest);
      setHistory24h(hist24h);
      setHistory10d(hist10d);
      setStats(st);
      setProfileData(profile);
      setHourlyData(buildHourlyData(hist24h.length ? hist24h : hist10d.slice(0, 24)));
      setDailySummary(buildDailySummary(hist10d));
      setInsights(buildInsights(hist10d, st));
    } catch (e) {
      console.error("❌ HealthReport load error:", e);
      Alert.alert("Error", "Failed to load health data. Please try again.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  // ── Derived 24h values ──────────────────────────────────────────────────────
  const d24 = latestVitals || {};
  const hr24 = d24.heartRate || 0;
  const spo2_24 = d24.bloodOxygen || 0;
  const temp24C = d24.temperature || 0;
  const temp24F = temp24C ? celsiusToF(temp24C) : 0;
  const steps24 = history24h.reduce((s, r) => s + (r.footsteps || 0), 0);
  const healthScore24 = calcHealthScore(history24h);
  const alerts24 = history24h.filter((r) => r.alertLevel !== "normal").length;
  const dataPoints24 = history24h.length;

  // ── Derived 10d values ──────────────────────────────────────────────────────
  const avgHR10 = avg(history10d, "heartRate");
  const avgSpo2_10 = avg(history10d, "bloodOxygen");
  const avgTemp10C = avg(history10d, "temperature");
  const avgTemp10F = avgTemp10C ? celsiusToF(avgTemp10C) : 0;
  const totalSteps10 = history10d.reduce((s, r) => s + (r.footsteps || 0), 0);
  const healthScore10 = calcHealthScore(history10d);
  const totalAlerts10 = history10d.filter((r) => r.alertLevel !== "normal").length;
  const normalPct10 = history10d.length
    ? ((history10d.filter((r) => r.alertLevel === "normal").length / history10d.length) * 100).toFixed(1)
    : "0";
  const overallGrade = healthScore10 >= 90 ? "A+" : healthScore10 >= 80 ? "A" : healthScore10 >= 70 ? "B" : "C";

  // ── Hourly chart max for scaling ────────────────────────────────────────────
  const maxHR = Math.max(...hourlyData.map((d) => d.value || 0), 100);

  // ── PDF Export ──────────────────────────────────────────────────────────────
  const exportToPDF = async () => {
    try {
      setIsExporting(true);
      const currentDate = new Date().toLocaleDateString();
      const currentTime = new Date().toLocaleTimeString();
      const patientName = profileData?.fullName || profileData?.name || "Patient";
      const patientId = profileData?.patientId || "N/A";

      const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Health Report</title>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    body { font-family: Arial, sans-serif; padding:20px; background:#fff; color:#111827; }
    .header { text-align:center; border-bottom:3px solid #3B82F6; padding-bottom:20px; margin-bottom:30px; }
    .header h1 { color:#3B82F6; font-size:26px; margin-bottom:5px; }
    .header p { color:#6B7280; font-size:14px; }
    .patient-info { background:#F3F4F6; padding:15px; border-radius:8px; margin-bottom:30px; }
    .patient-info h3 { color:#111827; margin-bottom:10px; font-size:16px; }
    .info-row { display:flex; justify-content:space-between; margin:6px 0; }
    .info-label { color:#6B7280; font-size:13px; }
    .info-value { color:#111827; font-weight:600; font-size:13px; }
    .section { margin-bottom:30px; }
    .section-title { color:#111827; font-size:18px; font-weight:bold; margin-bottom:15px; padding-bottom:8px; border-bottom:2px solid #E5E7EB; }
    .vitals-grid { display:grid; grid-template-columns:repeat(2,1fr); gap:15px; margin-bottom:20px; }
    .vital-card { background:#F9FAFB; border:1px solid #E5E7EB; border-radius:8px; padding:15px; text-align:center; }
    .vital-card .label { color:#6B7280; font-size:12px; margin-bottom:6px; }
    .vital-card .value { color:#111827; font-size:22px; font-weight:bold; margin-bottom:6px; }
    .vital-card .status { display:inline-block; padding:3px 10px; border-radius:12px; font-size:11px; font-weight:600; background:#D1FAE5; color:#10B981; }
    .health-score { background:linear-gradient(135deg,#3B82F6,#2563EB); color:white; padding:20px; border-radius:12px; text-align:center; margin-top:20px; }
    .health-score .score { font-size:48px; font-weight:bold; margin:10px 0; }
    .stats-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:10px; margin-top:15px; text-align:center; }
    .stat-value { font-size:18px; font-weight:bold; }
    .stat-label { font-size:11px; opacity:0.8; margin-top:3px; }
    .disclaimer { background:#FEF3C7; padding:12px; border-radius:8px; margin-top:20px; border-left:4px solid #F59E0B; }
    .disclaimer p { color:#92400E; font-size:12px; line-height:1.5; }
    .footer { margin-top:30px; padding-top:15px; border-top:2px solid #E5E7EB; text-align:center; color:#6B7280; font-size:11px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>📊 Meditrack Health Report</h1>
    <p>24-Hour Health Monitoring Summary</p>
  </div>
  <div class="patient-info">
    <h3>Patient Information</h3>
    <div class="info-row"><span class="info-label">Patient Name:</span><span class="info-value">${patientName}</span></div>
    <div class="info-row"><span class="info-label">Patient ID:</span><span class="info-value">${patientId}</span></div>
    <div class="info-row"><span class="info-label">Report Date:</span><span class="info-value">${currentDate}</span></div>
    <div class="info-row"><span class="info-label">Report Time:</span><span class="info-value">${currentTime}</span></div>
    <div class="info-row"><span class="info-label">Blood Type:</span><span class="info-value">${profileData?.bloodType || "N/A"}</span></div>
  </div>
  <div class="section">
    <h2 class="section-title">📈 Vital Signs — Last 24 Hours</h2>
    <div class="vitals-grid">
      <div class="vital-card">
        <div class="label">❤️ Heart Rate</div>
        <div class="value">${hr24} <span style="font-size:13px">bpm</span></div>
        <span class="status">${getStatusForHR(hr24)}</span>
      </div>
      <div class="vital-card">
        <div class="label">🌡️ Temperature</div>
        <div class="value">${temp24F} <span style="font-size:13px">°F</span></div>
        <span class="status">${getStatusForTemp(temp24C)}</span>
      </div>
      <div class="vital-card">
        <div class="label">💨 Oxygen Level</div>
        <div class="value">${spo2_24} <span style="font-size:13px">%</span></div>
        <span class="status">${getStatusForSpo2(spo2_24)}</span>
      </div>
      <div class="vital-card">
        <div class="label">👟 Footsteps</div>
        <div class="value">${steps24.toLocaleString()}</div>
        <span class="status">${steps24 >= 8000 ? "Active" : "Moderate"}</span>
      </div>
    </div>
  </div>
  <div class="health-score">
    <h3>Health Score</h3>
    <div class="score">${healthScore24}<span style="font-size:18px">/100</span></div>
    <div class="stats-grid">
      <div><div class="stat-value">${dataPoints24}</div><div class="stat-label">Data Points</div></div>
      <div><div class="stat-value">${alerts24}</div><div class="stat-label">Alerts</div></div>
      <div><div class="stat-value">${alerts24 === 0 ? "100%" : Math.round(((dataPoints24 - alerts24) / Math.max(dataPoints24, 1)) * 100) + "%"}</div><div class="stat-label">Uptime</div></div>
    </div>
  </div>
  <div class="disclaimer">
    <p><strong>⚠️ Medical Disclaimer:</strong> This report is for informational purposes only. Consult your healthcare provider for medical decisions. Generated by Meditrack Health Monitoring System.</p>
  </div>
  <div class="footer">
    <p>© 2025 Meditrack Health Solutions | Generated on ${currentDate} at ${currentTime}</p>
  </div>
</body>
</html>`;

      const fileName = `Meditrack_Report_${Date.now()}.html`;
      const fileUri = `${FileSystem.documentDirectory}${fileName}`;
      await FileSystem.writeAsStringAsync(fileUri, htmlContent);

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          mimeType: "text/html",
          dialogTitle: "Share Health Report",
          UTI: "public.html",
        });
        Alert.alert("✅ Report Exported!", "Your health report has been exported successfully.");
      } else {
        Alert.alert("❌ Sharing Not Available", "Sharing is not available on this device.");
      }
    } catch (error) {
      console.error("Export error:", error);
      Alert.alert("❌ Export Failed", "Failed to export the report. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  // ── Loading state ───────────────────────────────────────────────────────────
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#E0E7FF" />
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation?.goBack()}>
            <ChevronLeft size={24} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Health Report</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={{ marginTop: 12, color: "#6B7280", fontSize: 15 }}>Loading health data...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#E0E7FF" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation?.goBack()}>
          <ChevronLeft size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Health Report</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#3B82F6"]} tintColor="#3B82F6" />}
      >
        {/* Period Selector */}
        <View style={styles.periodSelector}>
          <TouchableOpacity
            style={[styles.periodButton, selectedPeriod === "24hour" && styles.periodButtonActive]}
            onPress={() => setSelectedPeriod("24hour")}
          >
            <Text style={[styles.periodButtonText, selectedPeriod === "24hour" && styles.periodButtonTextActive]}>
              Last 24 Hours
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.periodButton, selectedPeriod === "10days" && styles.periodButtonActive]}
            onPress={() => setSelectedPeriod("10days")}
          >
            <Text style={[styles.periodButtonText, selectedPeriod === "10days" && styles.periodButtonTextActive]}>
              Last 10 Days
            </Text>
          </TouchableOpacity>
        </View>

        {/* ══════════════ 24 HOUR TAB ══════════════ */}
        {selectedPeriod === "24hour" && (
          <>
            {/* Export Button */}
            <View style={styles.exportContainer}>
              <TouchableOpacity style={styles.exportButton} onPress={exportToPDF} disabled={isExporting}>
                {isExporting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Download size={20} color="#FFFFFF" />
                    <Text style={styles.exportButtonText}>Export PDF Report</Text>
                    <Share2 size={18} color="#FFFFFF" />
                  </>
                )}
              </TouchableOpacity>
            </View>

            {/* 24h Summary */}
            <View style={styles.summaryCard}>
              <View style={styles.summaryHeader}>
                <Text style={styles.summaryTitle}>24-Hour Summary</Text>
                <View style={[styles.excellentBadge, { backgroundColor: healthScore24 >= 80 ? "#D1FAE5" : "#FEF3C7" }]}>
                  <Text style={[styles.excellentText, { color: healthScore24 >= 80 ? "#10B981" : "#F59E0B" }]}>
                    {healthScore24 >= 90 ? "Excellent" : healthScore24 >= 75 ? "Good" : "Fair"}
                  </Text>
                </View>
              </View>

              <View style={styles.vitalsGrid}>
                {[
                  { label: "Heart Rate", icon: Heart, value: hr24 ? `${hr24} bpm` : "N/A", status: hr24 ? getStatusForHR(hr24) : "N/A", color: "#EF4444" },
                  { label: "Temperature", icon: Thermometer, value: temp24F ? `${temp24F} °F` : "N/A", status: temp24C ? getStatusForTemp(temp24C) : "N/A", color: "#F59E0B" },
                  { label: "Oxygen Level", icon: Wind, value: spo2_24 ? `${spo2_24} %` : "N/A", status: spo2_24 ? getStatusForSpo2(spo2_24) : "N/A", color: "#3B82F6" },
                  { label: "Footsteps", icon: Footprints, value: steps24.toLocaleString(), status: steps24 >= 8000 ? "Active" : "Moderate", color: "#10B981" },
                ].map((item, idx) => {
                  const Icon = item.icon;
                  return (
                    <View key={idx} style={styles.vitalBox}>
                      <View style={[styles.vitalIconContainer, { backgroundColor: item.color + "20" }]}>
                        <Icon size={20} color={item.color} />
                      </View>
                      <View style={[styles.statusBadge, { backgroundColor: statusBg(item.status) }]}>
                        <Text style={[styles.statusText, { color: statusColor(item.status) }]}>{item.status}</Text>
                      </View>
                      <Text style={styles.vitalLabel}>{item.label}</Text>
                      <Text style={styles.vitalValue}>{item.value}</Text>
                    </View>
                  );
                })}
              </View>
            </View>

            {/* Hourly Trends */}
            <View style={styles.trendsCard}>
              <Text style={styles.trendsTitle}>Hourly Trends</Text>
              <View style={styles.trendRow}>
                <Text style={styles.trendLabel}>Heart Rate variation (24h)</Text>
                <Text style={[styles.trendStatus, { color: statusColor(getStatusForHR(hr24)) }]}>
                  {hr24 ? getStatusForHR(hr24) : "N/A"}
                </Text>
              </View>
              <View style={styles.graphContainer}>
                <View style={styles.graph}>
                  {hourlyData.map((point, i) => {
                    const height = point.value ? Math.max(4, (point.value / maxHR) * 100) : 4;
                    const hasData = !!point.value;
                    return (
                      <View key={i} style={{ alignItems: "center", flex: 1 }}>
                        <View
                          style={[
                            styles.graphBar,
                            {
                              height: `${height}%`,
                              backgroundColor: hasData ? (point.value > 100 ? "#EF4444" : "#3B82F6") : "#E5E7EB",
                            },
                          ]}
                        />
                      </View>
                    );
                  })}
                </View>
                <View style={styles.graphLabels}>
                  {[0, 6, 12, 18, 23].map((h) => (
                    <Text key={h} style={styles.graphLabel}>
                      {h === 0 ? "12am" : h === 6 ? "6am" : h === 12 ? "12pm" : h === 18 ? "6pm" : "11pm"}
                    </Text>
                  ))}
                </View>
              </View>
              {/* HR range info */}
              {history24h.length > 0 && (
                <View style={styles.hrRangeRow}>
                  <Text style={styles.hrRangeLabel}>Min: <Text style={styles.hrRangeVal}>{Math.min(...history24h.map((r) => r.heartRate || 999))} bpm</Text></Text>
                  <Text style={styles.hrRangeLabel}>Avg: <Text style={styles.hrRangeVal}>{avg(history24h, "heartRate")} bpm</Text></Text>
                  <Text style={styles.hrRangeLabel}>Max: <Text style={styles.hrRangeVal}>{Math.max(...history24h.map((r) => r.heartRate || 0))} bpm</Text></Text>
                </View>
              )}
            </View>

            {/* Health Score */}
            <View style={styles.healthScoreCard}>
              <View style={styles.scoreHeader}>
                <View>
                  <Text style={styles.scoreTitle}>Health Score</Text>
                  <Text style={styles.scoreSubtitle}>Last 24-hour performance</Text>
                </View>
                <View style={styles.scoreCircle}>
                  <Text style={styles.scoreValue}>{healthScore24}</Text>
                  <Text style={styles.scoreMax}>out of 100</Text>
                </View>
              </View>
              <View style={styles.scoreStats}>
                <View style={styles.scoreStat}>
                  <Text style={styles.scoreStatValue}>{dataPoints24}</Text>
                  <Text style={styles.scoreStatLabel}>Data Points</Text>
                </View>
                <View style={styles.scoreStatDivider} />
                <View style={styles.scoreStat}>
                  <Text style={styles.scoreStatValue}>{alerts24}</Text>
                  <Text style={styles.scoreStatLabel}>Alerts</Text>
                </View>
                <View style={styles.scoreStatDivider} />
                <View style={styles.scoreStat}>
                  <Text style={styles.scoreStatValue}>
                    {dataPoints24 > 0 ? Math.round(((dataPoints24 - alerts24) / dataPoints24) * 100) + "%" : "N/A"}
                  </Text>
                  <Text style={styles.scoreStatLabel}>Uptime</Text>
                </View>
              </View>
            </View>
          </>
        )}

        {/* ══════════════ 10 DAYS TAB ══════════════ */}
        {selectedPeriod === "10days" && (
          <>
            {/* 10-Day Overview */}
            <View style={styles.summaryCard}>
              <View style={styles.summaryHeader}>
                <Text style={styles.summaryTitle}>10-Day Overview</Text>
                <Text style={styles.asOfText}>Last 10 days</Text>
              </View>
              <View style={styles.vitalsGrid}>
                {[
                  { label: "Heart Rate", icon: Heart, value: avgHR10 ? `${avgHR10} bpm` : "N/A", status: avgHR10 ? getStatusForHR(avgHR10) : "N/A", color: "#EF4444" },
                  { label: "Temperature", icon: Thermometer, value: avgTemp10F ? `${avgTemp10F} °F` : "N/A", status: avgTemp10C ? getStatusForTemp(avgTemp10C) : "N/A", color: "#F59E0B" },
                  { label: "Oxygen Level", icon: Wind, value: avgSpo2_10 ? `${avgSpo2_10} %` : "N/A", status: avgSpo2_10 ? getStatusForSpo2(avgSpo2_10) : "N/A", color: "#3B82F6" },
                  { label: "Avg Daily Steps", icon: Footprints, value: history10d.length ? Math.round(totalSteps10 / Math.max(dailySummary.length, 1)).toLocaleString() : "N/A", status: totalSteps10 / Math.max(dailySummary.length, 1) >= 8000 ? "Active" : "Moderate", color: "#10B981" },
                ].map((item, idx) => {
                  const Icon = item.icon;
                  return (
                    <View key={idx} style={styles.vitalBox}>
                      <View style={[styles.vitalIconContainer, { backgroundColor: item.color + "20" }]}>
                        <Icon size={20} color={item.color} />
                      </View>
                      <View style={[styles.statusBadge, { backgroundColor: statusBg(item.status) }]}>
                        <Text style={[styles.statusText, { color: statusColor(item.status) }]}>{item.status}</Text>
                      </View>
                      <Text style={styles.vitalLabel}>{item.label}</Text>
                      <Text style={styles.vitalValue}>{item.value}</Text>
                    </View>
                  );
                })}
              </View>
            </View>

            {/* Weekly / Daily Comparison */}
            <View style={styles.monthlyCard}>
              <Text style={styles.monthlyTitle}>Daily Comparison (10 Days)</Text>
              {dailySummary.length === 0 ? (
                <Text style={{ color: "#6B7280", textAlign: "center", paddingVertical: 16 }}>No data available</Text>
              ) : (
                dailySummary.map((day, i) => {
                  const pct = Math.min((day.heartRate / 120) * 100, 100);
                  return (
                    <View key={i} style={styles.monthRow}>
                      <Text style={styles.monthName}>{day.date}</Text>
                      <View style={styles.monthScoreContainer}>
                        <View style={styles.progressBar}>
                          <View style={[styles.progressFill, { width: `${pct}%`, backgroundColor: day.heartRate > 100 ? "#EF4444" : "#3B82F6" }]} />
                        </View>
                        <Text style={styles.monthScore}>{day.heartRate ? `${day.heartRate} bpm` : "N/A"}</Text>
                      </View>
                    </View>
                  );
                })
              )}
            </View>

            {/* Key Insights */}
            <View style={styles.insightsCard}>
              <Text style={styles.insightsTitle}>Key Insights</Text>
              {insights.length === 0 ? (
                <Text style={{ color: "#6B7280", textAlign: "center", paddingVertical: 12 }}>Not enough data for insights</Text>
              ) : (
                insights.map((item) => {
                  const Icon = item.icon;
                  return (
                    <View key={item.id} style={[styles.insightItem, { backgroundColor: item.bgColor }]}>
                      <View style={[styles.insightIconContainer, { backgroundColor: item.color + "30" }]}>
                        <Icon size={18} color={item.color} />
                      </View>
                      <Text style={styles.insightText}>{item.text}</Text>
                    </View>
                  );
                })
              )}
            </View>

            {/* 10-Day Stats */}
            <View style={styles.statsCard}>
              <View style={styles.statsGrid}>
                <View style={styles.statBox}>
                  <Text style={styles.statValue}>{dailySummary.length}</Text>
                  <Text style={styles.statLabel}>Days Tracked</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.statValue}>{normalPct10}%</Text>
                  <Text style={styles.statLabel}>Normal Readings</Text>
                </View>
              </View>
              <View style={styles.statsGrid}>
                <View style={styles.statBox}>
                  <Text style={styles.statValue}>{totalAlerts10}</Text>
                  <Text style={styles.statLabel}>Total Alerts</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.statValue}>{history10d.length}</Text>
                  <Text style={styles.statLabel}>Data Points</Text>
                </View>
              </View>
              <View style={styles.statsGrid}>
                <View style={styles.statBox}>
                  <Text style={styles.statValue}>{totalSteps10.toLocaleString()}</Text>
                  <Text style={styles.statLabel}>Total Steps</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.statValue}>{stats?.avgRiskScore ? `${stats.avgRiskScore}%` : "N/A"}</Text>
                  <Text style={styles.statLabel}>Avg Risk Score</Text>
                </View>
              </View>
            </View>

            {/* Overall Health */}
            <View style={styles.overallHealthCard}>
              <View style={styles.overallHeader}>
                <View style={styles.overallInfo}>
                  <Text style={styles.overallTitle}>Overall Health Status</Text>
                  <Text style={styles.overallSubtitle}>10-day performance</Text>
                </View>
                <View style={[styles.gradeCircle, { backgroundColor: healthScore10 >= 80 ? "#10B981" : "#F59E0B" }]}>
                  <Text style={styles.gradeText}>{overallGrade}</Text>
                  <Text style={styles.gradeLabel}>{healthScore10 >= 90 ? "Excellent" : healthScore10 >= 75 ? "Good" : "Fair"}</Text>
                </View>
              </View>
              <Text style={styles.overallDescription}>
                {healthScore10 >= 90
                  ? "Your health data shows consistently excellent performance over the last 10 days. Keep up the great habits!"
                  : healthScore10 >= 75
                  ? "Your health data looks good overall. A few alerts detected — keep monitoring your vitals."
                  : "Some irregular readings detected in the last 10 days. Consider consulting your healthcare provider."}
              </Text>
            </View>
          </>
        )}
      </ScrollView>
      <Footer />
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#E0E7FF" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12, backgroundColor: "#E0E7FF" },
  backButton: { width: 40, height: 40, justifyContent: "center", alignItems: "center" },
  headerTitle: { fontSize: 18, fontWeight: "bold", color: "#111827" },
  placeholder: { width: 40 },
  scrollView: { flex: 1 },

  periodSelector: { flexDirection: "row", gap: 12, paddingHorizontal: 16, paddingTop: 16, marginBottom: 16 },
  periodButton: { flex: 1, paddingVertical: 10, borderRadius: 8, backgroundColor: "#FFFFFF", alignItems: "center", borderWidth: 1, borderColor: "#E5E7EB" },
  periodButtonActive: { backgroundColor: "#3B82F6", borderColor: "#3B82F6" },
  periodButtonText: { fontSize: 14, fontWeight: "600", color: "#6B7280" },
  periodButtonTextActive: { color: "#FFFFFF" },

  exportContainer: { paddingHorizontal: 16, marginBottom: 16 },
  exportButton: { backgroundColor: "#10B981", flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 14, borderRadius: 12, gap: 8, elevation: 4 },
  exportButtonText: { color: "#FFFFFF", fontSize: 16, fontWeight: "bold" },

  summaryCard: { backgroundColor: "#FFFFFF", borderRadius: 16, padding: 16, marginHorizontal: 16, marginBottom: 16, elevation: 2 },
  summaryHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  summaryTitle: { fontSize: 18, fontWeight: "bold", color: "#111827" },
  excellentBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
  excellentText: { fontSize: 12, fontWeight: "600" },
  asOfText: { fontSize: 12, color: "#6B7280" },

  vitalsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  vitalBox: { width: "47%", backgroundColor: "#F9FAFB", borderRadius: 12, padding: 12, alignItems: "center" },
  vitalIconContainer: { width: 40, height: 40, borderRadius: 20, justifyContent: "center", alignItems: "center", marginBottom: 8 },
  statusBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2, marginBottom: 6 },
  statusText: { fontSize: 12, fontWeight: "600" },
  vitalLabel: { fontSize: 13, color: "#6B7280", marginBottom: 2, textAlign: "center" },
  vitalValue: { fontSize: 15, fontWeight: "bold", color: "#111827", textAlign: "center" },

  trendsCard: { backgroundColor: "#FFFFFF", borderRadius: 16, padding: 16, marginHorizontal: 16, marginBottom: 16, elevation: 2 },
  trendsTitle: { fontSize: 18, fontWeight: "bold", color: "#111827", marginBottom: 12 },
  trendRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
  trendLabel: { fontSize: 14, color: "#6B7280" },
  trendStatus: { fontSize: 14, fontWeight: "600" },
  graphContainer: { height: 110, marginTop: 8 },
  graph: { flexDirection: "row", alignItems: "flex-end", height: "85%" },
  graphBar: { borderRadius: 2, marginHorizontal: 1 },
  graphLabels: { flexDirection: "row", justifyContent: "space-between", marginTop: 4 },
  graphLabel: { fontSize: 10, color: "#9CA3AF" },
  hrRangeRow: { flexDirection: "row", justifyContent: "space-around", marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: "#F3F4F6" },
  hrRangeLabel: { fontSize: 12, color: "#6B7280" },
  hrRangeVal: { fontWeight: "700", color: "#111827" },

  healthScoreCard: { backgroundColor: "#3B82F6", borderRadius: 16, padding: 16, marginHorizontal: 16, marginBottom: 16 },
  scoreHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  scoreTitle: { fontSize: 18, fontWeight: "bold", color: "#FFFFFF" },
  scoreSubtitle: { fontSize: 12, color: "rgba(255,255,255,0.8)" },
  scoreCircle: { width: 70, height: 70, borderRadius: 35, backgroundColor: "rgba(255,255,255,0.2)", justifyContent: "center", alignItems: "center" },
  scoreValue: { fontSize: 24, fontWeight: "bold", color: "#FFFFFF" },
  scoreMax: { fontSize: 10, color: "rgba(255,255,255,0.8)" },
  scoreStats: { flexDirection: "row", justifyContent: "space-around", alignItems: "center" },
  scoreStat: { alignItems: "center" },
  scoreStatValue: { fontSize: 14, fontWeight: "600", color: "#FFFFFF" },
  scoreStatLabel: { fontSize: 11, color: "rgba(255,255,255,0.8)", textAlign: "center" },
  scoreStatDivider: { width: 1, height: 20, backgroundColor: "rgba(255,255,255,0.3)" },

  monthlyCard: { backgroundColor: "#FFFFFF", borderRadius: 16, padding: 16, marginHorizontal: 16, marginBottom: 16, elevation: 2 },
  monthlyTitle: { fontSize: 18, fontWeight: "bold", color: "#111827", marginBottom: 12 },
  monthRow: { marginBottom: 12 },
  monthName: { fontSize: 13, color: "#6B7280", marginBottom: 4 },
  monthScoreContainer: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  progressBar: { flex: 1, height: 8, backgroundColor: "#E5E7EB", borderRadius: 4, marginRight: 8 },
  progressFill: { height: "100%", borderRadius: 4 },
  monthScore: { fontSize: 12, fontWeight: "600", color: "#111827", minWidth: 55, textAlign: "right" },

  insightsCard: { backgroundColor: "#FFFFFF", borderRadius: 16, padding: 16, marginHorizontal: 16, marginBottom: 16, elevation: 2 },
  insightsTitle: { fontSize: 18, fontWeight: "bold", color: "#111827", marginBottom: 12 },
  insightItem: { flexDirection: "row", alignItems: "center", borderRadius: 12, padding: 12, marginBottom: 10 },
  insightIconContainer: { width: 32, height: 32, borderRadius: 16, justifyContent: "center", alignItems: "center", marginRight: 12 },
  insightText: { flex: 1, fontSize: 14, color: "#111827", lineHeight: 20 },

  statsCard: { backgroundColor: "#FFFFFF", borderRadius: 16, padding: 16, marginHorizontal: 16, marginBottom: 16, elevation: 2 },
  statsGrid: { flexDirection: "row", justifyContent: "space-between", marginBottom: 12 },
  statBox: { flex: 1, alignItems: "center" },
  statValue: { fontSize: 18, fontWeight: "bold", color: "#111827" },
  statLabel: { fontSize: 12, color: "#6B7280", textAlign: "center" },

  overallHealthCard: { backgroundColor: "#FFFFFF", borderRadius: 16, padding: 16, marginHorizontal: 16, marginBottom: 16, elevation: 2 },
  overallHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  overallInfo: { flex: 1 },
  overallTitle: { fontSize: 18, fontWeight: "bold", color: "#111827" },
  overallSubtitle: { fontSize: 12, color: "#6B7280" },
  gradeCircle: { width: 60, height: 60, borderRadius: 30, justifyContent: "center", alignItems: "center" },
  gradeText: { fontSize: 22, fontWeight: "bold", color: "#FFFFFF" },
  gradeLabel: { fontSize: 9, color: "rgba(255,255,255,0.9)" },
  overallDescription: { fontSize: 14, color: "#374151", lineHeight: 20 },
});
