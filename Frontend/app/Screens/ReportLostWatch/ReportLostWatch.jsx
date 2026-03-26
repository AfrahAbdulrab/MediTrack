import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  StatusBar,
  Modal,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from 'expo-router';
import { ChevronLeft, AlertTriangle } from "lucide-react-native";
import { reportLostWatch } from "../../services/api";

export default function ReportLostWatch() {
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  const handleReportLost = async () => {
    try {
      setLoading(true);
      
      const data = {
        deviceId: "Meditrack W4704",
        lastKnownLocation: "Gulberg Green, Islamabad",
        lastActive: "2 hours ago",
        reason: reason || "No reason provided",
      };

      console.log("📡 Sending data:", data);
      
      const result = await reportLostWatch(data);
      
      console.log("✅ Success:", result);
      
      setShowModal(false);
      
      Alert.alert(
        "✅ Success",
        "Watch has been reported as lost and saved in database!",
        [
          {
            text: "OK",
            onPress: () => router.back()
          }
        ]
      );
    } catch (error) {
      console.error("❌ Error:", error);
      setShowModal(false);
      Alert.alert(
        "❌ Error",
        error.message || "Failed to report lost watch. Please check console.",
        [{ text: "OK" }]
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ChevronLeft size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Report Lost Watch</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Info Card */}
        <View style={styles.infoCard}>
          <AlertTriangle size={48} color="#F59E0B" />
          <Text style={styles.infoTitle}>Report Your Lost Watch</Text>
          <Text style={styles.infoDescription}>
            This will immediately save your report in database and notify administrators.
          </Text>
        </View>

        {/* Device Info */}
        <View style={styles.deviceCard}>
          <Text style={styles.deviceLabel}>Device ID</Text>
          <Text style={styles.deviceValue}>Meditrack W4704</Text>
          
          <Text style={styles.deviceLabel}>Last Known Location</Text>
          <Text style={styles.deviceValue}>Gulberg Green, Islamabad</Text>
          
          <Text style={styles.deviceLabel}>Last Active</Text>
          <Text style={styles.deviceValue}>2 hours ago</Text>
        </View>

        {/* Reason Input */}
        <View style={styles.inputCard}>
          <Text style={styles.inputLabel}>Reason (Optional)</Text>
          <TextInput
            style={styles.textArea}
            placeholder="Describe when and where you lost your watch..."
            placeholderTextColor="#9CA3AF"
            value={reason}
            onChangeText={setReason}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        {/* Warning Box */}
        <View style={styles.warningCard}>
          <AlertTriangle size={20} color="#EF4444" />
          <Text style={styles.warningText}>
            This report will be saved in database immediately.
          </Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.reportButton}
            onPress={() => setShowModal(true)}
            activeOpacity={0.8}
          >
            <Text style={styles.reportButtonText}>Report Lost</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => router.back()}
            activeOpacity={0.8}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Confirmation Modal */}
      <Modal
        visible={showModal}
        transparent
        animationType="fade"
        onRequestClose={() => !loading && setShowModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <AlertTriangle size={48} color="#F59E0B" />
            <Text style={styles.modalTitle}>Confirm Report</Text>
            <Text style={styles.modalDescription}>
              Are you sure you want to report this watch as lost?
            </Text>

            {reason && (
              <View style={styles.reasonBox}>
                <Text style={styles.reasonLabel}>Reason:</Text>
                <Text style={styles.reasonText}>{reason}</Text>
              </View>
            )}

            <TouchableOpacity
              style={[styles.confirmButton, loading && styles.buttonDisabled]}
              onPress={handleReportLost}
              activeOpacity={0.8}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.confirmButtonText}>Yes, Report Lost</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalCancelButton}
              onPress={() => !loading && setShowModal(false)}
              activeOpacity={0.8}
              disabled={loading}
            >
              <Text style={styles.modalCancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// ... (styles remain same)
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9FAFB" },
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
  headerTitle: { fontSize: 18, fontWeight: "bold", color: "#111827" },
  placeholder: { width: 40 },
  content: { flex: 1, padding: 16 },
  infoCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 24,
    alignItems: "center",
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  infoTitle: { fontSize: 20, fontWeight: "bold", color: "#111827", marginTop: 16, marginBottom: 8, textAlign: "center" },
  infoDescription: { fontSize: 14, color: "#6B7280", textAlign: "center", lineHeight: 20 },
  deviceCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  deviceLabel: { fontSize: 12, color: "#6B7280", marginTop: 12, marginBottom: 4 },
  deviceValue: { fontSize: 16, fontWeight: "600", color: "#111827" },
  inputCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  inputLabel: { fontSize: 14, fontWeight: "600", color: "#374151", marginBottom: 8 },
  textArea: {
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: "#111827",
    minHeight: 100,
  },
  warningCard: {
    flexDirection: "row",
    backgroundColor: "#FEF2F2",
    borderRadius: 8,
    padding: 12,
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: "#EF4444",
  },
  warningText: { flex: 1, fontSize: 13, color: "#991B1B", marginLeft: 12, lineHeight: 18 },
  buttonContainer: { marginBottom: 32 },
  reportButton: {
    backgroundColor: "#EF4444",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    marginBottom: 12,
    shadowColor: "#EF4444",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  reportButtonText: { fontSize: 16, fontWeight: "bold", color: "#FFFFFF" },
  cancelButton: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  cancelButtonText: { fontSize: 16, fontWeight: "600", color: "#6B7280" },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 24,
    width: "100%",
    maxWidth: 400,
    alignItems: "center",
  },
  modalTitle: { fontSize: 20, fontWeight: "bold", color: "#111827", marginTop: 16, marginBottom: 8, textAlign: "center" },
  modalDescription: { fontSize: 14, color: "#6B7280", textAlign: "center", lineHeight: 20, marginBottom: 16 },
  reasonBox: { width: "100%", backgroundColor: "#F9FAFB", borderRadius: 8, padding: 12, marginBottom: 20 },
  reasonLabel: { fontSize: 12, fontWeight: "600", color: "#374151", marginBottom: 6 },
  reasonText: { fontSize: 14, color: "#111827", lineHeight: 20 },
  confirmButton: {
    backgroundColor: "#EF4444",
    borderRadius: 12,
    paddingVertical: 14,
    width: "100%",
    alignItems: "center",
    marginBottom: 12,
  },
  confirmButtonText: { fontSize: 16, fontWeight: "bold", color: "#FFFFFF" },
  modalCancelButton: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingVertical: 14,
    width: "100%",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  modalCancelButtonText: { fontSize: 16, fontWeight: "600", color: "#6B7280" },
  buttonDisabled: { opacity: 0.6 },
});