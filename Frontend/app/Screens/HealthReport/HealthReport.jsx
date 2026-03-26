// Path: app/screens/HealthReport/HealthReport.jsx

// screens/HealthReport.js
import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Alert,
  Platform,
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
} from "lucide-react-native";
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import Footer from "../components/Footer";

export default function HealthReport({ navigation }) {
  const [selectedPeriod, setSelectedPeriod] = useState("24hour");
  const [isExporting, setIsExporting] = useState(false);

  const reportData24h = {
    heartRate: { value: 74, status: "Normal" },
    temperature: { value: 98.6, status: "Normal" },
    oxygenLevel: { value: 99, status: "Normal" },
    ecgReading: { value: 99, status: "Normal" },
  };

  const reportData3m = {
    asOf: "Jan-Mar 2025",
    heartRate: { value: 72, status: "Normal" },
    temperature: { value: 98.4, status: "Normal" },
    oxygenLevel: { value: 98, status: "Normal" },
    ecgReading: { value: 97, status: "Normal" },
  };

  const [activityLog] = useState([
    { id: 1, icon: Activity, color: "#10B981", title: "All vitals normal", time: "2 hours ago" },
    { id: 2, icon: Footprints, color: "#3B82F6", title: "Exercise detected: 30 min walk", time: "5 hours ago" },
    { id: 3, icon: Pill, color: "#F59E0B", title: "Medication taken: Vitamins", time: "8 hours ago" },
    { id: 4, icon: Moon, color: "#8B5CF6", title: "Sleep Cycle: 7.5 hours", time: "12 hours ago" },
  ]);

  const [healthScore24h] = useState({
    score: 94,
    performance: "Last 24-hour performance",
    dataPoints: 1024,
    alerts: 0,
    uptime: "100%",
  });

  const [monthlyComparison] = useState([
    { month: "January 2025", score: 92, total: 100 },
    { month: "February 2025", score: 93, total: 100 },
    { month: "March 2025", score: 94, total: 100 },
  ]);

  const [keyInsights] = useState([
    { id: 1, icon: Moon, color: "#10B981", bgColor: "#D1FAE5", text: "Your sleep trend has increased by 5 over past 2 month" },
    { id: 2, icon: TrendingUp, color: "#8B5CF6", bgColor: "#EDE9FE", text: "Regular Exercise: An Increase in the average by 10% in readings" },
    { id: 3, icon: CheckCircle, color: "#3B82F6", bgColor: "#DBEAFE", text: "Consistent Heart Rate: Your heart rate remaining within the healthy" },
  ]);

  const [stats3m] = useState({
    totalDays: 127,
    normalReadings: "98.2%",
    totalAlerts: "73,388",
    dataPoints: "Data Points",
  });

  const [overallHealth] = useState({
    title: "Overall Health Status",
    subtitle: "3-month performance",
    grade: "A",
    description: "Your health status show consistent performance. Keep up the healthy habits!",
  });

  const generateHeartRateData = () => {
    return Array.from({ length: 24 }, (_, i) => ({
      hour: i,
      value: 65 + Math.random() * 20,
    }));
  };

  const [heartRateData] = useState(generateHeartRateData());

  // PDF Export Function
  const exportToPDF = async () => {
    try {
      setIsExporting(true);

      const currentDate = new Date().toLocaleDateString();
      const currentTime = new Date().toLocaleTimeString();

      // Create HTML content for PDF
      const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Health Report - 24 Hours</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Arial, sans-serif; padding: 20px; background: #fff; color: #111827; }
    .header { text-align: center; border-bottom: 3px solid #3B82F6; padding-bottom: 20px; margin-bottom: 30px; }
    .header h1 { color: #3B82F6; font-size: 28px; margin-bottom: 5px; }
    .header p { color: #6B7280; font-size: 14px; }
    .patient-info { background: #F3F4F6; padding: 15px; border-radius: 8px; margin-bottom: 30px; }
    .patient-info h3 { color: #111827; margin-bottom: 10px; }
    .info-row { display: flex; justify-content: space-between; margin: 8px 0; }
    .info-label { color: #6B7280; font-size: 14px; }
    .info-value { color: #111827; font-weight: 600; font-size: 14px; }
    .section { margin-bottom: 30px; }
    .section-title { color: #111827; font-size: 20px; font-weight: bold; margin-bottom: 15px; padding-bottom: 10px; border-bottom: 2px solid #E5E7EB; }
    .vitals-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin-bottom: 20px; }
    .vital-card { background: #F9FAFB; border: 1px solid #E5E7EB; border-radius: 8px; padding: 15px; text-align: center; }
    .vital-card .label { color: #6B7280; font-size: 12px; margin-bottom: 8px; }
    .vital-card .value { color: #111827; font-size: 24px; font-weight: bold; margin-bottom: 8px; }
    .vital-card .status { display: inline-block; padding: 4px 12px; border-radius: 12px; font-size: 11px; font-weight: 600; }
    .status-normal { background: #D1FAE5; color: #10B981; }
    .status-warning { background: #FEF3C7; color: #F59E0B; }
    .status-critical { background: #FEE2E2; color: #EF4444; }
    .activity-log { margin-top: 20px; }
    .activity-item { background: #F9FAFB; padding: 12px; margin-bottom: 10px; border-radius: 8px; border-left: 4px solid #3B82F6; }
    .activity-title { color: #111827; font-size: 14px; font-weight: 600; margin-bottom: 4px; }
    .activity-time { color: #6B7280; font-size: 12px; }
    .health-score { background: linear-gradient(135deg, #3B82F6 0%, #2563EB 100%); color: white; padding: 20px; border-radius: 12px; text-align: center; margin-top: 20px; }
    .health-score h3 { font-size: 18px; margin-bottom: 10px; }
    .health-score .score { font-size: 48px; font-weight: bold; margin: 15px 0; }
    .health-score .score-label { font-size: 14px; opacity: 0.9; }
    .stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin-top: 15px; text-align: center; }
    .stat-box { padding: 10px; }
    .stat-value { font-size: 18px; font-weight: bold; color: white; }
    .stat-label { font-size: 11px; color: rgba(255,255,255,0.8); margin-top: 4px; }
    .footer { margin-top: 40px; padding-top: 20px; border-top: 2px solid #E5E7EB; text-align: center; color: #6B7280; font-size: 12px; }
    .disclaimer { background: #FEF3C7; padding: 15px; border-radius: 8px; margin-top: 20px; border-left: 4px solid #F59E0B; }
    .disclaimer p { color: #92400E; font-size: 12px; line-height: 1.5; }
  </style>
</head>
<body>
  <div class="header">
    <h1>📊 Meditrack Health Report</h1>
    <p>24-Hour Health Monitoring Summary</p>
  </div>

  <div class="patient-info">
    <h3>Patient Information</h3>
    <div class="info-row">
      <span class="info-label">Patient Name:</span>
      <span class="info-value">Bahisht Khan</span>
    </div>
    <div class="info-row">
      <span class="info-label">Patient ID:</span>
      <span class="info-value">PW4702-04-001</span>
    </div>
    <div class="info-row">
      <span class="info-label">Report Date:</span>
      <span class="info-value">${currentDate}</span>
    </div>
    <div class="info-row">
      <span class="info-label">Report Time:</span>
      <span class="info-value">${currentTime}</span>
    </div>
    <div class="info-row">
      <span class="info-label">Device:</span>
      <span class="info-value">Meditrack W4704</span>
    </div>
  </div>

  <div class="section">
    <h2 class="section-title">📈 Vital Signs Summary</h2>
    <div class="vitals-grid">
      <div class="vital-card">
        <div class="label">❤️ Heart Rate</div>
        <div class="value">${reportData24h.heartRate.value} <span style="font-size:14px;">bpm</span></div>
        <span class="status status-normal">${reportData24h.heartRate.status}</span>
      </div>
      <div class="vital-card">
        <div class="label">🌡️ Temperature</div>
        <div class="value">${reportData24h.temperature.value} <span style="font-size:14px;">°F</span></div>
        <span class="status status-normal">${reportData24h.temperature.status}</span>
      </div>
      <div class="vital-card">
        <div class="label">💨 Oxygen Level</div>
        <div class="value">${reportData24h.oxygenLevel.value} <span style="font-size:14px;">%</span></div>
        <span class="status status-normal">${reportData24h.oxygenLevel.status}</span>
      </div>
      <div class="vital-card">
        <div class="label">📊 ECG Reading</div>
        <div class="value">${reportData24h.ecgReading.value} <span style="font-size:14px;">%</span></div>
        <span class="status status-normal">${reportData24h.ecgReading.status}</span>
      </div>
    </div>
  </div>

  <div class="section">
    <h2 class="section-title">📝 Activity Log</h2>
    <div class="activity-log">
      ${activityLog.map(act => `
        <div class="activity-item">
          <div class="activity-title">${act.title}</div>
          <div class="activity-time">${act.time}</div>
        </div>
      `).join('')}
    </div>
  </div>

  <div class="health-score">
    <h3>Health Score</h3>
    <div class="score">${healthScore24h.score}<span style="font-size:20px;">/100</span></div>
    <div class="score-label">${healthScore24h.performance}</div>
    <div class="stats-grid">
      <div class="stat-box">
        <div class="stat-value">${healthScore24h.dataPoints.toLocaleString()}</div>
        <div class="stat-label">Data Points</div>
      </div>
      <div class="stat-box">
        <div class="stat-value">${healthScore24h.alerts}</div>
        <div class="stat-label">Alerts</div>
      </div>
      <div class="stat-box">
        <div class="stat-value">${healthScore24h.uptime}</div>
        <div class="stat-label">Uptime</div>
      </div>
    </div>
  </div>

  <div class="disclaimer">
    <p><strong>⚠️ Medical Disclaimer:</strong> This report is for informational purposes only and should not replace professional medical advice. Consult your healthcare provider for medical decisions. Generated by Meditrack Health Monitoring System.</p>
  </div>

  <div class="footer">
    <p>© 2024 Meditrack Health Solutions | All Rights Reserved</p>
    <p>Generated on: ${currentDate} at ${currentTime}</p>
  </div>
</body>
</html>
      `;

      // Create file path
      const fileName = `Meditrack_Health_Report_${Date.now()}.html`;
      const fileUri = `${FileSystem.documentDirectory}${fileName}`;

      // Write HTML file
      await FileSystem.writeAsStringAsync(fileUri, htmlContent);

      // Share the file
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'text/html',
          dialogTitle: 'Share Health Report',
          UTI: 'public.html',
        });
        
        Alert.alert(
          "✅ Report Exported!",
          "Your health report has been exported successfully. You can now share it with your doctor.",
          [{ text: "OK" }]
        );
      } else {
        Alert.alert(
          "❌ Sharing Not Available",
          "Sharing is not available on this device.",
          [{ text: "OK" }]
        );
      }

    } catch (error) {
      console.error("Error exporting PDF:", error);
      Alert.alert(
        "❌ Export Failed",
        "Failed to export the report. Please try again.",
        [{ text: "OK" }]
      );
    } finally {
      setIsExporting(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case "normal":
        return "#10B981";
      case "warning":
        return "#F59E0B";
      case "critical":
        return "#EF4444";
      default:
        return "#6B7280";
    }
  };

  const getStatusBgColor = (status) => {
    switch (status.toLowerCase()) {
      case "normal":
        return "#D1FAE5";
      case "warning":
        return "#FEF3C7";
      case "critical":
        return "#FEE2E2";
      default:
        return "#F3F4F6";
    }
  };

  const reportData = selectedPeriod === "24hour" ? reportData24h : reportData3m;

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

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Period Selector */}
        <View style={styles.periodSelector}>
          <TouchableOpacity
            style={[styles.periodButton, selectedPeriod === "24hour" && styles.periodButtonActive]}
            onPress={() => setSelectedPeriod("24hour")}
          >
            <Text style={[styles.periodButtonText, selectedPeriod === "24hour" && styles.periodButtonTextActive]}>
              Last 24 Hour
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.periodButton, selectedPeriod === "3month" && styles.periodButtonActive]}
            onPress={() => setSelectedPeriod("3month")}
          >
            <Text style={[styles.periodButtonText, selectedPeriod === "3month" && styles.periodButtonTextActive]}>
              Last 3 Month
            </Text>
          </TouchableOpacity>
        </View>

        {/* Export PDF Button - Only show for 24 hour */}
        {selectedPeriod === "24hour" && (
          <View style={styles.exportContainer}>
            <TouchableOpacity
              style={styles.exportButton}
              onPress={exportToPDF}
              disabled={isExporting}
            >
              {isExporting ? (
                <Text style={styles.exportButtonText}>Exporting...</Text>
              ) : (
                <>
                  <Download size={20} color="#FFFFFF" />
                  <Text style={styles.exportButtonText}>Export PDF Report</Text>
                  <Share2 size={18} color="#FFFFFF" />
                </>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* Conditional Rendering */}
        {selectedPeriod === "24hour" ? (
          <>
            {/* 24-Hour Summary */}
            <View style={styles.summaryCard}>
              <View style={styles.summaryHeader}>
                <Text style={styles.summaryTitle}>24-Hour Summary</Text>
                <View style={styles.excellentBadge}>
                  <Text style={styles.excellentText}>Excellent</Text>
                </View>
              </View>

              <View style={styles.vitalsGrid}>
                {[
                  { label: "Heart Rate", icon: Heart, value: `${reportData.heartRate.value} bpm`, status: reportData.heartRate.status, color: "#EF4444" },
                  { label: "Temperature", icon: Thermometer, value: `${reportData.temperature.value} °F`, status: reportData.temperature.status, color: "#EF4444" },
                  { label: "Oxygen Level", icon: Wind, value: `${reportData.oxygenLevel.value} %`, status: reportData.oxygenLevel.status, color: "#3B82F6" },
                  { label: "ECG Reading", icon: Activity, value: `${reportData.ecgReading.value} %`, status: reportData.ecgReading.status, color: "#111827" },
                ].map((item, idx) => {
                  const Icon = item.icon;
                  return (
                    <View key={idx} style={styles.vitalBox}>
                      <View style={styles.vitalIconContainer}>
                        <Icon size={20} color={item.color} />
                      </View>
                      <View style={[styles.statusBadge, { backgroundColor: getStatusBgColor(item.status) }]}>
                        <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>{item.status}</Text>
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
                <Text style={styles.trendLabel}>Heart Rate variation</Text>
                <Text style={styles.trendStatus}>Normal</Text>
              </View>
              <View style={styles.graphContainer}>
                <View style={styles.graph}>
                  {heartRateData.map((point, i) => (
                    <View key={i} style={[styles.graphBar, { height: `${(point.value / 100) * 100}%`, backgroundColor: "#EF4444" }]} />
                  ))}
                </View>
              </View>
            </View>

        

            {/* Health Score */}
            <View style={styles.healthScoreCard}>
              <View style={styles.scoreHeader}>
                <View>
                  <Text style={styles.scoreTitle}>Health Score</Text>
                  <Text style={styles.scoreSubtitle}>{healthScore24h.performance}</Text>
                </View>
                <View style={styles.scoreCircle}>
                  <Text style={styles.scoreValue}>{healthScore24h.score}</Text>
                  <Text style={styles.scoreMax}>out of 100</Text>
                </View>
              </View>
              <View style={styles.scoreStats}>
                <View style={styles.scoreStat}>
                  <Text style={styles.scoreStatValue}>{healthScore24h.dataPoints.toLocaleString()}</Text>
                  <Text style={styles.scoreStatLabel}>Data points</Text>
                </View>
                <View style={styles.scoreStatDivider} />
                <View style={styles.scoreStat}>
                  <Text style={styles.scoreStatValue}>{healthScore24h.alerts}</Text>
                  <Text style={styles.scoreStatLabel}>Alerts</Text>
                </View>
                <View style={styles.scoreStatDivider} />
                <View style={styles.scoreStat}>
                  <Text style={styles.scoreStatValue}>{healthScore24h.uptime}</Text>
                  <Text style={styles.scoreStatLabel}>Uptime</Text>
                </View>
              </View>
            </View>
          </>
        ) : (
          <>
            {/* 3-Month Overview */}
            <View style={styles.summaryCard}>
              <View style={styles.summaryHeader}>
                <Text style={styles.summaryTitle}>3-Month Overview</Text>
                <Text style={styles.asOfText}>as of {reportData3m.asOf}</Text>
              </View>
              <View style={styles.vitalsGrid}>
                {[reportData3m.heartRate, reportData3m.temperature, reportData3m.oxygenLevel, reportData3m.ecgReading].map((vital, idx) => {
                  const icons = [Heart, Thermometer, Wind, Activity];
                  const labels = ["Heart Rate", "Temperature", "Oxygen Level", "ECG Reading"];
                  const colors = ["#EF4444", "#EF4444", "#3B82F6", "#111827"];
                  const Icon = icons[idx];
                  return (
                    <View key={idx} style={styles.vitalBox}>
                      <View style={styles.vitalIconContainer}>
                        <Icon size={20} color={colors[idx]} />
                      </View>
                      <View style={[styles.statusBadge, { backgroundColor: getStatusBgColor(vital.status) }]}>
                        <Text style={[styles.statusText, { color: getStatusColor(vital.status) }]}>{vital.status}</Text>
                      </View>
                      <Text style={styles.vitalLabel}>{labels[idx]}</Text>
                      <Text style={styles.vitalValue}>{vital.value}</Text>
                    </View>
                  );
                })}
              </View>
            </View>

            {/* Monthly Comparison */}
            <View style={styles.monthlyCard}>
              <Text style={styles.monthlyTitle}>Monthly Comparison</Text>
              {monthlyComparison.map((m, i) => (
                <View key={i} style={styles.monthRow}>
                  <Text style={styles.monthName}>{m.month}</Text>
                  <View style={styles.monthScoreContainer}>
                    <View style={styles.progressBar}>
                      <View style={[styles.progressFill, { width: `${m.score}%` }]} />
                    </View>
                    <Text style={styles.monthScore}>
                      {m.score}/{m.total}
                    </Text>
                  </View>
                </View>
              ))}
            </View>

            {/* Key Insights */}
            <View style={styles.insightsCard}>
              <Text style={styles.insightsTitle}>Key Insights</Text>
              {keyInsights.map((i) => {
                const Icon = i.icon;
                return (
                  <View key={i.id} style={[styles.insightItem, { backgroundColor: i.bgColor }]}>
                    <View style={[styles.insightIconContainer, { backgroundColor: i.color + "20" }]}>
                      <Icon size={18} color={i.color} />
                    </View>
                    <Text style={styles.insightText}>{i.text}</Text>
                  </View>
                );
              })}
            </View>

            {/* 3-Month Stats */}
            <View style={styles.statsCard}>
              <View style={styles.statsGrid}>
                <View style={styles.statBox}>
                  <Text style={styles.statValue}>{stats3m.totalDays}</Text>
                  <Text style={styles.statLabel}>Total Days</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.statValue}>{stats3m.normalReadings}</Text>
                  <Text style={styles.statLabel}>Normal Readings</Text>
                </View>
              </View>
              <View style={styles.statsGrid}>
                <View style={styles.statBox}>
                  <Text style={styles.statValue}>{stats3m.totalAlerts}</Text>
                  <Text style={styles.statLabel}>Total Alerts</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.statValue}>{stats3m.dataPoints}</Text>
                  <Text style={styles.statLabel}>Data Points</Text>
                </View>
              </View>
            </View>

            {/* Overall Health */}
            <View style={styles.overallHealthCard}>
              <View style={styles.overallHeader}>
                <View style={styles.overallInfo}>
                  <Text style={styles.overallTitle}>{overallHealth.title}</Text>
                  <Text style={styles.overallSubtitle}>{overallHealth.subtitle}</Text>
                </View>
                <View style={styles.gradeCircle}>
                  <Text style={styles.gradeText}>{overallHealth.grade}</Text>
                  <Text style={styles.gradeLabel}>Excellent</Text>
                </View>
              </View>
              <Text style={styles.overallDescription}>{overallHealth.description}</Text>
            </View>
          </>
        )}
      </ScrollView>
      <Footer />
    </SafeAreaView>
  );
}

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
  exportButton: { backgroundColor: "#10B981", flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 14, borderRadius: 12, gap: 8, shadowColor: "#10B981", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 6, elevation: 4 },
  exportButtonText: { color: "#FFFFFF", fontSize: 16, fontWeight: "bold" },
  summaryCard: { backgroundColor: "#FFFFFF", borderRadius: 16, padding: 16, marginHorizontal: 16, marginBottom: 16, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 2 },
  summaryHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  summaryTitle: { fontSize: 18, fontWeight: "bold", color: "#111827" },
  excellentBadge: { backgroundColor: "#D1FAE5", paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
  excellentText: { fontSize: 12, fontWeight: "600", color: "#10B981" },
  asOfText: { fontSize: 12, color: "#6B7280" },
  vitalsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  vitalBox: { width: "47%", backgroundColor: "#F9FAFB", borderRadius: 12, padding: 12, alignItems: "center" },
  vitalIconContainer: { width: 40, height: 40, borderRadius: 20, backgroundColor: "#F3F4F6", justifyContent: "center", alignItems: "center", marginBottom: 8 },
  statusBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2, marginBottom: 6 },
  statusText: { fontSize: 12, fontWeight: "600" },
  vitalLabel: { fontSize: 13, color: "#6B7280", marginBottom: 2 },
  vitalValue: { fontSize: 16, fontWeight: "bold", color: "#111827" },
  trendsCard: { backgroundColor: "#FFFFFF", borderRadius: 16, padding: 16, marginHorizontal: 16, marginBottom: 16, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 2 },
  trendsTitle: { fontSize: 18, fontWeight: "bold", color: "#111827", marginBottom: 12 },
  trendRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
  trendLabel: { fontSize: 14, color: "#6B7280" },
  trendStatus: { fontSize: 14, fontWeight: "600", color: "#10B981" },
  graphContainer: { height: 100, marginTop: 8 },
  graph: { flexDirection: "row", alignItems: "flex-end", height: "100%" },
  graphBar: { width: 4, marginHorizontal: 1, borderRadius: 2 },
  activityCard: { backgroundColor: "#FFFFFF", borderRadius: 16, padding: 16, marginHorizontal: 16, marginBottom: 16, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 2 },
  activityTitle: { fontSize: 18, fontWeight: "bold", color: "#111827", marginBottom: 12 },
  activityItem: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  activityIconContainer: { width: 36, height: 36, borderRadius: 18, justifyContent: "center", alignItems: "center", marginRight: 12 },
  activityContent: { flex: 1 },
  activityText: { fontSize: 14, color: "#111827" },
  activityTime: { fontSize: 12, color: "#6B7280" },
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
  monthlyCard: { backgroundColor: "#FFFFFF", borderRadius: 16, padding: 16, marginHorizontal: 16, marginBottom: 16, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 2 },
  monthlyTitle: { fontSize: 18, fontWeight: "bold", color: "#111827", marginBottom: 12 },
  monthRow: { marginBottom: 12 },
  monthName: { fontSize: 14, color: "#6B7280", marginBottom: 4 },
  monthScoreContainer: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  progressBar: { flex: 1, height: 8, backgroundColor: "#E5E7EB", borderRadius: 4, marginRight: 8 },
  progressFill: { height: "100%", backgroundColor: "#3B82F6", borderRadius: 4 },
  monthScore: { fontSize: 12, fontWeight: "600", color: "#111827" },
  insightsCard: { backgroundColor: "#FFFFFF", borderRadius: 16, padding: 16, marginHorizontal: 16, marginBottom: 16, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 2 },
  insightsTitle: { fontSize: 18, fontWeight: "bold", color: "#111827", marginBottom: 12 },
  insightItem: { flexDirection: "row", alignItems: "center", borderRadius: 12, padding: 12, marginBottom: 10 },
  insightIconContainer: { width: 32, height: 32, borderRadius: 16, justifyContent: "center", alignItems: "center", marginRight: 12 },
  insightText: { flex: 1, fontSize: 14, color: "#111827" },
  statsCard: { backgroundColor: "#FFFFFF", borderRadius: 16, padding: 16, marginHorizontal: 16, marginBottom: 16, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 2 },
  statsGrid: { flexDirection: "row", justifyContent: "space-between", marginBottom: 12 },
  statBox: { flex: 1, alignItems: "center" },
  statValue: { fontSize: 18, fontWeight: "bold", color: "#111827" },
  statLabel: { fontSize: 12, color: "#6B7280" },
  overallHealthCard: { backgroundColor: "#FFFFFF", borderRadius: 16, padding: 16, marginHorizontal: 16, marginBottom: 16, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 2 },
  overallHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  overallInfo: { flex: 1 },
  overallTitle: { fontSize: 18, fontWeight: "bold", color: "#111827" },
  overallSubtitle: { fontSize: 12, color: "#6B7280" },
  gradeCircle: { width: 60, height: 60, borderRadius: 30, backgroundColor: "#10B981", justifyContent: "center", alignItems: "center" },
  gradeText: { fontSize: 24, fontWeight: "bold", color: "#FFFFFF" },
  gradeLabel: { fontSize: 10, color: "rgba(255,255,255,0.8)" },
  overallDescription: { fontSize: 14, color: "#374151", lineHeight: 20 },
});