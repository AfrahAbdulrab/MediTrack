// Screens/EditProfile/EditProfile.jsx
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  Alert,
} from "react-native";
import {
  ChevronLeft,
  User,
  Edit2,
} from "lucide-react-native";
import { useRouter } from "expo-router";
import { updateProfile } from "../../services/api";

export default function EditProfile({ navigation = {}, route = {} }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  // Parse profile data from params
  const initialData = route?.params?.profileData
    ? JSON.parse(route.params.profileData)
    : {};

  const [formData, setFormData] = useState({
    fullName: initialData.fullName || initialData.name || "",
    dateOfBirth: initialData.dateOfBirth || "",
    gender: initialData.gender || "Male",
    phone: initialData.phone || "",
    email: initialData.email || "",
    age: initialData.age || "",
    bloodType: initialData.bloodType || "B+",
    height: initialData.height || "",
    weight: initialData.weight || "",
    allergies: initialData.allergies || "",
    medicalHistory: initialData.medicalHistory || "",
    address: initialData.address || "",
  });

  const [selectedGender, setSelectedGender] = useState(formData.gender);

  const updateField = (field, value) => {
    setFormData({ ...formData, [field]: value });
  };

  const validateForm = () => {
    // Basic validation
    if (!formData.fullName.trim()) {
      Alert.alert('Validation Error', 'Full name is required');
      return false;
    }

    if (formData.fullName.trim().length < 2) {
      Alert.alert('Validation Error', 'Name must be at least 2 characters');
      return false;
    }

    if (formData.phone && formData.phone.length < 10) {
      Alert.alert('Validation Error', 'Please enter a valid phone number');
      return false;
    }

    if (formData.age && (isNaN(formData.age) || formData.age < 1 || formData.age > 150)) {
      Alert.alert('Validation Error', 'Please enter a valid age');
      return false;
    }

    if (formData.height && (isNaN(formData.height) || formData.height < 1)) {
      Alert.alert('Validation Error', 'Please enter a valid height');
      return false;
    }

    if (formData.weight && (isNaN(formData.weight) || formData.weight < 1)) {
      Alert.alert('Validation Error', 'Please enter a valid weight');
      return false;
    }

    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);
      const updatedData = {
        fullName: formData.fullName.trim(),
        name: formData.fullName.trim(),
        dateOfBirth: formData.dateOfBirth,
        gender: selectedGender,
        phone: formData.phone,
        age: formData.age,
        bloodType: formData.bloodType,
        height: formData.height,
        weight: formData.weight,
        allergies: formData.allergies || "None",
        medicalHistory: formData.medicalHistory || "None",
        address: formData.address,
      };

      const savedProfile = await updateProfile(updatedData);

      Alert.alert('Success! ✅', 'Profile updated successfully!', [
        {
          text: 'OK',
          onPress: () => {
            // ✅ FIX: Navigate with refresh=true param
            router.push({
              pathname: '/Screens/MyProfile/MyProfile',
              params: { refresh: 'true', timestamp: Date.now() }
            });
          }
        }
      ]);
    } catch (error) {
      console.error('Save error:', error);
      Alert.alert('Error', error.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    Alert.alert(
      'Discard Changes?',
      'Are you sure you want to discard your changes?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes',
          style: 'destructive',
          onPress: () => {
            if (router.canGoBack()) {
              router.back();
            } else {
              router.push('/Frontend/app/Screens/MyProfile/MyProfile');
            }
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleCancel}
        >
          <ChevronLeft size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* Profile Picture */}
        <View style={styles.profileSection}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <User size={40} color="#3B82F6" />
            </View>
            <TouchableOpacity
              style={styles.editIconButton}
              onPress={() => {
                Alert.alert('Coming Soon', 'Profile photo upload will be available soon!');
              }}
            >
              <Edit2 size={16} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
          <Text style={styles.profilePictureText}>Profile Picture</Text>
        </View>

        {/* Basic Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Basic Details</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Full Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter Your Full Name"
              placeholderTextColor="#9CA3AF"
              value={formData.fullName}
              onChangeText={(text) => updateField("fullName", text)}
              editable={!loading}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Date of Birth</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., November 26, 2001"
              placeholderTextColor="#9CA3AF"
              value={formData.dateOfBirth}
              onChangeText={(text) => updateField("dateOfBirth", text)}
              editable={!loading}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Gender</Text>
            <View style={styles.genderContainer}>
              <TouchableOpacity
                style={[
                  styles.genderButton,
                  selectedGender === "Female" && styles.genderButtonActive,
                ]}
                onPress={() => {
                  if (!loading) {
                    setSelectedGender("Female");
                    updateField("gender", "Female");
                  }
                }}
                disabled={loading}
              >
                <View
                  style={[
                    styles.radioOuter,
                    selectedGender === "Female" && styles.radioOuterActive,
                  ]}
                >
                  {selectedGender === "Female" && (
                    <View style={styles.radioInner} />
                  )}
                </View>
                <Text
                  style={[
                    styles.genderText,
                    selectedGender === "Female" && styles.genderTextActive,
                  ]}
                >
                  Female
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.genderButton,
                  selectedGender === "Male" && styles.genderButtonActive,
                ]}
                onPress={() => {
                  if (!loading) {
                    setSelectedGender("Male");
                    updateField("gender", "Male");
                  }
                }}
                disabled={loading}
              >
                <View
                  style={[
                    styles.radioOuter,
                    selectedGender === "Male" && styles.radioOuterActive,
                  ]}
                >
                  {selectedGender === "Male" && (
                    <View style={styles.radioInner} />
                  )}
                </View>
                <Text
                  style={[
                    styles.genderText,
                    selectedGender === "Male" && styles.genderTextActive,
                  ]}
                >
                  Male
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Contact Detail */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact Detail</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Phone Number</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter Your Number"
              placeholderTextColor="#9CA3AF"
              value={formData.phone}
              onChangeText={(text) => updateField("phone", text)}
              keyboardType="phone-pad"
              editable={!loading}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={[styles.input, styles.disabledInput]}
              placeholder="Enter Your Email"
              placeholderTextColor="#9CA3AF"
              value={formData.email}
              editable={false}
            />
            <Text style={styles.helperText}>
              Email cannot be changed
            </Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Address</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter Your Address"
              placeholderTextColor="#9CA3AF"
              value={formData.address}
              onChangeText={(text) => updateField("address", text)}
              editable={!loading}
            />
          </View>
        </View>

        {/* Personal Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Personal Information</Text>

          <View style={styles.rowInputs}>
            <View style={styles.halfInput}>
              <Text style={styles.label}>Age</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., 23"
                placeholderTextColor="#9CA3AF"
                value={formData.age}
                onChangeText={(text) => updateField("age", text)}
                keyboardType="numeric"
                editable={!loading}
              />
            </View>

            <View style={styles.halfInput}>
              <Text style={styles.label}>Blood Type</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., B+"
                placeholderTextColor="#9CA3AF"
                value={formData.bloodType}
                onChangeText={(text) => updateField("bloodType", text)}
                editable={!loading}
              />
            </View>
          </View>

          <View style={styles.rowInputs}>
            <View style={styles.halfInput}>
              <Text style={styles.label}>Height (ft)</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., 5.8"
                placeholderTextColor="#9CA3AF"
                value={formData.height}
                onChangeText={(text) => updateField("height", text)}
                keyboardType="decimal-pad"
                editable={!loading}
              />
            </View>

            <View style={styles.halfInput}>
              <Text style={styles.label}>Weight (kg)</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., 68"
                placeholderTextColor="#9CA3AF"
                value={formData.weight}
                onChangeText={(text) => updateField("weight", text)}
                keyboardType="decimal-pad"
                editable={!loading}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Allergies</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="List any allergies (medications, food, etc.)"
              placeholderTextColor="#9CA3AF"
              value={formData.allergies}
              onChangeText={(text) => updateField("allergies", text)}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              editable={!loading}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Medical History</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Any significant medical conditions or history"
              placeholderTextColor="#9CA3AF"
              value={formData.medicalHistory}
              onChangeText={(text) => updateField("medicalHistory", text)}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              editable={!loading}
            />
          </View>
        </View>

        {/* Save Button */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.saveButton, loading && styles.saveButtonDisabled]}
            onPress={handleSave}
            activeOpacity={0.8}
            disabled={loading}
          >
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator color="#FFFFFF" size="small" />
                <Text style={styles.saveButtonText}>Saving...</Text>
              </View>
            ) : (
              <Text style={styles.saveButtonText}>Save Profile</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.cancelButton}
            onPress={handleCancel}
            activeOpacity={0.8}
            disabled={loading}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

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
    backgroundColor: "#FFFFFF",
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
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  profileSection: {
    alignItems: "center",
    paddingVertical: 24,
    backgroundColor: "#FFFFFF",
    marginBottom: 16,
  },
  avatarContainer: {
    position: "relative",
    marginBottom: 12,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#DBEAFE",
    justifyContent: "center",
    alignItems: "center",
  },
  editIconButton: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#3B82F6",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "#FFFFFF",
  },
  profilePictureText: {
    fontSize: 14,
    color: "#6B7280",
  },
  section: {
    backgroundColor: "#FFFFFF",
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    color: "#111827",
  },
  disabledInput: {
    backgroundColor: "#F3F4F6",
    color: "#9CA3AF",
  },
  helperText: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 4,
    fontStyle: "italic",
  },
  textArea: {
    height: 80,
    textAlignVertical: "top",
    paddingTop: 12,
  },
  genderContainer: {
    flexDirection: "row",
    gap: 12,
  },
  genderButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  genderButtonActive: {
    backgroundColor: "#EFF6FF",
    borderColor: "#3B82F6",
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#D1D5DB",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  radioOuterActive: {
    borderColor: "#3B82F6",
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#3B82F6",
  },
  genderText: {
    fontSize: 14,
    color: "#6B7280",
  },
  genderTextActive: {
    color: "#3B82F6",
    fontWeight: "600",
  },
  rowInputs: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  halfInput: {
    flex: 1,
  },
  buttonContainer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 12,
  },
  saveButton: {
    backgroundColor: "#3B82F6",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    shadowColor: "#3B82F6",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  cancelButton: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#6B7280",
  },
});