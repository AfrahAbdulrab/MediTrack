import React, { useState, useEffect } from "react";
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
  Brain,
  Activity,
  AlertTriangle,
  CheckCircle,
  Zap,
  TrendingUp,
  Shield,
  MessageSquare,
  XCircle,
} from "lucide-react-native";
import Footer from "../components/Footer";
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SMS from "expo-sms";
import * as Location from 'expo-location';
import axios from "axios";

const API_BASE = "http://172.21.247.68:5000/api/emergency-contacts";
const AI_API_BASE = "http://172.21.247.68:5000/api/ai";

export default function AIHealthScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [patientId, setPatientId] = useState("690c4c93f611241fa1fc43f5");
  const [sendingAlert, setSendingAlert] = useState(false);

  // 🚨 NEW: Send Emergency Alert with Location Details (ShareLocation jaisa)
  const sendEmergencyAlertToAll = async (patientName = "Patient", vitalsData = null) => {
    try {
      setSendingAlert(true);
      console.log('🚨 Sending emergency alert to all contacts...');

      // ✅ Step 1: Get Location Permission & Current Position
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is required for emergency alerts.');
        setSendingAlert(false);
        return;
      }

      // ✅ Step 2: Get Current Location
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const { latitude, longitude } = location.coords;

      // ✅ Step 3: Get Address (Reverse Geocoding)
      let address = 'Address not available';
      try {
        const addressResults = await Location.reverseGeocodeAsync({ latitude, longitude });
        if (addressResults.length > 0) {
          const addr = addressResults[0];
          address = [
            addr.name,
            addr.street,
            addr.city,
            addr.region,
            addr.country,
          ].filter(Boolean).join(', ');
        }
      } catch (error) {
        console.log('⚠️ Reverse geocode failed:', error);
      }

      // ✅ Step 4: Create Detailed Message (ShareLocation jaisa)
      const mapsUrl = `https://www.google.com/maps?q=${latitude},${longitude}`;
      const timestamp = new Date().toLocaleString();
      
      const alertMessage = `🚨 EMERGENCY HEALTH ALERT 🚨

${patientName} needs immediate help!

Critical health condition detected by AI analysis.

📍 Current Location:
${address}

🗺️ View on Map:
${mapsUrl}

📌 Coordinates:
${latitude.toFixed(6)}, ${longitude.toFixed(6)}

⏰ ${timestamp}

Please check on them immediately!

- Sent from MediTrack`;

      // ✅ Step 5: Backend se contacts fetch karo
      const response = await axios.post(`${API_BASE}/send-alert`, {
        userId: patientId,
        alertMessage: alertMessage,
        vitalsData: vitalsData
      });

      if (response.data.success) {
        const { contacts: alertContacts } = response.data;
        
        if (alertContacts.length === 0) {
          Alert.alert(
            "No Emergency Contacts", 
            "Please add emergency contacts in Settings first.",
            [
              { text: "Cancel", style: "cancel" },
              { 
                text: "Add Contacts", 
                onPress: () => router.push('/emergency-contact') 
              }
            ]
          );
          return;
        }

        console.log(`✅ Found ${alertContacts.length} contacts to alert`);

        // ✅ Step 6: Check if SMS is available
        const isAvailable = await SMS.isAvailableAsync();
        if (!isAvailable) {
          Alert.alert("SMS Unavailable", "This device cannot send SMS.");
          setSendingAlert(false);
          return;
        }

        // ✅ Step 7: Send SMS to ALL contacts
        const phoneNumbers = alertContacts.map(contact => contact.phone);
        console.log('📧 Sending SMS to:', phoneNumbers);

        const { result } = await SMS.sendSMSAsync(phoneNumbers, alertMessage);

        if (result === 'sent') {
          console.log('✅ Emergency SMS sent successfully');
          
          Alert.alert(
            "✅ Emergency Alert Sent!", 
            `Location and health alert sent to ${alertContacts.length} contact(s):\n\n${alertContacts.map(c => `• ${c.name} (${c.relationship})`).join('\n')}`,
            [{ text: "OK" }]
          );
        } else {
          Alert.alert('Cancelled', 'Emergency SMS was cancelled.');
        }
      }

    } catch (error) {
      console.error('❌ Error sending emergency alert:', error);
      
      if (error.response) {
        Alert.alert("Error", error.response.data.message || "Failed to send alert");
      } else {
        Alert.alert("Error", "Failed to send emergency alert. Try again.");
      }
    } finally {
      setSendingAlert(false);
    }
  };

  const loadLatestAnalysis = async (pid = patientId) => {
    try {
      setLoading(true);
      console.log(`📊 Fetching analysis for patient: ${pid}`);
      
      const response = await fetch(`${AI_API_BASE}/analyze/${pid}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch analysis');
      }

      const data = await response.json();
      console.log("✅ Analysis loaded:", data);
      
      if (data.success) {
        // Transform backend response
        const transformedAnalysis = {
          analysisDate: data.analysisDate,
          dataPoints: data.dataAnalyzed.totalReadings,
          overallHealthScore: calculateHealthScore(data.riskLevel),
          
          // 🎯 DETECTED DISEASES
          detectedDiseases: data.detectedDiseases || [],
          
          riskLevel: data.riskLevel,
          recommendations: data.aiAnalysis?.recommendations || [],
          alertSent: data.emergencyAlert,
          rawAIResponse: data.aiAnalysis,
          detailedAnalysis: data.detailedAnalysis
        };
        
        setAnalysis(transformedAnalysis);
      }
    } catch (error) {
      console.log("❌ Error loading analysis:", error);
      setAnalysis(null);
    } finally {
      setLoading(false);
    }
  };

  // Calculate health score based on risk level
  const calculateHealthScore = (riskLevel) => {
    const scoreMapping = {
      'LOW': 85,
      'MODERATE': 65,
      'HIGH': 40,
      'CRITICAL': 20
    };
    return scoreMapping[riskLevel] || 70;
  };

  const handleRunAnalysis = async () => {
    try {
      setAnalyzing(true);
      console.log(`🤖 Starting AI analysis for patient: ${patientId}`);
      
      // Get location (optional)
      const location = {
        latitude: 33.5651,
        longitude: 73.0169
      };

      const response = await fetch(`${AI_API_BASE}/analyze/${patientId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ location })
      });

      const result = await response.json();
      console.log("✅ Analysis completed:", result);

      if (result.success) {
        // Show detected diseases
        const diseasesFound = result.detectedDiseases?.length || 0;
        const diseaseNames = result.detectedDiseases?.map(d => d.name).join(', ') || 'None';
        
        Alert.alert(
          "✅ Analysis Complete!", 
          diseasesFound > 0 
            ? `Detected ${diseasesFound} condition(s): ${diseaseNames}`
            : "No concerning patterns detected. You're healthy!",
          [{ text: "View Details", onPress: () => loadLatestAnalysis() }]
        );

        // 🚨 CHECK FOR EMERGENCY - Automatically trigger SMS alert
        if (result.emergencyAlert) {
          Alert.alert(
            "🚨 CRITICAL EMERGENCY DETECTED",
            "Critical health condition found! Do you want to send emergency SMS with your location to all contacts?",
            [
              { 
                text: "Cancel", 
                style: "cancel" 
              },
              { 
                text: "Send Emergency SMS", 
                style: "destructive",
                onPress: async () => {
                  // Get patient name from AsyncStorage
                  const userName = await AsyncStorage.getItem('userName') || 'Patient';
                  
                  // Extract vitals data if available
                  const vitalsData = result.detailedAnalysis ? {
                    heartRate: result.detailedAnalysis.heartRate?.average,
                    bloodPressure: result.detailedAnalysis.bloodPressure?.systolic?.average,
                  } : null;

                  await sendEmergencyAlertToAll(userName, vitalsData);
                }
              }
            ]
          );
        }
      } else {
        throw new Error(result.message || 'Analysis failed');
      }
      
    } catch (error) {
      console.log("❌ Analysis failed:", error);
      
      Alert.alert(
        "❌ Analysis Failed", 
        error.message || "Please check if you have vitals data for the last 2 months."
      );
    } finally {
      setAnalyzing(false);
    }
  };

  const handleChangePatient = () => {
    Alert.prompt(
      "Change Patient ID",
      "Enter patient ID:",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "OK",
          onPress: async (text) => {
            if (text) {
              setPatientId(text);
              await AsyncStorage.setItem('patientId', text);
              loadLatestAnalysis(text);
            }
          }
        }
      ],
      'plain-text',
      patientId
    );
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadLatestAnalysis();
    setRefreshing(false);
  };

  // Get severity color
  const getSeverityColor = (severity) => {
    switch (severity?.toLowerCase()) {
      case "low": return "#10B981";
      case "moderate": return "#F59E0B";
      case "high": return "#EF4444";
      case "critical": return "#DC2626";
      default: return "#6B7280";
    }
  };

  const getSeverityBgColor = (severity) => {
    switch (severity?.toLowerCase()) {
      case "low": return "#D1FAE5";
      case "moderate": return "#FEF3C7";
      case "high": return "#FEE2E2";
      case "critical": return "#FEE2E2";
      default: return "#F3F4F6";
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#8B5CF6" />
          <Text style={styles.loadingText}>Loading AI Health Analysis...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ChevronLeft size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>AI Health Assistant</Text>
        <TouchableOpacity onPress={handleChangePatient}>
          <Text style={styles.patientIdText}>{patientId.slice(0, 8)}...</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={{ paddingBottom: 120 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* AI Hero Card */}
        <View style={styles.heroCard}>
          <View style={styles.aiIconLarge}>
            <Brain size={40} color="#FFFFFF" />
          </View>
          <Text style={styles.heroTitle}>AI-Powered Health Analysis</Text>
          <Text style={styles.heroSubtitle}>
            Gemini AI analyzes your last 2 months vitals to detect heart disease risks
          </Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionSection}>
          <TouchableOpacity
            style={[styles.analyzeButton, analyzing && styles.buttonDisabled]}
            onPress={handleRunAnalysis}
            disabled={analyzing}
          >
            {analyzing ? (
              <>
                <ActivityIndicator color="#FFFFFF" size="small" />
                <Text style={styles.buttonText}>Analyzing with AI...</Text>
              </>
            ) : (
              <>
                <Zap size={20} color="#FFFFFF" />
                <Text style={styles.buttonText}>Run AI Risk Analysis</Text>
              </>
            )}
          </TouchableOpacity>

          {/* 🚨 Manual Emergency Alert Button */}
          <TouchableOpacity
            style={[styles.emergencyButton, sendingAlert && styles.buttonDisabled]}
            onPress={async () => {
              const userName = await AsyncStorage.getItem('userName') || 'Patient';
              await sendEmergencyAlertToAll(userName, null);
            }}
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

          <Text style={styles.analyzeNote}>
            {analysis 
              ? `Last analyzed: ${new Date(analysis.analysisDate).toLocaleDateString()}`
              : "Click above to run your first AI analysis"}
          </Text>
        </View>

        {/* Analysis Results */}
        {analysis ? (
          <>
            {/* Overall Health Score */}
            <View style={styles.scoreCard}>
              <View style={styles.scoreHeader}>
                <Shield size={24} color="#8B5CF6" />
                <Text style={styles.scoreTitle}>Overall Health Score</Text>
              </View>
              <View style={[
                styles.scoreCircle,
                { borderColor: getSeverityColor(analysis.riskLevel) }
              ]}>
                <Text style={[
                  styles.scoreValue,
                  { color: getSeverityColor(analysis.riskLevel) }
                ]}>
                  {analysis.overallHealthScore}
                </Text>
                <Text style={styles.scoreMax}>/ 100</Text>
              </View>
              <Text style={styles.scoreDescription}>
                Risk Level: {analysis.riskLevel}
              </Text>
            </View>

            {/* 🎯 DETECTED DISEASES */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                🎯 Detected Heart Conditions
              </Text>
              
              {analysis.detectedDiseases && analysis.detectedDiseases.length > 0 ? (
                analysis.detectedDiseases.map((disease, index) => (
                  <View 
                    key={index} 
                    style={[
                      styles.diseaseCard,
                      { 
                        backgroundColor: getSeverityBgColor(disease.severity),
                        borderLeftWidth: 4,
                        borderLeftColor: getSeverityColor(disease.severity)
                      }
                    ]}
                  >
                    {/* Disease Header */}
                    <View style={styles.diseaseHeader}>
                      <View style={styles.diseaseTitleRow}>
                        <Text style={styles.diseaseIcon}>{disease.icon}</Text>
                        <Text style={styles.diseaseName}>{disease.name}</Text>
                      </View>
                      <View style={[
                        styles.severityBadge,
                        { backgroundColor: getSeverityColor(disease.severity) }
                      ]}>
                        <Text style={styles.severityText}>
                          {disease.severity}
                        </Text>
                      </View>
                    </View>

                    {/* Disease Stats */}
                    <View style={styles.diseaseStats}>
                      <View style={styles.statItem}>
                        <Text style={styles.statValue}>{disease.percentage}%</Text>
                        <Text style={styles.statLabel}>Affected</Text>
                      </View>
                      <View style={styles.statItem}>
                        <Text style={styles.statValue}>{disease.affectedReadings}</Text>
                        <Text style={styles.statLabel}>Readings</Text>
                      </View>
                    </View>

                    {/* Disease Description */}
                    <Text style={styles.diseaseDescription}>
                      {disease.description}
                    </Text>
                  </View>
                ))
              ) : (
                <View style={styles.noDiseaseCard}>
                  <CheckCircle size={48} color="#10B981" />
                  <Text style={styles.noDiseaseTitle}>All Clear! ✨</Text>
                  <Text style={styles.noDiseaseText}>
                    No heart disease patterns detected in your vitals. Keep up the healthy lifestyle!
                  </Text>
                </View>
              )}
            </View>

            {/* AI Key Findings */}
            {analysis.rawAIResponse?.keyFindings && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>🔍 Key Findings</Text>
                {analysis.rawAIResponse.keyFindings.map((finding, index) => (
                  <View key={index} style={styles.findingCard}>
                    <Text style={styles.findingText}>• {finding}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Recommendations */}
            {analysis.recommendations && analysis.recommendations.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>💡 AI Recommendations</Text>
                {analysis.recommendations.map((rec, index) => (
                  <View key={index} style={styles.recommendationCard}>
                    <View style={styles.recommendationNumber}>
                      <Text style={styles.recommendationNumberText}>
                        {index + 1}
                      </Text>
                    </View>
                    <Text style={styles.recommendationText}>{rec}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Metadata */}
            <View style={styles.metadataCard}>
              <View style={styles.metadataRow}>
                <Activity size={16} color="#6B7280" />
                <Text style={styles.metadataText}>
                  Data Points: {analysis.dataPoints || "N/A"}
                </Text>
              </View>
              <View style={styles.metadataRow}>
                <TrendingUp size={16} color="#6B7280" />
                <Text style={styles.metadataText}>
                  Analyzed: {new Date(analysis.analysisDate).toLocaleString()}
                </Text>
              </View>
              <View style={styles.metadataRow}>
                <Brain size={16} color="#8B5CF6" />
                <Text style={styles.metadataText}>
                  Powered by: Google Gemini AI
                </Text>
              </View>
              {analysis.alertSent && (
                <View style={styles.alertBadge}>
                  <MessageSquare size={16} color="#EF4444" />
                  <Text style={styles.alertText}>Emergency SMS Sent 📱</Text>
                </View>
              )}
            </View>
          </>
        ) : (
          /* Empty State */
          <View style={styles.emptyState}>
            <Brain size={64} color="#D1D5DB" />
            <Text style={styles.emptyTitle}>No Analysis Yet</Text>
            <Text style={styles.emptyText}>
              Run your first AI analysis to detect heart disease risks using Google Gemini
            </Text>
            <Text style={styles.emptyNote}>
              💡 Make sure you have vitals data for the last 2 months
            </Text>
          </View>
        )}
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
  patientIdText: { fontSize: 12, color: "#8B5CF6", fontWeight: "600" },
  
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
  aiIconLarge: { 
    width: 80, 
    height: 80, 
    borderRadius: 40, 
    backgroundColor: "rgba(255,255,255,0.2)", 
    justifyContent: "center", 
    alignItems: "center", 
    marginBottom: 16 
  },
  heroTitle: { fontSize: 24, fontWeight: "bold", color: "#FFFFFF", marginBottom: 8 },
  heroSubtitle: { fontSize: 14, color: "#E9D5FF", textAlign: "center", lineHeight: 20 },
  
  actionSection: { paddingHorizontal: 16, marginBottom: 16 },
  analyzeButton: { 
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
    marginTop: 12,
    shadowColor: "#DC2626",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  emergencyButtonText: { color: "#FFFFFF", fontSize: 16, fontWeight: "bold" },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: "#FFFFFF", fontSize: 16, fontWeight: "bold" },
  analyzeNote: { fontSize: 12, color: "#6B7280", textAlign: "center", marginTop: 8 },
  
  scoreCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 24,
    marginHorizontal: 16,
    marginBottom: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  scoreHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 20 },
  scoreTitle: { fontSize: 18, fontWeight: "600", color: "#111827" },
  scoreCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    borderWidth: 8,
  },
  scoreValue: { fontSize: 48, fontWeight: "bold" },
  scoreMax: { fontSize: 18, color: "#6B7280", marginTop: -8 },
  scoreDescription: { fontSize: 16, fontWeight: "600", color: "#111827" },
  
  section: { paddingHorizontal: 16, marginBottom: 16 },
  sectionTitle: { fontSize: 18, fontWeight: "bold", color: "#111827", marginBottom: 12 },
  
  diseaseCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  diseaseHeader: { 
    flexDirection: "row", 
    justifyContent: "space-between", 
    alignItems: "center", 
    marginBottom: 12 
  },
  diseaseTitleRow: { flexDirection: "row", alignItems: "center", gap: 8, flex: 1 },
  diseaseIcon: { fontSize: 24 },
  diseaseName: { fontSize: 16, fontWeight: "700", color: "#111827", flex: 1 },
  severityBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  severityText: { color: "#FFFFFF", fontSize: 12, fontWeight: "bold" },
  diseaseStats: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 12,
  },
  statItem: { alignItems: "center" },
  statValue: { fontSize: 24, fontWeight: "bold", color: "#111827" },
  statLabel: { fontSize: 12, color: "#6B7280", marginTop: 2 },
  diseaseDescription: { fontSize: 14, color: "#374151", lineHeight: 20 },
  
  noDiseaseCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 24,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  noDiseaseTitle: { fontSize: 20, fontWeight: "bold", color: "#10B981", marginTop: 12 },
  noDiseaseText: { fontSize: 14, color: "#6B7280", textAlign: "center", marginTop: 8, lineHeight: 20 },
  
  findingCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: "#8B5CF6",
  },
  findingText: { fontSize: 14, color: "#374151", lineHeight: 20 },
  
  recommendationCard: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  recommendationNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#8B5CF6",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  recommendationNumberText: { color: "#FFFFFF", fontSize: 14, fontWeight: "bold" },
  recommendationText: { flex: 1, fontSize: 14, color: "#374151", lineHeight: 20 },
  
  metadataCard: {
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
  },
  metadataRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 },
  metadataText: { fontSize: 14, color: "#6B7280" },
  alertBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#FEE2E2",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 8,
  },
  alertText: { fontSize: 14, fontWeight: "600", color: "#EF4444" },
  
  emptyState: { alignItems: "center", paddingVertical: 48, paddingHorizontal: 32 },
  emptyTitle: { fontSize: 20, fontWeight: "bold", color: "#111827", marginTop: 16 },
  emptyText: { fontSize: 14, color: "#6B7280", textAlign: "center", marginTop: 8, lineHeight: 20 },
  emptyNote: { fontSize: 12, color: "#8B5CF6", textAlign: "center", marginTop: 12, fontStyle: "italic" },
});