import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Switch, Alert, Modal, TextInput } from 'react-native';
import { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as LocalAuthentication from 'expo-local-authentication';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../../../constants/constants';

export default function PrivacySecurityScreen() {
  const [shareWithGuardians, setShareWithGuardians] = useState(false);
  const [locationPrivacy, setLocationPrivacy] = useState(true);
  const [locationHistory, setLocationHistory] = useState(true);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [pinEnabled, setPinEnabled] = useState(false);
  const [privacyScore, setPrivacyScore] = useState(0);

  // PIN Modal states
  const [pinModalVisible, setPinModalVisible] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');

  const router = useRouter();

  // ✅ Load saved settings
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const sg  = await AsyncStorage.getItem('privacy_shareGuardians');
        const lp  = await AsyncStorage.getItem('privacy_locationPrivacy');
        const lh  = await AsyncStorage.getItem('privacy_locationHistory');
        const bio = await AsyncStorage.getItem('privacy_biometric');
        const pin = await AsyncStorage.getItem('privacy_pin');
        if (sg  !== null) setShareWithGuardians(sg === 'true');
        if (lp  !== null) setLocationPrivacy(lp === 'true');
        if (lh  !== null) setLocationHistory(lh === 'true');
        if (bio !== null) setBiometricEnabled(bio === 'true');
        if (pin !== null) setPinEnabled(pin === 'true');
      } catch (e) {
        console.log('Load error:', e);
      }
    };
    loadSettings();
  }, []);

  // ✅ Privacy Score calculate
  useEffect(() => {
    let score = 0;
    if (locationPrivacy)    score += 2;
    if (locationHistory)    score += 2;
    if (shareWithGuardians) score += 2;
    if (biometricEnabled)   score += 2;
    if (pinEnabled)         score += 2;
    setPrivacyScore(score);
  }, [locationPrivacy, locationHistory, shareWithGuardians, biometricEnabled, pinEnabled]);

  // ✅ Share with Guardians — backend pe save
  const handleShareGuardians = async (value) => {
    setShareWithGuardians(value);
    await AsyncStorage.setItem('privacy_shareGuardians', value.toString());
    try {
      const token = await AsyncStorage.getItem('userToken');
      await fetch(`${API_BASE_URL}/api/auth/profile`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ shareWithGuardians: value }),
      });
      console.log('✅ shareWithGuardians saved');
    } catch (e) {
      console.log('Guardian share error:', e);
    }
  };

  // ✅ Location Privacy — AsyncStorage only
  const handleLocationPrivacy = async (value) => {
    setLocationPrivacy(value);
    await AsyncStorage.setItem('privacy_locationPrivacy', value.toString());
  };

  const handleLocationHistory = async (value) => {
    setLocationHistory(value);
    await AsyncStorage.setItem('privacy_locationHistory', value.toString());
  };

  // ✅ Biometric — real device authentication
  const handleBiometric = async () => {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      if (!hasHardware) {
        Alert.alert('Not Supported', 'Your device does not support biometric authentication');
        return;
      }
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      if (!isEnrolled) {
        Alert.alert('Setup Required', 'Please set up fingerprint or face unlock in device settings first');
        return;
      }
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: biometricEnabled
          ? 'Authenticate to disable Biometric Lock'
          : 'Authenticate to enable Biometric Lock',
        fallbackLabel: 'Cancel',
        cancelLabel: 'Cancel',
      });
      if (result.success) {
        const newVal = !biometricEnabled;
        setBiometricEnabled(newVal);
        await AsyncStorage.setItem('privacy_biometric', newVal.toString());
        Alert.alert('Success ✅', `Biometric Lock ${newVal ? 'Enabled' : 'Disabled'}`);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to authenticate');
    }
  };

  // ✅ PIN — Modal wala (Android compatible)
  const handlePinCode = () => {
    if (pinEnabled) {
      Alert.alert('Remove PIN', 'Do you want to remove your PIN?', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            setPinEnabled(false);
            await AsyncStorage.removeItem('privacy_pin');
            await AsyncStorage.removeItem('app_pin_code');
            Alert.alert('Removed', 'PIN has been removed');
          },
        },
      ]);
    } else {
      setPinInput('');
      setPinError('');
      setPinModalVisible(true);
    }
  };

  const handlePinSubmit = async () => {
    if (pinInput.length !== 6 || !/^\d+$/.test(pinInput)) {
      setPinError('Please enter a valid 6-digit numeric PIN');
      return;
    }
    await AsyncStorage.setItem('app_pin_code', pinInput);
    await AsyncStorage.setItem('privacy_pin', 'true');
    setPinEnabled(true);
    setPinModalVisible(false);
    setPinInput('');
    Alert.alert('Success ✅', 'PIN Code has been set successfully');
  };

  const getScoreColor = (score) => {
    if (score >= 8) return '#4CAF50';
    if (score >= 5) return '#FF9800';
    return '#F44336';
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.push('/Screens/SettingScreen/SettingScreen')} style={styles.backButton}>
          <Ionicons name="chevron-back" size={26} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Privacy & Security</Text>
        <View style={{ width: 26 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>

        {/* Data Protection Card */}
        <View style={[styles.card, styles.protectionCard]}>
          <View style={styles.dataProtectionHeader}>
            <View style={styles.shieldContainer}>
              <Ionicons name="shield-checkmark" size={28} color="#4CAF50" />
            </View>
            <View style={styles.dataProtectionText}>
              <Text style={styles.cardTitle}>Data Protection</Text>
              <Text style={styles.cardSubtitle}>Your health data is encrypted and secure</Text>
            </View>
          </View>
        </View>

        {/* Data Sharing */}
        <Text style={styles.sectionTitle}>Data Sharing</Text>
        <View style={styles.card}>
          <View style={[styles.settingRow, styles.noBorder]}>
            <View style={styles.settingLeft}>
              <Text style={styles.settingTitle}>Share with Guardians</Text>
              <Text style={styles.settingSubtitle}>Allow guardian to view your vitals & health data</Text>
            </View>
            <Switch
              value={shareWithGuardians}
              onValueChange={handleShareGuardians}
              trackColor={{ false: '#D0D0D0', true: '#4CAF50' }}
              thumbColor="#fff"
            />
          </View>
        </View>

        {/* Location Privacy */}
        <Text style={styles.sectionTitle}>Location Privacy</Text>
        <View style={styles.card}>
          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <Text style={styles.settingTitle}>Share Location</Text>
              <Text style={styles.settingSubtitle}>Share exact GPS location with guardian in emergencies</Text>
            </View>
            <Switch
              value={locationPrivacy}
              onValueChange={handleLocationPrivacy}
              trackColor={{ false: '#D0D0D0', true: '#4CAF50' }}
              thumbColor="#fff"
            />
          </View>
          <View style={[styles.settingRow, styles.noBorder]}>
            <View style={styles.settingLeft}>
              <Text style={styles.settingTitle}>Location History</Text>
              <Text style={styles.settingSubtitle}>Allow guardian to see your location history</Text>
            </View>
            <Switch
              value={locationHistory}
              onValueChange={handleLocationHistory}
              trackColor={{ false: '#D0D0D0', true: '#4CAF50' }}
              thumbColor="#fff"
            />
          </View>
        </View>

        {/* App Security */}
        <Text style={styles.sectionTitle}>App Security</Text>
        <View style={styles.card}>
          <TouchableOpacity style={styles.securityItem} onPress={handleBiometric}>
            <View style={styles.securityLeft}>
              <View style={[styles.securityIcon, { backgroundColor: '#E8F5E9' }]}>
                <Ionicons name="finger-print" size={26} color="#4CAF50" />
              </View>
              <View>
                <Text style={styles.settingTitle}>Biometric Lock</Text>
                <Text style={styles.settingSubtitle}>Use fingerprint or face unlock</Text>
              </View>
            </View>
            <Text style={[styles.statusBadge, biometricEnabled && styles.enabledBadge]}>
              {biometricEnabled ? 'Enabled' : 'Disabled'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.securityItem} onPress={handlePinCode}>
            <View style={styles.securityLeft}>
              <View style={[styles.securityIcon, { backgroundColor: '#FFF9C4' }]}>
                <Ionicons name="keypad" size={26} color="#FBC02D" />
              </View>
              <View>
                <Text style={styles.settingTitle}>PIN Code</Text>
                <Text style={styles.settingSubtitle}>{pinEnabled ? 'Tap to remove PIN' : 'Set 6-digit security PIN'}</Text>
              </View>
            </View>
            <Text style={[styles.statusBadge, pinEnabled && styles.enabledBadge]}>
              {pinEnabled ? 'Set' : 'Not Set'}
            </Text>
          </TouchableOpacity>

          <View style={[styles.securityItem, styles.noBorder]}>
            <View style={styles.securityLeft}>
              <View style={[styles.securityIcon, { backgroundColor: '#E3F2FD' }]}>
                <Ionicons name="timer" size={26} color="#2196F3" />
              </View>
              <View>
                <Text style={styles.settingTitle}>Auto-Lock Timer</Text>
                <Text style={styles.settingSubtitle}>Locks app after 5 min inactivity</Text>
              </View>
            </View>
            <Text style={styles.statusBadge}>5 min</Text>
          </View>
        </View>

        {/* Privacy Information */}
        <Text style={styles.sectionTitle}>Privacy Information</Text>
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Data Encryption:</Text>
            <Text style={styles.infoValue}>AES-256</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Encryption Level:</Text>
            <Text style={styles.infoValue}>Military Grade</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>GDPR Compliant:</Text>
            <Text style={styles.infoValue}>✓ Yes</Text>
          </View>
          <View style={[styles.infoRow, styles.noBorder]}>
            <Text style={styles.infoLabel}>Last Privacy Update:</Text>
            <Text style={styles.infoValue}>Jan 2025</Text>
          </View>
        </View>

        {/* Privacy Score */}
        <View style={[styles.scoreCard, { backgroundColor: getScoreColor(privacyScore) }]}>
          <Ionicons name="shield-checkmark" size={20} color="#fff" style={{ marginBottom: 6 }} />
          <Text style={styles.scoreLabel}>Privacy Score</Text>
          <Text style={styles.scoreValue}>{privacyScore}/10</Text>
          <Text style={styles.scoreHint}>
            {privacyScore >= 8 ? '✅ Excellent! Your privacy is well protected' :
             privacyScore >= 5 ? '⚠️ Good, enable more settings for better security' :
             '❌ Enable more settings to improve your score'}
          </Text>
        </View>

        <View style={{ height: 30 }} />
      </ScrollView>

      {/* ✅ PIN Modal — Android Compatible */}
      <Modal
        visible={pinModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setPinModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalIconContainer}>
              <Ionicons name="keypad" size={40} color="#FBC02D" />
            </View>
            <Text style={styles.modalTitle}>Set PIN Code</Text>
            <Text style={styles.modalSubtitle}>Enter a 6-digit numeric PIN</Text>

            <TextInput
              style={styles.pinInput}
              value={pinInput}
              onChangeText={(text) => {
                setPinInput(text);
                setPinError('');
              }}
              keyboardType="numeric"
              maxLength={6}
              secureTextEntry={true}
              placeholder="••••••"
              placeholderTextColor="#BDBDBD"
              textAlign="center"
            />

            {pinError ? <Text style={styles.pinError}>{pinError}</Text> : null}

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => { setPinModalVisible(false); setPinInput(''); }}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalSetBtn} onPress={handlePinSubmit}>
                <Text style={styles.modalSetText}>Set PIN</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  card: {
    backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08, shadowRadius: 8, elevation: 3,
  },
  protectionCard: { borderWidth: 1, borderColor: '#E8F5E9' },
  dataProtectionHeader: { flexDirection: 'row', alignItems: 'center' },
  shieldContainer: {
    width: 56, height: 56, borderRadius: 28, backgroundColor: '#E8F5E9',
    justifyContent: 'center', alignItems: 'center', marginRight: 15,
  },
  dataProtectionText: { flex: 1 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#2C3E50', marginBottom: 4 },
  cardSubtitle: { fontSize: 13, color: '#7F8C8D', lineHeight: 18 },
  sectionTitle: {
    fontSize: 15, fontWeight: '700', color: '#2C3E50',
    marginTop: 24, marginBottom: 12, letterSpacing: 0.5,
  },
  settingRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F5F5F5',
  },
  noBorder: { borderBottomWidth: 0 },
  settingLeft: { flex: 1, marginRight: 15 },
  settingTitle: { fontSize: 15, fontWeight: '600', color: '#2C3E50', marginBottom: 4 },
  settingSubtitle: { fontSize: 13, color: '#95A5A6', lineHeight: 18 },
  securityItem: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F5F5F5',
  },
  securityLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  securityIcon: {
    width: 56, height: 56, borderRadius: 28,
    justifyContent: 'center', alignItems: 'center', marginRight: 15,
  },
  statusBadge: { fontSize: 13, color: '#95A5A6', fontWeight: '600' },
  enabledBadge: { color: '#4CAF50' },
  infoCard: {
    backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08, shadowRadius: 8, elevation: 3,
  },
  infoRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F5F5F5',
  },
  infoLabel: { fontSize: 14, color: '#7F8C8D' },
  infoValue: { fontSize: 14, color: '#2C3E50', fontWeight: '600' },
  scoreCard: {
    borderRadius: 12, padding: 20, alignItems: 'center',
    marginBottom: 12, marginTop: 20, elevation: 5,
  },
  scoreLabel: { fontSize: 12, color: '#fff', marginBottom: 4, opacity: 0.9 },
  scoreValue: { fontSize: 28, fontWeight: 'bold', color: '#fff', marginBottom: 6 },
  scoreHint: { fontSize: 12, color: '#fff', opacity: 0.85, textAlign: 'center' },

  // PIN Modal
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center', alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff', borderRadius: 24, padding: 28,
    alignItems: 'center', width: '85%',
  },
  modalIconContainer: { marginBottom: 12 },
  modalTitle: { fontSize: 20, fontWeight: '700', color: '#1A1A1A', marginBottom: 6 },
  modalSubtitle: { fontSize: 13, color: '#95A5A6', marginBottom: 20 },
  pinInput: {
    width: '100%', height: 56, borderWidth: 2, borderColor: '#FBC02D',
    borderRadius: 12, fontSize: 24, color: '#1A1A1A',
    backgroundColor: '#FFFDE7', letterSpacing: 8, marginBottom: 8,
  },
  pinError: { fontSize: 12, color: '#F44336', marginBottom: 8 },
  modalButtons: { flexDirection: 'row', gap: 12, marginTop: 12 },
  modalCancelBtn: {
    flex: 1, paddingVertical: 14, borderRadius: 12,
    borderWidth: 1.5, borderColor: '#E0E0E0', alignItems: 'center',
  },
  modalCancelText: { fontSize: 15, fontWeight: '600', color: '#757575' },
  modalSetBtn: {
    flex: 1, paddingVertical: 14, borderRadius: 12,
    backgroundColor: '#FBC02D', alignItems: 'center',
  },
  modalSetText: { fontSize: 15, fontWeight: '700', color: '#fff' },
});