import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Switch } from 'react-native';
import { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Footer from '../../components/Footer';

export default function NotificationScreen() {
  const [heartRateAlerts, setHeartRateAlerts] = useState(true);
  const [emergencyAlerts, setEmergencyAlerts] = useState(true);
  const [deviceAlerts, setDeviceAlerts] = useState(true);
  const [selectedFrequency, setSelectedFrequency] = useState('Every 5 Min');

  const router = useRouter();

  // ✅ Load saved settings
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const hr  = await AsyncStorage.getItem('notif_heartRate');
        const em  = await AsyncStorage.getItem('notif_emergency');
        const dev = await AsyncStorage.getItem('notif_device');
        const frq = await AsyncStorage.getItem('notif_frequency');

        if (hr  !== null) setHeartRateAlerts(hr === 'true');
        if (em  !== null) setEmergencyAlerts(em === 'true');
        if (dev !== null) setDeviceAlerts(dev === 'true');
        if (frq !== null) setSelectedFrequency(frq);
      } catch (e) {
        console.log('Load notif settings error:', e);
      }
    };
    loadSettings();
  }, []);

  // ✅ Toggle handlers
  const handleHeartRate = async (value) => {
    setHeartRateAlerts(value);
    await AsyncStorage.setItem('notif_heartRate', value.toString());
  };

  const handleEmergency = async (value) => {
    setEmergencyAlerts(value);
    await AsyncStorage.setItem('notif_emergency', value.toString());
  };

  const handleDevice = async (value) => {
    setDeviceAlerts(value);
    await AsyncStorage.setItem('notif_device', value.toString());
  };

  // ✅ Frequency handler
  const handleFrequency = async (value) => {
    setSelectedFrequency(value);
    await AsyncStorage.setItem('notif_frequency', value);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={26} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        <View style={{ width: 26 }} />
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* Alert Preferences Header */}
        <View style={styles.sectionHeader}>
          <View style={[styles.sectionIconCircle, { backgroundColor: '#FFF9C4' }]}>
            <Ionicons name="notifications" size={22} color="#F9A825" />
          </View>
          <View>
            <Text style={styles.sectionTitle}>Alert Preferences</Text>
            <Text style={styles.sectionSubtitle}>Customize your notification settings</Text>
          </View>
        </View>

        {/* Heart Rate Alerts */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.cardLeft}>
              <View style={[styles.iconCircle, { backgroundColor: '#FFEBEE' }]}>
                <Ionicons name="heart" size={26} color="#EF5350" />
              </View>
              <View style={styles.cardInfo}>
                <Text style={styles.cardTitle}>Heart Rate Alerts</Text>
                <Text style={styles.cardSubtitle}>Get notified for abnormal rates</Text>
              </View>
            </View>
            <Switch
              value={heartRateAlerts}
              onValueChange={handleHeartRate}
              trackColor={{ false: '#E0E0E0', true: '#4CAF50' }}
              thumbColor="#fff"
              ios_backgroundColor="#E0E0E0"
            />
          </View>

          {heartRateAlerts && (
            <View style={styles.alertDetails}>
              <View style={styles.detailRow}>
                <View style={styles.detailBadge}>
                  <Ionicons name="arrow-up" size={14} color="#EF5350" />
                </View>
                <Text style={styles.detailLabel}>High Alert</Text>
                <Text style={styles.detailValue}>Above 100 BPM</Text>
              </View>
              <View style={styles.detailRow}>
                <View style={styles.detailBadge}>
                  <Ionicons name="arrow-down" size={14} color="#42A5F5" />
                </View>
                <Text style={styles.detailLabel}>Low Alert</Text>
                <Text style={styles.detailValue}>Below 60 BPM</Text>
              </View>
            </View>
          )}
        </View>

        {/* Emergency Alerts */}
        <View style={[styles.card, styles.emergencyCard]}>
          <View style={styles.cardHeader}>
            <View style={styles.cardLeft}>
              <View style={[styles.iconCircle, { backgroundColor: '#FFEBEE' }]}>
                <Ionicons name="alert-circle" size={26} color="#EF5350" />
              </View>
              <View style={styles.cardInfo}>
                <Text style={styles.cardTitle}>Emergency Alerts</Text>
                <Text style={styles.cardSubtitle}>Critical health alerts to guardians</Text>
              </View>
            </View>
            <Switch
              value={emergencyAlerts}
              onValueChange={handleEmergency}
              trackColor={{ false: '#E0E0E0', true: '#4CAF50' }}
              thumbColor="#fff"
              ios_backgroundColor="#E0E0E0"
            />
          </View>

          <View style={styles.recommendedBadge}>
            <Ionicons name="shield-checkmark" size={14} color="#EF5350" />
            <Text style={styles.recommendedText}>Recommended ON for safety</Text>
          </View>
        </View>

        {/* Device Alerts */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.cardLeft}>
              <View style={[styles.iconCircle, { backgroundColor: '#E3F2FD' }]}>
                <Ionicons name="watch" size={26} color="#42A5F5" />
              </View>
              <View style={styles.cardInfo}>
                <Text style={styles.cardTitle}>Device Alerts</Text>
                <Text style={styles.cardSubtitle}>Battery and connection status</Text>
              </View>
            </View>
            <Switch
              value={deviceAlerts}
              onValueChange={handleDevice}
              trackColor={{ false: '#E0E0E0', true: '#4CAF50' }}
              thumbColor="#fff"
              ios_backgroundColor="#E0E0E0"
            />
          </View>

          {deviceAlerts && (
            <View style={styles.alertDetails}>
              <View style={styles.deviceItem}>
                <View style={[styles.deviceIconBadge, { backgroundColor: '#E8F5E9' }]}>
                  <Ionicons name="battery-half" size={16} color="#66BB6A" />
                </View>
                <Text style={styles.deviceText}>Low battery warnings</Text>
              </View>
              <View style={styles.deviceItem}>
                <View style={[styles.deviceIconBadge, { backgroundColor: '#E3F2FD' }]}>
                  <Ionicons name="wifi" size={16} color="#42A5F5" />
                </View>
                <Text style={styles.deviceText}>Connection issues</Text>
              </View>
            </View>
          )}
        </View>

        {/* Notification Frequency */}
        <View style={styles.frequencySection}>
          <Text style={styles.frequencyTitle}>Notification Frequency</Text>
          <Text style={styles.frequencySubtitle}>How often do you want to receive alerts?</Text>

          <View style={styles.frequencyContainer}>
            {['Real-time', 'Every 5 Min', 'Hourly'].map((freq) => (
              <TouchableOpacity
                key={freq}
                style={[
                  styles.frequencyButton,
                  selectedFrequency === freq && styles.frequencyButtonActive
                ]}
                onPress={() => handleFrequency(freq)}
              >
                <Ionicons
                  name={freq === 'Real-time' ? 'flash' : freq === 'Every 5 Min' ? 'time' : 'hourglass'}
                  size={20}
                  color={selectedFrequency === freq ? '#fff' : '#757575'}
                />
                <Text style={[
                  styles.frequencyButtonText,
                  selectedFrequency === freq && styles.frequencyButtonTextActive
                ]}>{freq}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>

      <Footer />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#C5D9E8' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: 50, paddingBottom: 20,
    backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E0E0E0',
  },
  backButton: { padding: 4 },
  headerTitle: { fontSize: 22, fontWeight: '700', color: '#1A1A1A', letterSpacing: 0.3 },
  content: { flex: 1, paddingHorizontal: 20, paddingTop: 20 },
  sectionHeader: {
    flexDirection: 'row', alignItems: 'center', marginBottom: 20, padding: 16,
    backgroundColor: '#fff', borderRadius: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
  },
  sectionIconCircle: {
    width: 48, height: 48, borderRadius: 24,
    justifyContent: 'center', alignItems: 'center', marginRight: 15,
  },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: '#1A1A1A', marginBottom: 3 },
  sectionSubtitle: { fontSize: 13, color: '#757575' },
  card: {
    backgroundColor: '#fff', borderRadius: 14, padding: 18, marginBottom: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
  },
  emergencyCard: { borderLeftWidth: 4, borderLeftColor: '#EF5350' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 10 },
  iconCircle: {
    width: 52, height: 52, borderRadius: 26,
    justifyContent: 'center', alignItems: 'center', marginRight: 14,
  },
  cardInfo: { flex: 1 },
  cardTitle: { fontSize: 16, fontWeight: '600', color: '#1A1A1A', marginBottom: 4 },
  cardSubtitle: { fontSize: 13, color: '#757575' },
  alertDetails: { marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: '#F5F5F5' },
  detailRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  detailBadge: {
    width: 28, height: 28, borderRadius: 14, backgroundColor: '#F5F5F5',
    justifyContent: 'center', alignItems: 'center', marginRight: 12,
  },
  detailLabel: { flex: 1, fontSize: 14, color: '#616161', fontWeight: '500' },
  detailValue: { fontSize: 14, fontWeight: '600', color: '#1A1A1A' },
  recommendedBadge: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    marginTop: 12, paddingVertical: 8, paddingHorizontal: 12,
    backgroundColor: '#FFEBEE', borderRadius: 8,
  },
  recommendedText: { fontSize: 12, color: '#EF5350', fontWeight: '600', marginLeft: 6 },
  deviceItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  deviceIconBadge: {
    width: 32, height: 32, borderRadius: 16,
    justifyContent: 'center', alignItems: 'center', marginRight: 12,
  },
  deviceText: { fontSize: 14, color: '#616161', fontWeight: '500' },
  frequencySection: { marginTop: 8, marginBottom: 20 },
  frequencyTitle: { fontSize: 17, fontWeight: '700', color: '#1A1A1A', marginBottom: 6 },
  frequencySubtitle: { fontSize: 13, color: '#757575', marginBottom: 16 },
  frequencyContainer: { flexDirection: 'row', gap: 10 },
  frequencyButton: {
    flex: 1, backgroundColor: '#fff', paddingVertical: 16, paddingHorizontal: 8,
    borderRadius: 12, alignItems: 'center', borderWidth: 2, borderColor: '#E0E0E0',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  frequencyButtonActive: { backgroundColor: '#42A5F5', borderColor: '#42A5F5' },
  frequencyButtonText: { fontSize: 13, color: '#757575', fontWeight: '600', marginTop: 6, textAlign: 'center' },
  frequencyButtonTextActive: { color: '#fff' },
});