import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import {
  ChevronLeft,
  AlertTriangle,
  Zap,
  Shield,
  RefreshCw,
} from "lucide-react-native";
import Footer from "../components/Footer";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SMS from "expo-sms";
import * as Location from "expo-location";
import axios from "axios";
import { API_BASE_URL } from "../../constants/constants";

const VITALS_API = `${API_BASE_URL}/api/vitals`;
const CONTACTS_API = `${API_BASE_URL}/api/emergency-contacts`;

export default function HealthDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [sendingAlert, setSendingAlert] = useState(false);

  const [hypertension, setHypertension] = useState(null);
  const [sleepApnea, setSleepApnea] = useState(null);
  const [tachyBrady, setTachyBrady] = useState(null);
  const [latestVitals, setLatestVitals] = useState(null);

  // Track if auto-alert already fired this session to avoid repeated alerts
  const autoAlertFired = useRef(false);

  useEffect(() => {
    fetchLatestData();
  }, []);

  // Auto emergency alert when any condition is Severe/Critical OR risk_score >= 75%
  useEffect(() => {
    if (autoAlertFired.current) return; // already fired once this session

    const shouldAutoAlert = (data) => {
      if (!data) return false;
      if (["Severe", "Critical"].includes(data.severity)) return true;
      if (data.risk_score != null && data.risk_score * 100 >= 75) return true;
      return false;
    };

    const triggered =
      shouldAutoAlert(hypertension) ||
      shouldAutoAlert(sleepApnea) ||
      shouldAutoAlert(tachyBrady);

    if (triggered) {
      autoAlertFired.current = true;
      // Small delay so UI renders first
      setTimeout(() => {
        sendEmergencyAlert(true);
      }, 1500);
    }
  }, [hypertension, sleepApnea, tachyBrady]);

  const fetchLatestData = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem("userToken");
      if (!token) return;
      const headers = { Authorization: `Bearer ${token}` };

      try {
        const vitalsRes = await axios.get(`${VITALS_API}/latest`, { headers });
        if (vitalsRes.data.success) setLatestVitals(vitalsRes.data.data);
      } catch (e) {
        console.log("Vitals error:", e.message);
      }

      const userDataStr = await AsyncStorage.getItem("userData");
      const userData = userDataStr ? JSON.parse(userDataStr) : null;
      const userId =
        userData?._id ||
        userData?.id ||
        userData?.user?._id ||
        userData?.user?.id ||
        userData?.data?._id;

      if (!userId) return;

      try {
        const mlRes = await axios.get(`${VITALS_API}/patient/${userId}`, { headers });
        if (mlRes.data.success) {
          const { hypertension, sleepApnea, tachyBrady } = mlRes.data.data;
          if (hypertension?.length > 0) setHypertension(hypertension[0]);
          if (sleepApnea?.length > 0) setSleepApnea(sleepApnea[0]);
          if (tachyBrady?.length > 0) setTachyBrady(tachyBrady[0]);
        }
      } catch (e) {
        console.log("ML fetch error:", e.message);
      }
    } catch (err) {
      console.log("Fetch error:", err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    try {
      setSyncing(true);
      autoAlertFired.current = false; // allow re-check on manual sync
      await fetchLatestData();
      Alert.alert("Done!", "Latest ML predictions loaded!");
    } catch (err) {
      Alert.alert("Failed", err.message || "Please try again");
    } finally {
      setSyncing(false);
    }
  };

  // isAuto = true means called automatically (skip success dialog spam)
  const sendEmergencyAlert = async (isAuto = false) => {
    try {
      setSendingAlert(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        if (!isAuto) Alert.alert("Permission Denied", "Location permission required.");
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      const { latitude, longitude } = location.coords;

      let address = "Address not available";
      try {
        const results = await Location.reverseGeocodeAsync({ latitude, longitude });
        if (results.length > 0) {
          const addr = results[0];
          address = [addr.name, addr.street, addr.city, addr.region, addr.country]
            .filter(Boolean)
            .join(", ");
        }
      } catch (e) {}

      const mapsUrl = `https://www.google.com/maps?q=${latitude},${longitude}`;
      const userName = (await AsyncStorage.getItem("userName")) || "Patient";
      const timestamp = new Date().toLocaleString();

      const criticalConditions = [];
      if (hypertension?.severity && !["Normal", "Mild"].includes(hypertension.severity))
        criticalConditions.push(`Hypertension: ${hypertension.severity}`);
      if (sleepApnea?.severity && !["Normal", "Mild"].includes(sleepApnea.severity))
        criticalConditions.push(`Sleep Apnea: ${sleepApnea.severity}`);
      if (tachyBrady?.severity && !["Normal", "Mild"].includes(tachyBrady.severity))
        criticalConditions.push(`Heart: ${tachyBrady.severity}`);

      const alertMessage =
        `EMERGENCY HEALTH ALERT\n\n${userName} needs immediate help!\n\n` +
        `ML Detected:\n${criticalConditions.length > 0 ? criticalConditions.join("\n") : "Critical vitals detected"}\n\n` +
        `Location: ${address}\n\nMaps: ${mapsUrl}\n\nTime: ${timestamp}\n\n- Sent from MediTrack`;

      const token = await AsyncStorage.getItem("userToken");
      const userDataStr = await AsyncStorage.getItem("userData");
      const userData = userDataStr ? JSON.parse(userDataStr) : null;
      const userId =
        userData?._id ||
        userData?.id ||
        userData?.user?._id ||
        userData?.user?.id;

      const response = await axios.post(
        `${CONTACTS_API}/send-alert`,
        { userId, alertMessage },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        const contacts = response.data.contacts || [];
        if (contacts.length === 0) {
          if (!isAuto) Alert.alert("No Contacts", "Please add emergency contacts first.");
          return;
        }
        const isAvailable = await SMS.isAvailableAsync();
        if (!isAvailable) {
          if (!isAuto) Alert.alert("SMS Unavailable", "This device cannot send SMS.");
          return;
        }
        const { result } = await SMS.sendSMSAsync(
          contacts.map((c) => c.phone),
          alertMessage
        );
        if (result === "sent") {
          Alert.alert(
            isAuto ? "Auto Alert Sent!" : "Alert Sent!",
            `Emergency SMS sent to ${contacts.length} guardian(s).`
          );
        }
      }
    } catch (err) {
      if (!isAuto) Alert.alert("Error", "Failed to send emergency alert.");
      else console.log("Auto alert error:", err.message);
    } finally {
      setSendingAlert(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    autoAlertFired.current = false;
    await fetchLatestData();
    setRefreshing(false);
  };

  const getSeverityColor = (s) =>
    ({ Normal: "#10B981", Mild: "#F59E0B", Moderate: "#F97316", Severe: "#EF4444", Critical: "#DC2626" }[s] || "#6B7280");
  const getSeverityBg = (s) =>
    ({ Normal: "#D1FAE5", Mild: "#FEF3C7", Moderate: "#FFEDD5", Severe: "#FEE2E2", Critical: "#FEE2E2" }[s] || "#F3F4F6");

  const MLCard = ({ title, icon, data }) => {
    const severity = data?.severity || "No Data";
    const riskScore =
      data?.risk_score != null ? (data.risk_score * 100).toFixed(1) : null;
    const color = getSeverityColor(severity);
    const bg = getSeverityBg(severity);
    return (
      <View style={[styles.mlCard, { backgroundColor: bg, borderLeftColor: color }]}>
        <View style={styles.mlCardHeader}>
          <View style={styles.mlCardLeft}>
            <Text style={styles.mlCardIcon}>{icon}</Text>
            <Text style={styles.mlCardTitle}>{title}</Text>
          </View>
          <View style={[styles.severityBadge, { backgroundColor: color }]}>
            <Text style={styles.severityText}>{severity}</Text>
          </View>
        </View>
        {riskScore && (
          <View style={styles.confidenceRow}>
            <Text style={styles.confidenceLabel}>Risk Score:</Text>
            <Text style={[styles.confidenceValue, { color }]}>{riskScore}%</Text>
          </View>
        )}
        {data?.timestamp && (
          <Text style={styles.timestampText}>
            {new Date(data.timestamp).toLocaleString()}
          </Text>
        )}
        {!data && (
          <Text style={styles.noDataText}>Sync karo data lane ke liye</Text>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#8B5CF6" />
          <Text style={styles.loadingText}>Loading Health Dashboard...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ChevronLeft size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Health Dashboard</Text>
        <TouchableOpacity onPress={fetchLatestData}>
          <RefreshCw size={20} color="#8B5CF6" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={{ paddingBottom: 120 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.heroCard}>
          <View style={styles.heroIcon}>
            <Shield size={40} color="#FFFFFF" />
          </View>
          <Text style={styles.heroTitle}>ML Health Predictions</Text>
          <Text style={styles.heroSubtitle}>
            Trained ML models analyzing your vitals in real-time
          </Text>
        </View>

        {latestVitals && (
          <View style={styles.vitalsCard}>
            <Text style={styles.sectionTitle}>Latest Vitals</Text>
            <View style={styles.vitalsGrid}>
              <View style={styles.vitalItem}>
                <Text style={styles.vitalValue}>{latestVitals.heartRate}</Text>
                <Text style={styles.vitalLabel}>Heart Rate</Text>
                <Text style={styles.vitalUnit}>bpm</Text>
              </View>
              <View style={styles.vitalItem}>
                <Text style={styles.vitalValue}>{latestVitals.bloodOxygen}</Text>
                <Text style={styles.vitalLabel}>SpO2</Text>
                <Text style={styles.vitalUnit}>%</Text>
              </View>
              <View style={styles.vitalItem}>
                <Text style={styles.vitalValue}>{latestVitals.temperature}</Text>
                <Text style={styles.vitalLabel}>Temp</Text>
                <Text style={styles.vitalUnit}>C</Text>
              </View>
              <View style={styles.vitalItem}>
                <Text
                  style={[
                    styles.vitalValue,
                    { color: getSeverityColor(latestVitals.severity) },
                  ]}
                >
                  {latestVitals.severity || "-"}
                </Text>
                <Text style={styles.vitalLabel}>Severity</Text>
                <Text style={styles.vitalUnit}>status</Text>
              </View>
            </View>
          </View>
        )}

        <View style={styles.actionSection}>
          <TouchableOpacity
            style={[styles.syncButton, syncing && styles.buttonDisabled]}
            onPress={handleSync}
            disabled={syncing}
          >
            {syncing ? (
              <>
                <ActivityIndicator color="#FFFFFF" size="small" />
                <Text style={styles.buttonText}>Loading...</Text>
              </>
            ) : (
              <>
                <Zap size={20} color="#FFFFFF" />
                <Text style={styles.buttonText}>Refresh ML Predictions</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ML Model Predictions</Text>
          <MLCard title="Hypertension" icon="BP" data={hypertension} />
          <MLCard title="Sleep Apnea" icon="SL" data={sleepApnea} />
          <MLCard title="Tachycardia / Bradycardia" icon="HR" data={tachyBrady} />
        </View>

        <View style={styles.actionSection}>
          <TouchableOpacity
            style={[styles.emergencyButton, sendingAlert && styles.buttonDisabled]}
            onPress={() => sendEmergencyAlert(false)}
            disabled={sendingAlert}
          >
            {sendingAlert ? (
              <>
                <ActivityIndicator color="#FFFFFF" size="small" />
                <Text style={styles.emergencyButtonText}>Sending...</Text>
              </>
            ) : (
              <>
                <AlertTriangle size={20} color="#FFFFFF" />
                <Text style={styles.emergencyButtonText}>Send Emergency Alert</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
      <Footer />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { marginTop: 16, fontSize: 16, color: "#6B7280" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  backButton: { width: 40, height: 40, justifyContent: "center", alignItems: "center" },
  headerTitle: { fontSize: 20, fontWeight: "bold", color: "#111827" },
  scrollView: { flex: 1 },
  heroCard: {
    backgroundColor: "#8B5CF6",
    borderRadius: 16,
    padding: 24,
    margin: 16,
    alignItems: "center",
    shadowColor: "#8B5CF6",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  heroIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  heroTitle: { fontSize: 22, fontWeight: "bold", color: "#FFFFFF", marginBottom: 8 },
  heroSubtitle: { fontSize: 14, color: "#E9D5FF", textAlign: "center", lineHeight: 20 },
  vitalsCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  vitalsGrid: { flexDirection: "row", justifyContent: "space-between", marginTop: 12 },
  vitalItem: { alignItems: "center", flex: 1 },
  vitalValue: { fontSize: 22, fontWeight: "bold", color: "#111827" },
  vitalLabel: { fontSize: 11, color: "#6B7280", marginTop: 2 },
  vitalUnit: { fontSize: 10, color: "#9CA3AF" },
  actionSection: { paddingHorizontal: 16, marginBottom: 16 },
  syncButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#10B981",
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
    shadowColor: "#10B981",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  emergencyButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#DC2626",
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
    shadowColor: "#DC2626",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  emergencyButtonText: { color: "#FFFFFF", fontSize: 16, fontWeight: "bold" },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: "#FFFFFF", fontSize: 16, fontWeight: "bold" },
  section: { paddingHorizontal: 16, marginBottom: 16 },
  sectionTitle: { fontSize: 18, fontWeight: "bold", color: "#111827", marginBottom: 12 },
  mlCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  mlCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  mlCardLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
  mlCardIcon: { fontSize: 13, fontWeight: "bold", color: "#6B7280" },
  mlCardTitle: { fontSize: 16, fontWeight: "700", color: "#111827" },
  severityBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
  severityText: { color: "#FFFFFF", fontSize: 12, fontWeight: "bold" },
  confidenceRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 },
  confidenceLabel: { fontSize: 13, color: "#6B7280" },
  confidenceValue: { fontSize: 15, fontWeight: "bold" },
  timestampText: { fontSize: 12, color: "#9CA3AF", marginTop: 4 },
  noDataText: { fontSize: 13, color: "#9CA3AF", fontStyle: "italic", marginTop: 4 },
});
