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
  Image,
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
} from "lucide-react-native";
import { useRouter } from "expo-router";
import { useFocusEffect } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { getProfile } from "../../services/api";
import Footer from "../components/Footer";



export default function MyProfile({ navigation = {}, route = {} }) {
  const router = useRouter();

  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Fetch profile when screen focuses
  useFocusEffect(
    React.useCallback(() => {
      console.log("📱 MyProfile screen focused - fetching latest data");
      fetchProfile();
    }, [])
  );

  const fetchProfile = async () => {
    try {
      console.log("🔄 Fetching profile data...");
      setLoading(true);
      const userData = await getProfile();
      console.log("✅ Profile loaded:", userData);
      setProfileData(userData);
    } catch (error) {
      console.error('❌ Error fetching profile:', error);

      if (error.message.includes('No authentication token')) {
        Alert.alert(
          'Session Expired',
          'Please login again',
          [
            {
              text: 'OK',
              onPress: () => router.replace('/Screens/SignIn/SignIn')
            }
          ]
        );
      } else {
        Alert.alert(
          'Error',
          'Failed to load profile. Please try again.',
          [
            { text: 'Retry', onPress: fetchProfile },
            { text: 'Cancel', style: 'cancel' }
          ]
        );
      }
    } finally {
      setLoading(false);
    }
  };

  // Pull to refresh
  const onRefresh = async () => {
    setRefreshing(true);
    await fetchProfile();
    setRefreshing(false);
  };

  // Show loading spinner while fetching
  if (loading || !profileData) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />

        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => {
              if (navigation?.goBack) {
                navigation.goBack();
              } else {
                router.back();
              }
            }}
          >
            <ChevronLeft size={24} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My Profile</Text>
          <View style={styles.placeholder} />
        </View>

        <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={{ marginTop: 16, color: '#6B7280', fontSize: 16 }}>
            Loading profile...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            if (navigation?.goBack) {
              navigation.goBack();
            } else {
              router.back();
            }
          }}
        >
          <ChevronLeft size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Profile</Text>
        <TouchableOpacity
          style={styles.headerEditButton}
          onPress={() => {
            console.log("=== EDIT BUTTON PRESSED ===");
            console.log("Profile Data:", profileData);

            if (!profileData) {
              Alert.alert("Error", "Profile data not loaded yet");
              return;
            }

            try {
              router.push({
                pathname: "/Screens/EditProfile/EditProfile",
                params: {
                  profileData: JSON.stringify(profileData)
                }
              });
            } catch (error) {
              console.error("Navigation error:", error);
              Alert.alert("Error", "Cannot open edit screen: " + error.message);
            }
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
        {/* Profile Card */}
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
              <Text style={styles.statusText}>{profileData.status || "Active"}</Text>
            </View>
            <Text style={styles.monitoringText}>
              Monitoring Since {profileData.monitoringSince || "Jan 2024"}
            </Text>
          </View>

          <TouchableOpacity
            style={styles.changePhotoButton}
            onPress={() => {
              // Simply navigate to EditProfile
              router.push({
                pathname: "/Screens/EditProfile/EditProfile",
                params: { profileData: JSON.stringify(profileData) }
              });
            }}
          >
            <Text style={styles.changePhotoText}>Change Profile Photo</Text>
          </TouchableOpacity>
        </View>

        {/* Personal Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Personal Information</Text>

          <View style={styles.infoCard}>
            <InfoRow
              label="Full Name:"
              value={profileData.fullName || profileData.name || "Not set"}
            />
            <InfoRow
              label="Age:"
              value={profileData.age || "Not set"}
            />
            <InfoRow
              label="Gender:"
              value={profileData.gender || "Not set"}
            />
            <InfoRow
              label="Date of Birth:"
              value={profileData.dateOfBirth || "Not set"}
              icon={Calendar}
            />
            <InfoRow
              label="Phone:"
              value={profileData.phone || "Not set"}
              icon={Phone}
            />
            <InfoRow
              label="Address:"
              value={profileData.address || "Not set"}
              icon={MapPin}
            />
          </View>
        </View>

        {/* Medical Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Medical Information</Text>

          <View style={styles.infoCard}>
            <InfoRow
              label="Blood Type:"
              value={profileData.bloodType || "Not set"}
            />
            <InfoRow
              label="Height:"
              value={profileData.height ? `${profileData.height} ft` : "Not set"}
            />
            <InfoRow
              label="Weight:"
              value={profileData.weight ? `${profileData.weight} kg` : "Not set"}
            />
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>BMI:</Text>
              <View style={styles.bmiContainer}>
                <Text style={styles.infoValue}>
                  {profileData.bmi || "N/A"}
                </Text>
                <View style={styles.bmiBadge}>
                  <Text style={styles.bmiBadgeText}>
                    {getBMIStatus(profileData.bmi)}
                  </Text>
                </View>
              </View>
            </View>
            <InfoRow
              label="Allergies:"
              value={profileData.allergies || "None"}
            />
          </View>
        </View>

        {/* Health Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Health Summary</Text>

          <View style={styles.summaryGrid}>
            <View style={[styles.summaryCard, { backgroundColor: "#DBEAFE" }]}>
              <Text style={styles.summaryValue}>
                {profileData.dayMonitored || 0}
              </Text>
              <Text style={styles.summaryLabel}>Day Monitored</Text>
            </View>

            <View style={[styles.summaryCard, { backgroundColor: "#D1FAE5" }]}>
              <Text style={styles.summaryValue}>
                {profileData.normalReadings || "100%"}
              </Text>
              <Text style={styles.summaryLabel}>Normal Readings</Text>
            </View>

            <View style={[styles.summaryCard, { backgroundColor: "#FEF3C7" }]}>
              <View style={styles.alertBadge}>
                <AlertTriangle size={16} color="#F59E0B" />
                <Text style={[styles.summaryValue, { fontSize: 28 }]}>
                  {profileData.alerts || 0}
                </Text>
              </View>
              <Text style={styles.summaryLabel}>Alerts this month</Text>
            </View>

            <View style={[styles.summaryCard, { backgroundColor: "#D1FAE5" }]}>
              <View style={styles.scoreBadge}>
                <Activity size={20} color="#10B981" />
                <Text
                  style={[
                    styles.summaryValue,
                    { fontSize: 28, color: "#10B981" },
                  ]}
                >
                  {profileData.healthScore || "A+"}
                </Text>
              </View>
              <Text style={styles.summaryLabel}>Health Score</Text>
            </View>
          </View>
        </View>
      </ScrollView>
      <Footer />
    </SafeAreaView>
  );
}

// Helper function to determine BMI status
const getBMIStatus = (bmi) => {
  if (!bmi) return "N/A";
  const bmiValue = parseFloat(bmi);
  if (bmiValue < 18.5) return "Underweight";
  if (bmiValue < 25) return "Normal";
  if (bmiValue < 30) return "Overweight";
  return "Obese";
};

// Info Row Component
const InfoRow = ({ label, value, icon: Icon }) => (
  <View style={styles.infoRow}>
    <Text style={styles.infoLabel}>{label}</Text>
    <View style={styles.infoValueContainer}>
      {Icon && <Icon size={16} color="#6B7280" style={styles.infoIcon} />}
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  </View>
);

// Handle profile photo change
const handleChangePhoto = async () => {
  try {
    // Request permission
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (permissionResult.granted === false) {
      Alert.alert(
        "Permission Required",
        "Please allow access to your photos to change profile picture."
      );
      return;
    }

    // Open image picker
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setUploadingImage(true);

      try {
        // Upload image
        const response = await uploadProfileImage(result.assets[0].uri);

        // Update local state with new image
        setProfileData(prev => ({
          ...prev,
          profileImage: response.imageUrl
        }));

        Alert.alert(
          "Success! ✅",
          "Profile photo updated successfully!"
        );

        // Refresh profile data
        await fetchProfile();

      } catch (error) {
        console.error('Upload error:', error);
        Alert.alert(
          "Upload Failed",
          error.message || "Failed to upload image. Please try again."
        );
      } finally {
        setUploadingImage(false);
      }
    }
  } catch (error) {
    console.error('Image picker error:', error);
    Alert.alert('Error', 'Failed to pick image');
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
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
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#111827",
  },
  headerEditButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  headerEditText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#3B82F6",
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
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
  avatarContainer: {
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#DBEAFE",
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  avatarBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "#FFFFFF",
  },
  avatarBadgeIcon: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "#3B82F6",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarBadgeText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "bold",
  },
  profileName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 4,
  },
  profileId: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 12,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#D1FAE5",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#10B981",
    marginRight: 6,
  },
  statusText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#10B981",
  },
  monitoringText: {
    fontSize: 12,
    color: "#6B7280",
  },
  changePhotoButton: {
    backgroundColor: "#EFF6FF",
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#3B82F6",
  },
  changePhotoText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#3B82F6",
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 12,
  },
  infoCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  infoLabel: {
    fontSize: 14,
    color: "#6B7280",
    flex: 1,
  },
  infoValueContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1.5,
  },
  infoIcon: {
    marginRight: 6,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
    textAlign: "right",
    flex: 1,
  },
  bmiContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1.5,
    justifyContent: "flex-end",
  },
  bmiBadge: {
    backgroundColor: "#D1FAE5",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  bmiBadgeText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#10B981",
  },
  summaryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 12,
  },
  summaryCard: {
    width: "48%",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  summaryValue: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 12,
    color: "#6B7280",
    textAlign: "center",
  },
  alertBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 4,
  },
  scoreBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 4,
  },
  avatarImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  changePhotoButtonDisabled: {
    opacity: 0.6,
  },
});