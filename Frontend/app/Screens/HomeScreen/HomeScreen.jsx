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

const { width } = Dimensions.get("window");

export default function HomeScreen({ route }) {
  const router = useRouter();
  const params = useLocalSearchParams();
  
  // Get username and email from navigation params
  const [username, setUsername] = useState("User");
  const [email, setEmail] = useState("user@example.com");
  
  const [currentTime, setCurrentTime] = useState(new Date());
  const [menuVisible, setMenuVisible] = useState(false);
  const [vitals, setVitals] = useState({
    heartRate: 74,
    temperature: 98.6,
    oxygenLevel: 99,
    ecgRating: 99,
  });

  const [vitalHistory, setVitalHistory] = useState([]);
  const [healthStatus, setHealthStatus] = useState("normal");
  const [riskLevel, setRiskLevel] = useState("low");
  const [recommendations, setRecommendations] = useState([]);

  // Load username from AsyncStorage on mount
  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const savedUsername = await AsyncStorage.getItem('username');
      const savedEmail = await AsyncStorage.getItem('email');
      
      if (savedUsername) {
        setUsername(savedUsername);
      }
      if (savedEmail) {
        setEmail(savedEmail);
      }
    } catch (error) {
      console.log('Error loading user data:', error);
    }
  };

  // Update username and email from params
  useEffect(() => {
    const updateUserData = async () => {
      if (params?.username) {
        setUsername(params.username);
        await AsyncStorage.setItem('username', params.username);
      }
      if (params?.email) {
        setEmail(params.email);
        await AsyncStorage.setItem('email', params.email);
      }
      if (route?.params?.username) {
        setUsername(route.params.username);
        await AsyncStorage.setItem('username', route.params.username);
      }
      if (route?.params?.email) {
        setEmail(route.params.email);
        await AsyncStorage.setItem('email', route.params.email);
      }
    };
    
    updateUserData();
  }, [params, route?.params]);

  // Normal ranges for vitals
  const ranges = {
    heartRate: { min: 60, max: 100, warning: { min: 50, max: 110 } },
    temperature: { min: 97.0, max: 99.0, warning: { min: 96.0, max: 100.4 } },
    oxygenLevel: { min: 95, max: 100, warning: { min: 90, max: 94 } },
    ecgRating: { min: 90, max: 100, warning: { min: 80, max: 89 } },
  };

  // Simulate real-time data
  useEffect(() => {
    const interval = setInterval(() => {
      setVitals((prev) => {
        const variation = Math.random() > 0.7 ? (Math.random() - 0.5) * 10 : (Math.random() - 0.5) * 2;

        const newVitals = {
          heartRate: Math.max(45, Math.min(130, prev.heartRate + variation * 0.5)),
          temperature: Math.max(95, Math.min(102, prev.temperature + (Math.random() - 0.5) * 0.2)),
          oxygenLevel: Math.max(85, Math.min(100, prev.oxygenLevel + (Math.random() - 0.5) * 1)),
          ecgRating: Math.max(70, Math.min(100, prev.ecgRating + (Math.random() - 0.5) * 2)),
        };

        setVitalHistory((history) => [...history.slice(-20), { ...newVitals, timestamp: Date.now() }]);

        return newVitals;
      });
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  // Update time
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Analyze health status
  useEffect(() => {
    analyzeHealthStatus();
  }, [vitals, vitalHistory]);

  const getVitalStatus = (value, vitalType) => {
    const range = ranges[vitalType];
    if (value < range.warning.min || value > range.warning.max) return "critical";
    if (value < range.min || value > range.max) return "warning";
    return "normal";
  };

  const analyzeHealthStatus = () => {
    const statuses = [
      getVitalStatus(vitals.heartRate, "heartRate"),
      getVitalStatus(vitals.temperature, "temperature"),
      getVitalStatus(vitals.oxygenLevel, "oxygenLevel"),
      getVitalStatus(vitals.ecgRating, "ecgRating"),
    ];

    if (statuses.includes("critical")) {
      setHealthStatus("critical");
      setRiskLevel("high");
    } else if (statuses.includes("warning")) {
      setHealthStatus("warning");
      setRiskLevel("medium");
    } else {
      setHealthStatus("normal");
      setRiskLevel("low");
    }

    if (vitalHistory.length > 10) {
      const recentHistory = vitalHistory.slice(-10);
      const avgHeartRate = recentHistory.reduce((sum, v) => sum + v.heartRate, 0) / recentHistory.length;
      const avgOxygen = recentHistory.reduce((sum, v) => sum + v.oxygenLevel, 0) / recentHistory.length;

      const newRecommendations = [];

      if (avgHeartRate > 90) {
        newRecommendations.push({
          type: "warning",
          text: "Heart rate consistently elevated. Rest recommended.",
        });
      }

      if (avgOxygen < 95) {
        newRecommendations.push({
          type: "warning",
          text: "Oxygen levels trending low. Deep breathing exercises advised.",
        });
      }

      if (vitals.heartRate > 110) {
        newRecommendations.push({
          type: "critical",
          text: "High heart rate detected. Avoid strenuous activity.",
        });
      }

      if (vitals.oxygenLevel < 90) {
        newRecommendations.push({
          type: "critical",
          text: "Low oxygen saturation. Seek medical attention if persists.",
        });
      }

      if (newRecommendations.length === 0) {
        newRecommendations.push({
          type: "normal",
          text: "All vitals in healthy range. Keep up the good work!",
        });
      }

      setRecommendations(newRecommendations);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "critical":
        return "#EF4444";
      case "warning":
        return "#F59E0B";
      default:
        return "#10B981";
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case "critical":
        return "Critical - Action Needed";
      case "warning":
        return "Monitoring Required";
      default:
        return "All vitals are normal";
    }
  };

  const overallStatus = [
    getVitalStatus(vitals.heartRate, "heartRate"),
    getVitalStatus(vitals.temperature, "temperature"),
    getVitalStatus(vitals.oxygenLevel, "oxygenLevel"),
    getVitalStatus(vitals.ecgRating, "ecgRating"),
  ].reduce((worst, current) => {
    if (worst === "critical" || current === "critical") return "critical";
    if (worst === "warning" || current === "warning") return "warning";
    return "normal";
  });

  return (
    <View style={styles.container}>
      {/* Header - First Code Style */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity 
            onPress={() => setMenuVisible(true)} 
            style={styles.menuButton}
          >
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
          <Text style={styles.onlineText}>Online Now</Text>
        </View>
      </View>

      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Welcome Card - Shows Dynamic Username */}
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
              <Text style={styles.deviceTitle}>Device Connected</Text>
              <Text style={styles.deviceModel}>Meditrack W4704</Text>
            </View>
          </View>
          <View style={styles.liveIndicator}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>Live</Text>
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
              <Text style={styles.statusText}>{getStatusText(overallStatus)}</Text>
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
              <View style={styles.realtimeDot} />
              <Text style={styles.realtimeText}>Real-time</Text>
            </View>
          </View>

          <View style={styles.vitalsGrid}>
            {/* Heart Rate */}
            <View
              style={[
                styles.vitalCard,
                { borderColor: getStatusColor(getVitalStatus(vitals.heartRate, "heartRate")) },
              ]}
            >
              <View style={styles.vitalHeader}>
                <Heart size={20} color={getStatusColor(getVitalStatus(vitals.heartRate, "heartRate"))} />
                <View
                  style={[
                    styles.statusBadge,
                    { backgroundColor: getStatusColor(getVitalStatus(vitals.heartRate, "heartRate")) },
                  ]}
                >
                  <Text style={styles.statusBadgeText}>
                    {getVitalStatus(vitals.heartRate, "heartRate") === "critical"
                      ? "Critical"
                      : getVitalStatus(vitals.heartRate, "heartRate") === "warning"
                      ? "Warning"
                      : "Normal"}
                  </Text>
                </View>
              </View>
              <Text style={styles.vitalValue}>{Math.round(vitals.heartRate)}</Text>
              <Text style={styles.vitalLabel}>Heart Rate</Text>
              <Text style={styles.vitalUnit}>bpm</Text>
            </View>

            {/* Temperature */}
            <View
              style={[
                styles.vitalCard,
                { borderColor: getStatusColor(getVitalStatus(vitals.temperature, "temperature")) },
              ]}
            >
              <View style={styles.vitalHeader}>
                <Thermometer
                  size={20}
                  color={getStatusColor(getVitalStatus(vitals.temperature, "temperature"))}
                />
                <View
                  style={[
                    styles.statusBadge,
                    { backgroundColor: getStatusColor(getVitalStatus(vitals.temperature, "temperature")) },
                  ]}
                >
                  <Text style={styles.statusBadgeText}>
                    {getVitalStatus(vitals.temperature, "temperature") === "critical"
                      ? "Critical"
                      : getVitalStatus(vitals.temperature, "temperature") === "warning"
                      ? "Warning"
                      : "Normal"}
                  </Text>
                </View>
              </View>
              <Text style={styles.vitalValue}>{vitals.temperature.toFixed(1)}</Text>
              <Text style={styles.vitalLabel}>Temperature</Text>
              <Text style={styles.vitalUnit}>°F</Text>
            </View>

            {/* Oxygen Level */}
            <View
              style={[
                styles.vitalCard,
                { borderColor: getStatusColor(getVitalStatus(vitals.oxygenLevel, "oxygenLevel")) },
              ]}
            >
              <View style={styles.vitalHeader}>
                <Wind size={20} color={getStatusColor(getVitalStatus(vitals.oxygenLevel, "oxygenLevel"))} />
                <View
                  style={[
                    styles.statusBadge,
                    { backgroundColor: getStatusColor(getVitalStatus(vitals.oxygenLevel, "oxygenLevel")) },
                  ]}
                >
                  <Text style={styles.statusBadgeText}>
                    {getVitalStatus(vitals.oxygenLevel, "oxygenLevel") === "critical"
                      ? "Critical"
                      : getVitalStatus(vitals.oxygenLevel, "oxygenLevel") === "warning"
                      ? "Warning"
                      : "Normal"}
                  </Text>
                </View>
              </View>
              <Text style={styles.vitalValue}>{Math.round(vitals.oxygenLevel)}</Text>
              <Text style={styles.vitalLabel}>Oxygen Level</Text>
              <Text style={styles.vitalUnit}>SpO₂ %</Text>
            </View>

            {/* ECG Rating */}
            <View
              style={[
                styles.vitalCard,
                { borderColor: getStatusColor(getVitalStatus(vitals.ecgRating, "ecgRating")) },
              ]}
            >
              <View style={styles.vitalHeader}>
                <Activity size={20} color={getStatusColor(getVitalStatus(vitals.ecgRating, "ecgRating"))} />
                <View
                  style={[
                    styles.statusBadge,
                    { backgroundColor: getStatusColor(getVitalStatus(vitals.ecgRating, "ecgRating")) },
                  ]}
                >
                  <Text style={styles.statusBadgeText}>
                    {getVitalStatus(vitals.ecgRating, "ecgRating") === "critical"
                      ? "Critical"
                      : getVitalStatus(vitals.ecgRating, "ecgRating") === "warning"
                      ? "Warning"
                      : "Normal"}
                  </Text>
                </View>
              </View>
              <Text style={styles.vitalValue}>{Math.round(vitals.ecgRating)}</Text>
              <Text style={styles.vitalLabel}>ECG Rating</Text>
              <Text style={styles.vitalUnit}>score</Text>
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
                <View
                  key={idx}
                  style={[
                    styles.recommendationItem,
                    {
                      backgroundColor:
                        rec.type === "critical"
                          ? "#FEE2E2"
                          : rec.type === "warning"
                          ? "#FEF3C7"
                          : "#D1FAE5",
                      borderLeftColor:
                        rec.type === "critical"
                          ? "#EF4444"
                          : rec.type === "warning"
                          ? "#F59E0B"
                          : "#10B981",
                    },
                  ]}
                >
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
            <View
              style={[
                styles.riskFill,
                {
                  backgroundColor:
                    riskLevel === "high" ? "#EF4444" : riskLevel === "medium" ? "#F59E0B" : "#10B981",
                  width: riskLevel === "high" ? "100%" : riskLevel === "medium" ? "60%" : "20%",
                },
              ]}
            />
          </View>
          <View style={styles.riskInfo}>
            <Text
              style={[
                styles.riskLevel,
                {
                  color: riskLevel === "high" ? "#DC2626" : riskLevel === "medium" ? "#D97706" : "#059669",
                },
              ]}
            >
              {riskLevel === "high" ? "High Risk" : riskLevel === "medium" ? "Medium Risk" : "Low Risk"}
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

      {/* Footer */}
      <Footer />

      {/* Menu Drawer - Second Code Style */}
      <MenuDrawer
        visible={menuVisible}
        onClose={() => setMenuVisible(false)}
        navigation={router}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#d1e6f6ff",
  },
  header: {
    backgroundColor: "#1E3C72",
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  menuButton: {
    backgroundColor: "rgba(255,255,255,0.25)",
    borderRadius: 20,
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#FFF",
  },
  headerSubtitle: {
    fontSize: 12,
    color: "#E0E7FF",
  },
  headerRight: {
    alignItems: "flex-end",
  },
  timeText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFF",
  },
  onlineText: {
    fontSize: 12,
    color: "#E0E7FF",
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 100,
  },
  welcomeCard: {
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#DBEAFE",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#2563EB",
  },
  welcomeTextContainer: {
    flex: 1,
  },
  welcomeName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
  },
  welcomeDate: {
    fontSize: 14,
    color: "#6B7280",
  },
  deviceCard: {
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  deviceLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  deviceIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#D1FAE5",
    alignItems: "center",
    justifyContent: "center",
  },
  deviceTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
  },
  deviceModel: {
    fontSize: 12,
    color: "#6B7280",
  },
  liveIndicator: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#10B981",
  },
  liveText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#059669",
  },
  statusCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  statusContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  statusLeft: {
    flex: 1,
  },
  statusHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FFF",
  },
  statusText: {
    fontSize: 14,
    color: "rgba(255,255,255,0.9)",
  },
  statusTime: {
    fontSize: 12,
    color: "rgba(255,255,255,0.75)",
  },
  vitalsSection: {
    marginBottom: 16,
  },
  vitalsSectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  vitalsTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#111827",
  },
  realtimeIndicator: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  realtimeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#10B981",
  },
  realtimeText: {
    fontSize: 12,
    color: "#6B7280",
  },
  vitalsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  vitalCard: {
    width: (width - 44) / 2,
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  vitalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#FFF",
  },
  vitalValue: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#111827",
  },
  vitalLabel: {
    fontSize: 14,
    color: "#4B5563",
  },
  vitalUnit: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 4,
  },
  recommendationsCard: {
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  recommendationsHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  recommendationsTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#111827",
  },
  recommendationsList: {
    gap: 8,
  },
  recommendationItem: {
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
  },
  recommendationText: {
    fontSize: 14,
    color: "#374151",
  },
  riskCard: {
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  riskTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 12,
  },
  riskBar: {
    height: 12,
    backgroundColor: "#E5E7EB",
    borderRadius: 6,
    overflow: "hidden",
    marginBottom: 12,
  },
  riskFill: {
    height: "100%",
    borderRadius: 6,
  },
  riskInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  riskLevel: {
    fontSize: 14,
    fontWeight: "600",
  },
  riskDescription: {
    fontSize: 14,
    color: "#6B7280",
  },
  actionsSection: {
    marginBottom: 16,
  },
  actionsTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 12,
  },
  actionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  actionButton: {
    width: (width - 44) / 2,
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    gap: 8,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  actionButtonTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFF",
    textAlign: "center",
  },
  actionButtonSubtitle: {
    fontSize: 12,
    color: "rgba(255,255,255,0.9)",
  },
});