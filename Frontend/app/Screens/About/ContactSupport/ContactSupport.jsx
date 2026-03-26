import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Linking,
  Alert,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from 'expo-router';
import {
  ChevronLeft,
  Phone,
  Mail,
  MessageCircle,
  Clock,
  Send,
  CheckCircle,
} from "lucide-react-native";

const API_URL = 'http://192.168.100.21:5000/api/contact';

export default function ContactSupport() {
  const router = useRouter();
  const [selectedTab, setSelectedTab] = useState("contact");
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });

  const contactMethods = [
    {
      id: 1,
      icon: Phone,
      title: "Phone Support",
      subtitle: "24/7 Available",
      value: "+92 300 1234567",
      action: () => Linking.openURL("tel:+923001234567"),
      bgColor: "#DBEAFE",
      iconColor: "#3B82F6",
    },
    {
      id: 2,
      icon: MessageCircle,
      title: "WhatsApp",
      subtitle: "Quick Response",
      value: "+92 300 1234567",
      action: () => Linking.openURL("https://wa.me/923001234567"),
      bgColor: "#D1FAE5",
      iconColor: "#10B981",
    },
    {
      id: 3,
      icon: Mail,
      title: "Email Support",
      subtitle: "Response in 24 hours",
      value: "support@meditrack.com",
      action: () => Linking.openURL("mailto:support@meditrack.com"),
      bgColor: "#FEE2E2",
      iconColor: "#EF4444",
    },
  ];

  const handleSubmit = async () => {
    // Validation
    if (!formData.name.trim()) {
      Alert.alert('Error', 'Please enter your name');
      return;
    }

    if (!formData.email.trim()) {
      Alert.alert('Error', 'Please enter your email');
      return;
    }

    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(formData.email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    if (!formData.subject.trim()) {
      Alert.alert('Error', 'Please enter subject');
      return;
    }

    if (!formData.message.trim()) {
      Alert.alert('Error', 'Please enter your message');
      return;
    }

    setLoading(true);

    try {
      console.log('📧 Submitting contact message:', {
        name: formData.name,
        email: formData.email,
        subject: formData.subject,
      });

      const response = await fetch(`${API_URL}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          email: formData.email.trim(),
          subject: formData.subject.trim(),
          message: formData.message.trim(),
        }),
      });

      const data = await response.json();

      console.log('Response:', data);

      if (!response.ok) {
        throw new Error(data.message || 'Failed to send message');
      }

      console.log('✅ Message sent successfully:', data.ticketNumber);

      Alert.alert(
        'Message Sent! ✅',
        `Thank you for contacting us!\n\nYour ticket number: ${data.ticketNumber}\n\nWe'll get back to you within 24 hours.`,
        [
          {
            text: 'OK',
            onPress: () => {
              // Clear form
              setFormData({
                name: "",
                email: "",
                subject: "",
                message: "",
              });
              setSelectedTab("contact");
            }
          }
        ]
      );
    } catch (error) {
      console.error('❌ Submit error:', error);
      Alert.alert(
        'Error',
        error.message || 'Failed to send message. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ChevronLeft size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Contact Support</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Tab Selector */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, selectedTab === "contact" && styles.tabActive]}
          onPress={() => setSelectedTab("contact")}
        >
          <Text style={[styles.tabText, selectedTab === "contact" && styles.tabTextActive]}>
            Contact Info
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, selectedTab === "form" && styles.tabActive]}
          onPress={() => setSelectedTab("form")}
        >
          <Text style={[styles.tabText, selectedTab === "form" && styles.tabTextActive]}>
            Send Message
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {selectedTab === "contact" ? (
          <>
            {/* Hero Section */}
            <View style={styles.heroCard}>
              <Text style={styles.heroTitle}>We're Here to Help!</Text>
              <Text style={styles.heroSubtitle}>
                Our support team is available 24/7 to assist you.
              </Text>
            </View>

            {/* Contact Methods */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Get in Touch</Text>
              {contactMethods.map((method) => {
                const Icon = method.icon;
                return (
                  <TouchableOpacity
                    key={method.id}
                    style={styles.contactCard}
                    onPress={method.action}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.contactIconContainer, { backgroundColor: method.bgColor }]}>
                      <Icon size={24} color={method.iconColor} />
                    </View>
                    <View style={styles.contactInfo}>
                      <Text style={styles.contactTitle}>{method.title}</Text>
                      <Text style={styles.contactSubtitle}>{method.subtitle}</Text>
                      <Text style={styles.contactValue}>{method.value}</Text>
                    </View>
                    <ChevronLeft size={20} color="#9CA3AF" style={{ transform: [{ rotate: "180deg" }] }} />
                  </TouchableOpacity>
                );
              })}
            </View>
          </>
        ) : (
          <>
            {/* Contact Form */}
            <View style={styles.formSection}>
              <Text style={styles.formTitle}>Send us a Message</Text>
              <Text style={styles.formSubtitle}>
                We'll get back to you within 24 hours
              </Text>

              <View style={styles.formCard}>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Full Name *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter your name"
                    value={formData.name}
                    onChangeText={(text) => setFormData({ ...formData, name: text })}
                    placeholderTextColor="#9CA3AF"
                    editable={!loading}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Email Address *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="your.email@example.com"
                    value={formData.email}
                    onChangeText={(text) => setFormData({ ...formData, email: text })}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    placeholderTextColor="#9CA3AF"
                    editable={!loading}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Subject *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="What is this regarding?"
                    value={formData.subject}
                    onChangeText={(text) => setFormData({ ...formData, subject: text })}
                    placeholderTextColor="#9CA3AF"
                    editable={!loading}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Message *</Text>
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    placeholder="Describe your issue or question..."
                    value={formData.message}
                    onChangeText={(text) => setFormData({ ...formData, message: text })}
                    multiline
                    numberOfLines={6}
                    textAlignVertical="top"
                    placeholderTextColor="#9CA3AF"
                    editable={!loading}
                  />
                </View>

                <TouchableOpacity
                  style={[styles.submitButton, loading && styles.submitButtonDisabled]}
                  onPress={handleSubmit}
                  activeOpacity={0.8}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <>
                      <Send size={20} color="#FFFFFF" />
                      <Text style={styles.submitButtonText}>Send Message</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>

              {/* Success Info */}
              <View style={styles.successInfo}>
                <CheckCircle size={16} color="#10B981" />
                <Text style={styles.successText}>
                  We typically respond within 24 hours
                </Text>
              </View>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12, backgroundColor: "#F8FAFC", borderBottomWidth: 1, borderBottomColor: "#E5E7EB" },
  backButton: { width: 40, height: 40, justifyContent: "center", alignItems: "center" },
  headerTitle: { fontSize: 20, fontWeight: "bold", color: "#111827" },
  placeholder: { width: 40 },
  tabContainer: { flexDirection: "row", paddingHorizontal: 16, paddingTop: 16, gap: 12 },
  tab: { flex: 1, paddingVertical: 12, borderRadius: 8, backgroundColor: "#FFFFFF", alignItems: "center", borderWidth: 1, borderColor: "#E5E7EB" },
  tabActive: { backgroundColor: "#6366F1", borderColor: "#6366F1" },
  tabText: { fontSize: 14, fontWeight: "600", color: "#6B7280" },
  tabTextActive: { color: "#FFFFFF" },
  scrollView: { flex: 1 },
  heroCard: { backgroundColor: "#6366F1", borderRadius: 16, padding: 24, margin: 16, alignItems: "center" },
  heroTitle: { fontSize: 24, fontWeight: "bold", color: "#FFFFFF", marginBottom: 8, textAlign: "center" },
  heroSubtitle: { fontSize: 14, color: "rgba(255,255,255,0.9)", textAlign: "center", lineHeight: 20 },
  section: { paddingHorizontal: 16, marginBottom: 20 },
  sectionTitle: { fontSize: 18, fontWeight: "bold", color: "#111827", marginBottom: 12 },
  contactCard: { flexDirection: "row", alignItems: "center", backgroundColor: "#FFFFFF", borderRadius: 12, padding: 16, marginBottom: 12, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 2 },
  contactIconContainer: { width: 48, height: 48, borderRadius: 24, justifyContent: "center", alignItems: "center", marginRight: 12 },
  contactInfo: { flex: 1 },
  contactTitle: { fontSize: 16, fontWeight: "600", color: "#111827", marginBottom: 2 },
  contactSubtitle: { fontSize: 12, color: "#6B7280", marginBottom: 4 },
  contactValue: { fontSize: 13, color: "#3B82F6", fontWeight: "500" },
  formSection: { paddingHorizontal: 16, paddingTop: 8 },
  formTitle: { fontSize: 22, fontWeight: "bold", color: "#111827", marginBottom: 4 },
  formSubtitle: { fontSize: 14, color: "#6B7280", marginBottom: 20, lineHeight: 20 },
  formCard: { backgroundColor: "#FFFFFF", borderRadius: 12, padding: 16, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 2 },
  inputGroup: { marginBottom: 16 },
  inputLabel: { fontSize: 14, fontWeight: "600", color: "#374151", marginBottom: 8 },
  input: { backgroundColor: "#F9FAFB", borderWidth: 1, borderColor: "#E5E7EB", borderRadius: 8, paddingHorizontal: 12, paddingVertical: 12, fontSize: 14, color: "#111827" },
  textArea: { height: 120, paddingTop: 12 },
  submitButton: { backgroundColor: "#6366F1", flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 14, borderRadius: 8, gap: 8, marginTop: 8 },
  submitButtonDisabled: { opacity: 0.6 },
  submitButtonText: { color: "#FFFFFF", fontSize: 16, fontWeight: "bold" },
  successInfo: { flexDirection: "row", alignItems: "center", justifyContent: "center", marginTop: 16, gap: 6 },
  successText: { fontSize: 13, color: "#10B981", fontWeight: "500" },
});