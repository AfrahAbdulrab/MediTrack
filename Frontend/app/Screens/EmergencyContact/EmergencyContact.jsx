import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  FlatList,
  Alert,
  ActivityIndicator,
} from "react-native";
import * as SMS from "expo-sms";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import axios from "axios";

// 🔥 FIXED API URL
const API_BASE = "http://172.21.247.68:5000/api/emergency-contacts";

// 🆔 Your User ID (change this to match your actual user)
const USER_ID = "690c4c93f611241fa1fc43f5";

export default function EmergencyContact() {
  const router = useRouter();

  const [modalVisible, setModalVisible] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [selectedContact, setSelectedContact] = useState(null);
  const [editingContact, setEditingContact] = useState(null);
  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [relationship, setRelationship] = useState("");
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [sendingAlert, setSendingAlert] = useState(false);

  // Load contacts from backend
  useEffect(() => {
    fetchContacts();
  }, []);

  // 🔥 Save contacts to AsyncStorage whenever contacts change
  useEffect(() => {
    if (contacts.length >= 0) {
      saveToAsyncStorage(contacts);
    }
  }, [contacts]);

  // 💾 Save to AsyncStorage for AIHealthScreen
  const saveToAsyncStorage = async (contactsList) => {
    try {
      const formattedContacts = contactsList.map(contact => ({
        name: contact.name,
        phone: contact.phone,
        relationship: contact.relationship
      }));
      
      await AsyncStorage.setItem('emergencyContacts', JSON.stringify(formattedContacts));
      console.log('✅ Saved to AsyncStorage:', formattedContacts.length, 'contacts');
    } catch (error) {
      console.log('❌ Error saving to AsyncStorage:', error);
    }
  };

  // 📥 Fetch all contacts from backend
  const fetchContacts = async () => {
    try {
      setLoading(true);
      console.log(`📥 Fetching contacts for user: ${USER_ID}`);
      
      const response = await axios.get(`${API_BASE}/user/${USER_ID}`);
      
      console.log('✅ Response:', response.data);
      
      if (response.data.success) {
        setContacts(response.data.contacts);
        await saveToAsyncStorage(response.data.contacts);
      }
    } catch (err) {
      console.log("❌ Error fetching contacts:", err);
      
      if (err.response) {
        console.log("Error response:", err.response.data);
      } else if (err.request) {
        Alert.alert(
          "Connection Error",
          "Cannot connect to server. Check IP and backend."
        );
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // 🚨 NEW: Send Emergency Alert to ALL Contacts
  const sendEmergencyAlertToAll = async () => {
    try {
      setSendingAlert(true);
      console.log('🚨 Sending emergency alert to all contacts...');

      // Step 1: Backend se saare contacts fetch karo
      const response = await axios.post(`${API_BASE}/send-alert`, {
        userId: USER_ID,
        alertMessage: "🚨 HEALTH ALERT: Abnormal vitals detected! Please check immediately.",
        vitalsData: {
          timestamp: new Date().toISOString(),
          source: "Manual Alert"
        }
      });

      if (response.data.success) {
        const { contacts: alertContacts, alertMessage } = response.data;
        
        if (alertContacts.length === 0) {
          Alert.alert("No Contacts", "Please add emergency contacts first.");
          return;
        }

        console.log(`✅ Found ${alertContacts.length} contacts to alert`);

        // Step 2: Check if SMS is available
        const isAvailable = await SMS.isAvailableAsync();
        if (!isAvailable) {
          Alert.alert("Error", "SMS not supported on this device");
          return;
        }

        // Step 3: Sabhi contacts ko SMS bhejo (EK HI DAFA)
        const phoneNumbers = alertContacts.map(contact => contact.phone);
        
        await SMS.sendSMSAsync(phoneNumbers, alertMessage);

        console.log('✅ SMS sent to all contacts');
        
        Alert.alert(
          "✅ Alert Sent Successfully!", 
          `Emergency SMS sent to ${alertContacts.length} contact(s):\n\n${alertContacts.map(c => `${c.name} (${c.relationship})`).join('\n')}`,
          [{ text: "OK" }]
        );
      }

    } catch (error) {
      console.error('❌ Error sending emergency alert:', error);
      
      if (error.response) {
        Alert.alert("Error", error.response.data.message || "Failed to send alert");
      } else {
        Alert.alert("Error", "Failed to send emergency alert. Check your connection.");
      }
    } finally {
      setSendingAlert(false);
    }
  };

  // 📤 Add or Edit contact
  const handleAddOrEditContact = async () => {
    if (!fullName || !phoneNumber || !relationship) {
      Alert.alert("Missing Info", "Please fill all fields.");
      return;
    }

    try {
      setLoading(true);

      if (editingContact) {
        console.log(`✏️ Updating contact: ${editingContact._id}`);
        
        const response = await axios.put(
          `${API_BASE}/update/${editingContact._id}`,
          { 
            name: fullName,
            phone: phoneNumber,
            relationship: relationship
          }
        );

        if (response.data.success) {
          Alert.alert("Success", "Contact updated successfully!");
          await fetchContacts();
        }
      } else {
        console.log('➕ Adding new contact');
        
        const response = await axios.post(`${API_BASE}/add`, {
          userId: USER_ID,
          name: fullName,
          phone: phoneNumber,
          relationship: relationship,
          isPrimary: contacts.length === 0
        });

        if (response.data.success) {
          Alert.alert("Success", "Contact added successfully!");
          await fetchContacts();
        }
      }

      closeModal();
    } catch (err) {
      console.log("❌ Error saving contact:", err);
      
      if (err.response) {
        Alert.alert("Error", err.response.data.message || "Failed to save");
      } else {
        Alert.alert("Error", "Failed to save contact");
      }
    } finally {
      setLoading(false);
    }
  };

  // 🗑️ Delete contact
  const handleDeleteContact = (id) => {
    Alert.alert(
      "Delete Contact",
      "Are you sure you want to delete this contact?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              console.log(`🗑️ Deleting contact: ${id}`);
              
              const response = await axios.delete(`${API_BASE}/delete/${id}`);
              
              if (response.data.success) {
                Alert.alert("Success", "Contact deleted successfully!");
                await fetchContacts();
              }
              setMenuVisible(false);
            } catch (err) {
              console.log("❌ Error deleting contact:", err);
              Alert.alert("Error", "Failed to delete contact");
            }
          },
        },
      ]
    );
  };

  // 📲 Send SMS to individual contact
  const handleSendSMS = async (phone) => {
    const isAvailable = await SMS.isAvailableAsync();
    if (!isAvailable) {
      Alert.alert("SMS not supported on this device");
      return;
    }

    await SMS.sendSMSAsync(
      [phone],
      "🚨 Health Alert: Abnormal vitals detected! Please check immediately."
    );
  };

  const openModalForEdit = (contact) => {
    setEditingContact(contact);
    setFullName(contact.name);
    setPhoneNumber(contact.phone);
    setRelationship(contact.relationship);
    setModalVisible(true);
    setMenuVisible(false);
  };

  const closeModal = () => {
    setModalVisible(false);
    setEditingContact(null);
    setFullName("");
    setPhoneNumber("");
    setRelationship("");
  };

  const openMenu = (contact) => {
    setSelectedContact(contact);
    setMenuVisible(true);
  };

  const renderContact = ({ item }) => (
    <View style={styles.contactCard}>
      <View style={styles.contactLeft}>
        <Ionicons name="person-circle" size={45} color="#007BFF" />
        <View>
          <Text style={styles.contactName}>{item.name}</Text>
          <Text style={styles.contactDetails}>
            {item.relationship} • {item.phone}
          </Text>
        </View>
      </View>

      <View style={styles.contactActions}>
        <TouchableOpacity onPress={() => handleSendSMS(item.phone)}>
          <Ionicons name="chatbubble-ellipses-outline" size={23} color="#007BFF" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => openMenu(item)}>
          <Ionicons name="ellipsis-vertical" size={23} color="#475569" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header with Back Button */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="chevron-back-outline" size={28} color="#828c97ff" />
        </TouchableOpacity>
        <Text style={styles.title}>Emergency Contacts</Text>
      </View>

      <Text style={styles.infoBox}>
        🚨 Contacts below will be notified via SMS if abnormal vitals are detected.
      </Text>

      {/* 🚨 NEW: Emergency Alert Button */}
      <TouchableOpacity
        style={styles.emergencyAlertButton}
        onPress={sendEmergencyAlertToAll}
        disabled={sendingAlert || contacts.length === 0}
      >
        {sendingAlert ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <>
            <Ionicons name="warning" size={24} color="#fff" />
            <Text style={styles.emergencyAlertText}>
              Send Emergency Alert to All
            </Text>
          </>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.addButton}
        onPress={() => setModalVisible(true)}
      >
        <Ionicons name="add-circle-outline" size={24} color="#fff" />
        <Text style={styles.addButtonText}>Add Contact</Text>
      </TouchableOpacity>

      {loading && contacts.length === 0 ? (
        <ActivityIndicator size="large" color="#007BFF" style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          data={contacts}
          keyExtractor={(item) => item._id}
          renderItem={renderContact}
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true);
            fetchContacts();
          }}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No contacts added yet.</Text>
          }
          contentContainerStyle={{ marginTop: 20, width: "100%" }}
        />
      )}

      {/* Add/Edit Modal */}
      <Modal
        transparent={true}
        animationType="fade"
        visible={modalVisible}
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>
              {editingContact ? "Edit Contact" : "Add Emergency Contact"}
            </Text>

            <TextInput
              placeholder="Full Name"
              style={styles.input}
              value={fullName}
              onChangeText={setFullName}
            />
            <TextInput
              placeholder="Phone Number"
              keyboardType="phone-pad"
              style={styles.input}
              value={phoneNumber}
              onChangeText={setPhoneNumber}
            />
            <TextInput
              placeholder="Relationship"
              style={styles.input}
              value={relationship}
              onChangeText={setRelationship}
            />

            <View style={styles.modalButtonContainer}>
              <TouchableOpacity style={styles.cancelButton} onPress={closeModal}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.addContactButton}
                onPress={handleAddOrEditContact}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.addContactButtonText}>
                    {editingContact ? "Save Changes" : "Add"}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* 3-dot menu */}
      <Modal
        transparent
        animationType="fade"
        visible={menuVisible}
        onRequestClose={() => setMenuVisible(false)}
      >
        <TouchableOpacity
          style={styles.menuOverlay}
          activeOpacity={1}
          onPressOut={() => setMenuVisible(false)}
        >
          <View style={styles.menuContainer}>
            <TouchableOpacity
              style={styles.menuOption}
              onPress={() => openModalForEdit(selectedContact)}
            >
              <Ionicons name="create-outline" size={20} color="#1E293B" />
              <Text style={styles.menuText}>Edit</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuOption}
              onPress={() => handleDeleteContact(selectedContact._id)}
            >
              <Ionicons name="trash-outline" size={20} color="#EF4444" />
              <Text style={[styles.menuText, { color: "#EF4444" }]}>Delete</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
    padding: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 20,
    marginBottom: 5,
  },
  backButton: {
    marginRight: 10,
    padding: 5,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1E293B",
  },
  infoBox: {
    backgroundColor: "#FFE5E5",
    color: "#B00020",
    padding: 10,
    borderRadius: 8,
    textAlign: "center",
    marginTop: 10,
  },
  emergencyAlertButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#DC2626",
    paddingVertical: 14,
    justifyContent: "center",
    borderRadius: 10,
    marginTop: 15,
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
    gap: 8,
  },
  emergencyAlertText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "700",
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#007BFF",
    paddingVertical: 12,
    justifyContent: "center",
    borderRadius: 10,
    marginTop: 15,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 2,
  },
  addButtonText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "600",
    marginLeft: 8,
  },
  emptyText: {
    marginTop: 50,
    textAlign: "center",
    fontSize: 16,
    color: "#6B7280",
  },
  contactCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 15,
    marginBottom: 12,
    marginHorizontal: 5,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  contactLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  contactName: {
    fontSize: 17,
    fontWeight: "600",
    color: "#1E293B",
  },
  contactDetails: {
    fontSize: 14,
    color: "#64748B",
  },
  contactActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 15,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    width: "85%",
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 20,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1E293B",
    textAlign: "center",
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
    fontSize: 16,
  },
  modalButtonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
  cancelButton: {
    backgroundColor: "#E5E7EB",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  cancelButtonText: {
    color: "#374151",
    fontWeight: "600",
  },
  addContactButton: {
    backgroundColor: "#007BFF",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  addContactButtonText: {
    color: "#fff",
    fontWeight: "600",
  },
  menuOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.2)",
  },
  menuContainer: {
    backgroundColor: "#fff",
    width: 180,
    borderRadius: 10,
    paddingVertical: 8,
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 5,
  },
  menuOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 15,
    gap: 10,
  },
  menuText: {
    fontSize: 16,
    color: "#1E293B",
  },
});