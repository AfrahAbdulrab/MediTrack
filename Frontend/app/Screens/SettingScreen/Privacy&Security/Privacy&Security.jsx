import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Switch, Alert } from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as LocalAuthentication from 'expo-local-authentication';

export default function PrivacySecurityScreen() {
  const [shareWithGuardians, setShareWithGuardians] = useState(false);
  const [shareWithDoctor, setShareWithDoctor] = useState(false);
  const [anonymousResearch, setAnonymousResearch] = useState(false);
  const [locationPrivacy, setLocationPrivacy] = useState(false);
  const [locationHistory, setLocationHistory] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [pinEnabled, setPinEnabled] = useState(false);
  
  const router = useRouter();

  // Biometric Authentication Handler
  const handleBiometric = async () => {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      if (!hasHardware) {
        Alert.alert('Not Supported', 'Your device does not support biometric authentication');
        return;
      }

      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      if (!isEnrolled) {
        Alert.alert('No Biometrics Found', 'Please set up biometric authentication in your device settings');
        return;
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Authenticate to enable Biometric Lock',
        fallbackLabel: 'Use PIN',
      });

      if (result.success) {
        setBiometricEnabled(!biometricEnabled);
        Alert.alert('Success', `Biometric Lock ${!biometricEnabled ? 'Enabled' : 'Disabled'}`);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to authenticate');
    }
  };

  // PIN Code Handler
  const handlePinCode = () => {
    Alert.prompt(
      'Set PIN Code',
      'Enter a 6-digit PIN',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Set PIN',
          onPress: (pin) => {
            if (pin && pin.length === 6 && /^\d+$/.test(pin)) {
              // Save PIN to backend (simulation)
              setPinEnabled(true);
              Alert.alert('Success', 'PIN Code has been set successfully');
            } else {
              Alert.alert('Invalid PIN', 'Please enter a 6-digit numeric PIN');
            }
          },
        },
      ],
      'plain-text',
      '',
      'numeric'
    );
  };

  // Download Data Handler
  const handleDownloadData = () => {
    Alert.alert(
      'Download Data',
      'Your health data will be downloaded in PDF format',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Download',
          onPress: () => {
            // Simulate download
            setTimeout(() => {
              Alert.alert('Success', 'Your data has been downloaded successfully');
            }, 1000);
          },
        },
      ]
    );
  };

  // Export Report Handler
  const handleExportReport = () => {
    Alert.alert(
      'Export Health Report',
      'Export your complete health report',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Export',
          onPress: () => {
            // Simulate export
            setTimeout(() => {
              Alert.alert('Success', 'Health report exported successfully');
            }, 1000);
          },
        },
      ]
    );
  };

  // Delete Data Handler
  const handleDeleteData = () => {
    Alert.alert(
      'Delete All Data',
      'Are you sure? This action cannot be undone. All your health data will be permanently deleted.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            // Simulate deletion
            Alert.alert(
              'Final Confirmation',
              'Type DELETE to confirm',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Confirm',
                  style: 'destructive',
                  onPress: () => {
                    setTimeout(() => {
                      Alert.alert('Deleted', 'All data has been permanently deleted');
                    }, 1000);
                  },
                },
              ]
            );
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={26} color="#fff" />
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

        {/* Data Sharing Section */}
        <Text style={styles.sectionTitle}>Data Sharing</Text>

        <View style={styles.card}>
          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <Text style={styles.settingTitle}>Share with Guardians</Text>
              <Text style={styles.settingSubtitle}>Allow emergency contacts to view your vitals</Text>
            </View>
            <Switch
              value={shareWithGuardians}
              onValueChange={setShareWithGuardians}
              trackColor={{ false: '#D0D0D0', true: '#4CAF50' }}
              thumbColor="#fff"
            />
          </View>

          <View style={[styles.settingRow, styles.noBorder]}>
            <View style={styles.settingLeft}>
              <Text style={styles.settingTitle}>Share with Doctor</Text>
              <Text style={styles.settingSubtitle}>Allow healthcare providers access</Text>
            </View>
            <Switch
              value={shareWithDoctor}
              onValueChange={setShareWithDoctor}
              trackColor={{ false: '#D0D0D0', true: '#4CAF50' }}
              thumbColor="#fff"
            />
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <Text style={styles.settingTitle}>Anonymous Health Research</Text>
              <Text style={styles.settingSubtitle}>Help improve medical research</Text>
            </View>
            <Switch
              value={anonymousResearch}
              onValueChange={setAnonymousResearch}
              trackColor={{ false: '#D0D0D0', true: '#4CAF50' }}
              thumbColor="#fff"
            />
          </View>
        </View>

        {/* Location Privacy Section */}
        <Text style={styles.sectionTitle}>Location Privacy</Text>

        <View style={styles.card}>
          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <Text style={styles.settingTitle}>Location Privacy</Text>
              <Text style={styles.settingSubtitle}>Share exact GPS coordinates in emergencies</Text>
            </View>
            <Switch
              value={locationPrivacy}
              onValueChange={setLocationPrivacy}
              trackColor={{ false: '#D0D0D0', true: '#4CAF50' }}
              thumbColor="#fff"
            />
          </View>

          <View style={[styles.settingRow, styles.noBorder]}>
            <View style={styles.settingLeft}>
              <Text style={styles.settingTitle}>Location History</Text>
              <Text style={styles.settingSubtitle}>Share location time for health insights</Text>
            </View>
            <Switch
              value={locationHistory}
              onValueChange={setLocationHistory}
              trackColor={{ false: '#D0D0D0', true: '#4CAF50' }}
              thumbColor="#fff"
            />
          </View>
        </View>

        {/* App Security Section */}
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
                <Text style={styles.settingSubtitle}>Set 6-digit security PIN</Text>
              </View>
            </View>
            <Text style={[styles.statusBadge, pinEnabled && styles.enabledBadge]}>
              {pinEnabled ? 'Set' : 'Not Set'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.securityItem, styles.noBorder]}>
            <View style={styles.securityLeft}>
              <View style={[styles.securityIcon, { backgroundColor: '#E3F2FD' }]}>
                <Ionicons name="timer" size={26} color="#2196F3" />
              </View>
              <View>
                <Text style={styles.settingTitle}>Auto-Lock Timer</Text>
                <Text style={styles.settingSubtitle}>Locks app after inactivity</Text>
              </View>
            </View>
            <Text style={styles.statusBadge}>5 min</Text>
          </TouchableOpacity>
        </View>

        {/* Data Management Section */}
        <Text style={styles.sectionTitle}>Data Management</Text>

        <TouchableOpacity style={styles.actionButton} onPress={handleDownloadData}>
          <Ionicons name="download-outline" size={20} color="#2196F3" style={styles.buttonIcon} />
          <Text style={[styles.actionButtonText, { color: '#2196F3' }]}>Download My Data</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.actionButton, styles.yellowButton]} onPress={handleExportReport}>
          <Ionicons name="document-text-outline" size={20} color="#F57C00" style={styles.buttonIcon} />
          <Text style={[styles.actionButtonText, { color: '#F57C00' }]}>Export Health Report</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.actionButton, styles.redButton]} onPress={handleDeleteData}>
          <Ionicons name="trash-outline" size={20} color="#fff" style={styles.buttonIcon} />
          <Text style={[styles.actionButtonText, { color: '#fff' }]}>Delete All Data</Text>
        </TouchableOpacity>

        {/* Privacy Settings Info */}
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
        <View style={styles.scoreCard}>
          <View style={styles.scoreIcon}>
            <Ionicons name="shield-checkmark" size={20} color="#fff" />
          </View>
          <Text style={styles.scoreLabel}>Privacy Score</Text>
          <Text style={styles.scoreValue}>8.5/10</Text>
        </View>

        <View style={{ height: 30 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#C5D9E8',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backButton: {
    padding: 4,
    
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1A1A1A',
    letterSpacing: 0.3,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  protectionCard: {
    borderWidth: 1,
    borderColor: '#E8F5E9',
  },
  dataProtectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  shieldContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  dataProtectionText: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2C3E50',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 13,
    color: '#7F8C8D',
    lineHeight: 18,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#2C3E50',
    marginTop: 24,
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  noBorder: {
    borderBottomWidth: 0,
  },
  settingLeft: {
    flex: 1,
    marginRight: 15,
  },
  settingTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: 4,
  },
  settingSubtitle: {
    fontSize: 13,
    color: '#95A5A6',
    lineHeight: 18,
  },
  securityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  securityLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  securityIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  statusBadge: {
    fontSize: 13,
    color: '#95A5A6',
    fontWeight: '600',
  },
  enabledBadge: {
    color: '#4CAF50',
  },
  actionButton: {
    backgroundColor: '#fff',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
    borderWidth: 1.5,
    borderColor: '#2196F3',
  },
  yellowButton: {
    borderColor: '#F57C00',
  },
  redButton: {
    backgroundColor: '#D32F2F',
    borderColor: '#D32F2F',
  },
  buttonIcon: {
    marginRight: 8,
  },
  actionButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  infoLabel: {
    fontSize: 14,
    color: '#7F8C8D',
  },
  infoValue: {
    fontSize: 14,
    color: '#2C3E50',
    fontWeight: '600',
  },
  scoreCard: {
    backgroundColor: '#5C6BC0',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
    marginTop: 20,
    shadowColor: '#5C6BC0',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 5,
  },
  scoreIcon: {
    marginBottom: 6,
  },
  scoreLabel: {
    fontSize: 12,
    color: '#fff',
    marginBottom: 4,
    opacity: 0.9,
  },
  scoreValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
  },
});