import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ChevronLeft,
  User,
  Activity,
  Calendar,
  Phone,
  MapPin,
  AlertTriangle,
  Heart,
  Droplets,
  Thermometer,
  X,
} from "lucide-react-native";
import { useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { getProfile, updateVitalSigns } from "../../services/api";
import Footer from "../components/Footer";

export default function MyProfile({ navigation = {}, route = {} }) {
  const router = useRouter();

  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // ─── Vitals modal state ────────────────────────────────────────────────────
  const [vitalsModalVisible, setVitalsModalVisible] = useState(false);
  const [savingVitals, setSavingVitals] = useState(false);
  const [vitalsForm, setVitalsForm] = useState({
    bpSystolic: "",
    bpDiastolic: "",
    bloodSugar: "",
    temperature: "",
  });

  // Fetch profile when screen focuses
  useFocusEffect(
    useCallback(() => {
      fetchProfile();
    }, [])
  );

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const userData = await getProfile();
      setProfileData(userData);
    } catch (error) {
      console.error("❌ Error fetching profile:", error);
      if (error.message.includes("No authentication token")) {
        Alert.alert("Session Expired", "Please login again", [
          { text: "OK", onPress: () => router.replace("/Screens/SignIn/SignIn") },
        ]);
      } else {
        Alert.alert("Error", "Failed to load profile. Please try again.", [
          { text: "Retry", onPress: fetchProfile },
          { text: "Cancel", style: "cancel" },
        ]);
      }
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchProfile();
    setRefreshing(false);
  };

  // ─── Open vitals modal (pre-fill with existing values) ────────────────────
  const openVitalsModal = () => {
    if (profileData?.vitals) {
      const { bpSystolic, bpDiastolic, bloodSugar, temperature } =
        profileData.vitals;
      setVitalsForm({
        bpSystolic: bpSystolic ? String(bpSystolic) : "",
        bpDiastolic: bpDiastolic ? String(bpDiastolic) : "",
        bloodSugar: bloodSugar ? String(bloodSugar) : "",
        temperature: temperature ? String(temperature) : "",
      });
    }
    setVitalsModalVisible(true);
  };

  // ─── Save vitals to backend ───────────────────────────────────────────────
  const handleSaveVitals = async () => {
    const { bpSystolic, bpDiastolic, bloodSugar, temperature } = vitalsForm;

    // Basic validation
    if (!bpSystolic && !bpDiastolic && !bloodSugar && !temperature) {
      Alert.alert("Error", "Please enter at least one vital sign.");
      return;
    }
    if ((bpSystolic && !bpDiastolic) || (!bpSystolic && bpDiastolic)) {
      Alert.alert(
        "Error",
        "Please enter both Systolic and Diastolic values for Blood Pressure."
      );
      return;
    }

    try {
      setSavingVitals(true);
      const payload = {
        bpSystolic: bpSystolic ? Number(bpSystolic) : undefined,
        bpDiastolic: bpDiastolic ? Number(bpDiastolic) : undefined,
        bloodSugar: bloodSugar ? Number(bloodSugar) : undefined,
        temperature: temperature ? Number(temperature) : undefined,
        recordedAt: new Date().toISOString(),
      };

      const updatedVitals = await updateVitalSigns(payload);

      // Update local profile with returned vitals
      setProfileData((prev) => ({
        ...prev,
        vitals: updatedVitals.vitals || updatedVitals,
      }));

      setVitalsModalVisible(false);
      Alert.alert("Saved! ✅", "Your vital signs have been updated.");
    } catch (error) {
      console.error("❌ Error saving vitals:", error);
      Alert.alert(
        "Save Failed",
        error.message || "Could not save vitals. Please try again."
      );
    } finally {
      setSavingVitals(false);
    }
  };

  // Helper: format BP display
  const formatBP = (vitals) => {
    if (!vitals?.bpSystolic || !vitals?.bpDiastolic) return "N/A";
    return `${vitals.bpSystolic}/${vitals.bpDiastolic}`;
  };

  // ─── Loading state ────────────────────────────────────────────────────────
  if (loading || !profileData) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() =>
              navigation?.goBack ? navigation.goBack() : router.back()
            }
          >
            <ChevronLeft size={24} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My Profile</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={[styles.container, { justifyContent: "center", alignItems: "center" }]}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={{ marginTop: 16, color: "#6B7280", fontSize: 16 }}>
            Loading profile...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />

      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() =>
            navigation?.goBack ? navigation.goBack() : router.back()
          }
        >
          <ChevronLeft size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Profile</Text>
        <TouchableOpacity
          style={styles.headerEditButton}
          onPress={() => {
            if (!profileData) return;
            router.push({
              pathname: "/Screens/EditProfile/EditProfile",
              params: { profileData: JSON.stringify(profileData) },
            });
          }}
        >
          <Text style={styles.headerEditText}>Edit</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#3B82F6"]}
            tintColor="#3B82F6"
          />
        }
      >
        {/* ── Profile Card ── */}
        <View style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <User size={40} color="#3B82F6" />
              <View style={styles.avatarBadge}>
                <View style={styles.avatarBadgeIcon}>
                  <Text style={styles.avatarBadgeText}>✓</Text>
                </View>
              </View>
            </View>
          </View>
          <Text style={styles.profileName}>
            {profileData.name || profileData.fullName || "User"}
          </Text>
          <Text style={styles.profileId}>
            Patient ID: {profileData.patientId || "N/A"}
          </Text>
          <View style={styles.statusRow}>
            <View style={styles.statusBadge}>
              <View style={styles.statusDot} />
              <Text style={styles.statusText}>
                {profileData.status || "Active"}
              </Text>
            </View>
            <Text style={styles.monitoringText}>
              Monitoring Since {profileData.monitoringSince || "Jan 2024"}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.changePhotoButton}
            onPress={() =>
              router.push({
                pathname: "/Screens/EditProfile/EditProfile",
                params: { profileData: JSON.stringify(profileData) },
              })
            }
          >
            <Text style={styles.changePhotoText}>Change Profile Photo</Text>
          </TouchableOpacity>
        </View>

        {/* ══════════════════════════════════════════════════
            ── VITAL SIGNS SECTION (NEW) ──
        ══════════════════════════════════════════════════ */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>My Vital Signs</Text>
            <TouchableOpacity style={styles.updateVitalsBtn} onPress={openVitalsModal}>
              <Text style={styles.updateVitalsBtnText}>+ Update Now</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.vitalsCard}>
            {/* Blood Pressure */}
            <View style={styles.vitalItem}>
              <View style={[styles.vitalIconBox, { backgroundColor: "#FCEBEB" }]}>
                <Heart size={20} color="#E24B4A" />
              </View>
              <Text style={styles.vitalValue}>{formatBP(profileData.vitals)}</Text>
              <Text style={styles.vitalUnit}>mmHg</Text>
              <Text style={styles.vitalLabel}>Blood{"\n"}Pressure</Text>
              {profileData.vitals?.recordedAt && (
                <Text style={styles.vitalTime}>
                  {formatTimeAgo(profileData.vitals.recordedAt)}
                </Text>
              )}
            </View>

            <View style={styles.vitalDivider} />

            {/* Blood Sugar */}
            <View style={styles.vitalItem}>
              <View style={[styles.vitalIconBox, { backgroundColor: "#FAEEDA" }]}>
                <Droplets size={20} color="#BA7517" />
              </View>
              <Text style={styles.vitalValue}>
                {profileData.vitals?.bloodSugar ?? "N/A"}
              </Text>
              <Text style={styles.vitalUnit}>mg/dL</Text>
              <Text style={styles.vitalLabel}>Blood{"\n"}Sugar</Text>
              {profileData.vitals?.recordedAt && (
                <Text style={styles.vitalTime}>
                  {formatTimeAgo(profileData.vitals.recordedAt)}
                </Text>
              )}
            </View>

            <View style={styles.vitalDivider} />

            {/* Temperature */}
            <View style={styles.vitalItem}>
              <View style={[styles.vitalIconBox, { backgroundColor: "#EAF3DE" }]}>
                <Thermometer size={20} color="#3B6D11" />
              </View>
              <Text style={styles.vitalValue}>
                {profileData.vitals?.temperature ?? "N/A"}
              </Text>
              <Text style={styles.vitalUnit}>°F</Text>
              <Text style={styles.vitalLabel}>Body{"\n"}Temp</Text>
              {profileData.vitals?.recordedAt && (
                <Text style={styles.vitalTime}>
                  {formatTimeAgo(profileData.vitals.recordedAt)}
                </Text>
              )}
            </View>
          </View>

          {/* Alert banner if no vitals recorded yet */}
          {!profileData.vitals && (
            <View style={styles.noVitalsBanner}>
              <AlertTriangle size={16} color="#BA7517" />
              <Text style={styles.noVitalsText}>
                No vitals recorded yet. Tap "Update Now" to add yours.
              </Text>
            </View>
          )}
        </View>

        {/* ── Personal Information ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Personal Information</Text>
          <View style={styles.infoCard}>
            <InfoRow label="Full Name:" value={profileData.fullName || profileData.name || "Not set"} />
            <InfoRow label="Age:" value={profileData.age || "Not set"} />
            <InfoRow label="Gender:" value={profileData.gender || "Not set"} />
            <InfoRow label="Date of Birth:" value={profileData.dateOfBirth || "Not set"} icon={Calendar} />
            <InfoRow label="Phone:" value={profileData.phone || "Not set"} icon={Phone} />
            <InfoRow label="Address:" value={profileData.address || "Not set"} icon={MapPin} />
          </View>
        </View>

        {/* ── Medical Information ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Medical Information</Text>
          <View style={styles.infoCard}>
            <InfoRow label="Blood Type:" value={profileData.bloodType || "Not set"} />
            <InfoRow label="Height:" value={profileData.height ? `${profileData.height} ft` : "Not set"} />
            <InfoRow label="Weight:" value={profileData.weight ? `${profileData.weight} kg` : "Not set"} />
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>BMI:</Text>
              <View style={styles.bmiContainer}>
                <Text style={styles.infoValue}>{profileData.bmi || "N/A"}</Text>
                <View style={styles.bmiBadge}>
                  <Text style={styles.bmiBadgeText}>{getBMIStatus(profileData.bmi)}</Text>
                </View>
              </View>
            </View>
            <InfoRow label="Allergies:" value={profileData.allergies || "None"} />
          </View>
        </View>

        {/* ── Health Summary ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Health Summary</Text>
          <View style={styles.summaryGrid}>
            <View style={[styles.summaryCard, { backgroundColor: "#DBEAFE" }]}>
              <Text style={styles.summaryValue}>{profileData.dayMonitored || 0}</Text>
              <Text style={styles.summaryLabel}>Day Monitored</Text>
            </View>
            <View style={[styles.summaryCard, { backgroundColor: "#D1FAE5" }]}>
              <Text style={styles.summaryValue}>{profileData.normalReadings || "100%"}</Text>
              <Text style={styles.summaryLabel}>Normal Readings</Text>
            </View>
            <View style={[styles.summaryCard, { backgroundColor: "#FEF3C7" }]}>
              <View style={styles.alertBadge}>
                <AlertTriangle size={16} color="#F59E0B" />
                <Text style={[styles.summaryValue, { fontSize: 28 }]}>{profileData.alerts || 0}</Text>
              </View>
              <Text style={styles.summaryLabel}>Alerts this month</Text>
            </View>
            <View style={[styles.summaryCard, { backgroundColor: "#D1FAE5" }]}>
              <View style={styles.scoreBadge}>
                <Activity size={20} color="#10B981" />
                <Text style={[styles.summaryValue, { fontSize: 28, color: "#10B981" }]}>
                  {profileData.healthScore || "A+"}
                </Text>
              </View>
              <Text style={styles.summaryLabel}>Health Score</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      <Footer />

      {/* ══════════════════════════════════════════════════
          ── VITALS UPDATE MODAL (SLIDE-UP PANEL) ──
      ══════════════════════════════════════════════════ */}
      <Modal
        visible={vitalsModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setVitalsModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalOverlay}
        >
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => setVitalsModalVisible(false)}
          />

          <View style={styles.modalPanel}>
            {/* Handle bar */}
            <View style={styles.modalHandle} />

            {/* Modal header */}
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Update Vital Signs</Text>
                <Text style={styles.modalSubtitle}>
                  Enter your current readings
                </Text>
              </View>
              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={() => setVitalsModalVisible(false)}
              >
                <X size={20} color="#6B7280" />
              </TouchableOpacity>
            </View>

            {/* ── Blood Pressure ── */}
            <View style={styles.formGroup}>
              <View style={styles.formLabelRow}>
                <View style={[styles.formDot, { backgroundColor: "#E24B4A" }]} />
                <Text style={styles.formLabel}>Blood Pressure (mmHg)</Text>
              </View>
              <View style={styles.bpRow}>
                <View style={styles.bpInputWrapper}>
                  <TextInput
                    style={styles.formInput}
                    placeholder="Systolic (e.g. 120)"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="numeric"
                    value={vitalsForm.bpSystolic}
                    onChangeText={(v) =>
                      setVitalsForm((f) => ({ ...f, bpSystolic: v }))
                    }
                    maxLength={3}
                  />
                  <Text style={styles.bpSlash}>/</Text>
                </View>
                <TextInput
                  style={[styles.formInput, { flex: 1 }]}
                  placeholder="Diastolic (e.g. 80)"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="numeric"
                  value={vitalsForm.bpDiastolic}
                  onChangeText={(v) =>
                    setVitalsForm((f) => ({ ...f, bpDiastolic: v }))
                  }
                  maxLength={3}
                />
              </View>
            </View>

            {/* ── Blood Sugar ── */}
            <View style={styles.formGroup}>
              <View style={styles.formLabelRow}>
                <View style={[styles.formDot, { backgroundColor: "#EF9F27" }]} />
                <Text style={styles.formLabel}>Blood Sugar (mg/dL)</Text>
              </View>
              <TextInput
                style={styles.formInput}
                placeholder="e.g. 95"
                placeholderTextColor="#9CA3AF"
                keyboardType="numeric"
                value={vitalsForm.bloodSugar}
                onChangeText={(v) =>
                  setVitalsForm((f) => ({ ...f, bloodSugar: v }))
                }
                maxLength={4}
              />
            </View>

            {/* ── Temperature ── */}
            <View style={styles.formGroup}>
              <View style={styles.formLabelRow}>
                <View style={[styles.formDot, { backgroundColor: "#639922" }]} />
                <Text style={styles.formLabel}>Body Temperature (°F)</Text>
              </View>
              <TextInput
                style={styles.formInput}
                placeholder="e.g. 98.6"
                placeholderTextColor="#9CA3AF"
                keyboardType="decimal-pad"
                value={vitalsForm.temperature}
                onChangeText={(v) =>
                  setVitalsForm((f) => ({ ...f, temperature: v }))
                }
                maxLength={5}
              />
            </View>

            {/* ── Save Button ── */}
            <TouchableOpacity
              style={[styles.saveBtn, savingVitals && styles.saveBtnDisabled]}
              onPress={handleSaveVitals}
              disabled={savingVitals}
            >
              {savingVitals ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.saveBtnText}>Save Readings</Text>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

// ─── Helper: time ago ─────────────────────────────────────────────────────────
const formatTimeAgo = (isoString) => {
  const diff = Date.now() - new Date(isoString).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
};

const getBMIStatus = (bmi) => {
  if (!bmi) return "N/A";
  const v = parseFloat(bmi);
  if (v < 18.5) return "Underweight";
  if (v < 25) return "Normal";
  if (v < 30) return "Overweight";
  return "Obese";
};

const InfoRow = ({ label, value, icon: Icon }) => (
  <View style={styles.infoRow}>
    <Text style={styles.infoLabel}>{label}</Text>
    <View style={styles.infoValueContainer}>
      {Icon && <Icon size={16} color="#6B7280" style={styles.infoIcon} />}
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  </View>
);

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#F8FAFC",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  backButton: { width: 40, height: 40, justifyContent: "center", alignItems: "center" },
  headerTitle: { fontSize: 20, fontWeight: "bold", color: "#111827" },
  headerEditButton: { paddingHorizontal: 12, paddingVertical: 6 },
  headerEditText: { fontSize: 16, fontWeight: "600", color: "#3B82F6" },
  placeholder: { width: 40 },
  scrollView: { flex: 1 },

  // Profile card
  profileCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 24,
    margin: 16,
    marginBottom: 12,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  avatarContainer: { marginBottom: 16 },
  avatar: {
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: "#DBEAFE",
    justifyContent: "center", alignItems: "center",
    position: "relative",
  },
  avatarBadge: {
    position: "absolute", bottom: 0, right: 0,
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: "#FFFFFF",
    justifyContent: "center", alignItems: "center",
    borderWidth: 3, borderColor: "#FFFFFF",
  },
  avatarBadgeIcon: {
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: "#3B82F6",
    justifyContent: "center", alignItems: "center",
  },
  avatarBadgeText: { color: "#FFFFFF", fontSize: 14, fontWeight: "bold" },
  profileName: { fontSize: 24, fontWeight: "bold", color: "#111827", marginBottom: 4 },
  profileId: { fontSize: 14, color: "#6B7280", marginBottom: 12 },
  statusRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 16 },
  statusBadge: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: "#D1FAE5", paddingHorizontal: 12,
    paddingVertical: 4, borderRadius: 12,
  },
  statusDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#10B981", marginRight: 6 },
  statusText: { fontSize: 14, fontWeight: "600", color: "#10B981" },
  monitoringText: { fontSize: 12, color: "#6B7280" },
  changePhotoButton: {
    backgroundColor: "#EFF6FF", paddingHorizontal: 24,
    paddingVertical: 10, borderRadius: 8,
    borderWidth: 1, borderColor: "#3B82F6",
  },
  changePhotoText: { fontSize: 14, fontWeight: "600", color: "#3B82F6" },

  // Section
  section: { paddingHorizontal: 16, marginBottom: 12 },
  sectionTitle: { fontSize: 18, fontWeight: "bold", color: "#111827", marginBottom: 12 },
  sectionHeaderRow: {
    flexDirection: "row", justifyContent: "space-between",
    alignItems: "center", marginBottom: 12,
  },
  updateVitalsBtn: {
    backgroundColor: "#EFF6FF",
    borderWidth: 1, borderColor: "#3B82F6",
    paddingHorizontal: 14, paddingVertical: 6,
    borderRadius: 8,
  },
  updateVitalsBtnText: { fontSize: 13, fontWeight: "600", color: "#3B82F6" },

  // Vitals card
  vitalsCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    flexDirection: "row",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    overflow: "hidden",
  },
  vitalItem: {
    flex: 1, alignItems: "center",
    paddingVertical: 16, paddingHorizontal: 8,
  },
  vitalDivider: { width: 1, backgroundColor: "#F3F4F6", marginVertical: 12 },
  vitalIconBox: {
    width: 38, height: 38, borderRadius: 10,
    justifyContent: "center", alignItems: "center",
    marginBottom: 8,
  },
  vitalValue: { fontSize: 16, fontWeight: "700", color: "#111827" },
  vitalUnit: { fontSize: 10, color: "#9CA3AF", marginTop: 1 },
  vitalLabel: { fontSize: 11, color: "#6B7280", textAlign: "center", marginTop: 4, lineHeight: 15 },
  vitalTime: { fontSize: 10, color: "#9CA3AF", marginTop: 4 },

  noVitalsBanner: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: "#FAEEDA",
    borderRadius: 8, padding: 10, marginTop: 10,
    gap: 8,
  },
  noVitalsText: { fontSize: 12, color: "#854F0B", flex: 1 },

  // Info card
  infoCard: {
    backgroundColor: "#FFFFFF", borderRadius: 12, padding: 16,
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 2, elevation: 2,
  },
  infoRow: {
    flexDirection: "row", justifyContent: "space-between",
    alignItems: "center", paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: "#F3F4F6",
  },
  infoLabel: { fontSize: 14, color: "#6B7280", flex: 1 },
  infoValueContainer: { flexDirection: "row", alignItems: "center", flex: 1.5 },
  infoIcon: { marginRight: 6 },
  infoValue: { fontSize: 14, fontWeight: "600", color: "#111827", textAlign: "right", flex: 1 },
  bmiContainer: { flexDirection: "row", alignItems: "center", gap: 8, flex: 1.5, justifyContent: "flex-end" },
  bmiBadge: { backgroundColor: "#D1FAE5", paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  bmiBadgeText: { fontSize: 11, fontWeight: "600", color: "#10B981" },

  // Summary grid
  summaryGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", gap: 12 },
  summaryCard: {
    width: "48%", borderRadius: 12, padding: 16,
    alignItems: "center", shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05,
    shadowRadius: 2, elevation: 2,
  },
  summaryValue: { fontSize: 32, fontWeight: "bold", color: "#111827", marginBottom: 4 },
  summaryLabel: { fontSize: 12, color: "#6B7280", textAlign: "center" },
  alertBadge: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 4 },
  scoreBadge: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 4 },

  // Modal / slide-up panel
  modalOverlay: { flex: 1, justifyContent: "flex-end" },
  modalBackdrop: {
    position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  modalPanel: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 20, borderTopRightRadius: 20,
    paddingHorizontal: 20, paddingBottom: 34, paddingTop: 12,
  },
  modalHandle: {
    width: 40, height: 4, backgroundColor: "#D1D5DB",
    borderRadius: 4, alignSelf: "center", marginBottom: 16,
  },
  modalHeader: {
    flexDirection: "row", justifyContent: "space-between",
    alignItems: "flex-start", marginBottom: 20,
  },
  modalTitle: { fontSize: 18, fontWeight: "700", color: "#111827" },
  modalSubtitle: { fontSize: 13, color: "#6B7280", marginTop: 2 },
  modalCloseBtn: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: "#F3F4F6",
    justifyContent: "center", alignItems: "center",
  },

  // Form
  formGroup: { marginBottom: 16 },
  formLabelRow: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  formDot: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
  formLabel: { fontSize: 13, fontWeight: "600", color: "#374151" },
  formInput: {
    borderWidth: 1, borderColor: "#D1D5DB",
    borderRadius: 10, paddingHorizontal: 14,
    paddingVertical: 12, fontSize: 15, color: "#111827",
    backgroundColor: "#FAFAFA",
  },
  bpRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  bpInputWrapper: { flex: 1, flexDirection: "row", alignItems: "center" },
  bpSlash: { fontSize: 22, color: "#9CA3AF", marginLeft: 8 },

  saveBtn: {
    backgroundColor: "#3B82F6",
    borderRadius: 12, paddingVertical: 14,
    alignItems: "center", marginTop: 6,
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { color: "#FFFFFF", fontSize: 16, fontWeight: "700" },
});