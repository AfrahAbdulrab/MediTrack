import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Switch, Modal } from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Footer from '../../components/Footer'; // Adjust path according to your Footer location

export default function DeviceSettingsScreen() {
  const [autoConnect, setAutoConnect] = useState(true);
  const [bluetoothLowEnergy, setBluetoothLowEnergy] = useState(true);
  const [syncDropdownOpen, setSyncDropdownOpen] = useState(false);
  const [selectedSync, setSelectedSync] = useState('Real Time');
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  
  const router = useRouter();

  const syncOptions = [
    { label: 'Real Time', subtitle: 'Every 5 Minutes', icon: 'flash' },
    { label: 'Every 30 Minutes', subtitle: 'Moderate sync', icon: 'time' },
    { label: 'Hourly', subtitle: 'Battery saver', icon: 'hourglass' },
    { label: 'Daily', subtitle: 'Manual sync', icon: 'calendar' },
  ];

  const handleSyncSelect = (option) => {
    setSelectedSync(option.label);
    setSyncDropdownOpen(false);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={26} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Device Settings</Text>
        <View style={{ width: 26 }} />
      </View>

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* Connected Device Card */}
        <View style={styles.deviceCard}>
          <View style={styles.deviceHeader}>
            <View style={styles.deviceIconContainer}>
              <Ionicons name="watch" size={36} color="#42A5F5" />
            </View>
            <View style={styles.deviceInfo}>
              <Text style={styles.deviceName}>MediPulse Pro</Text>
              <Text style={styles.deviceId}>ID: MT2024</Text>
            </View>
          </View>
          
          <View style={styles.deviceStatusRow}>
            <View style={styles.statusItem}>
              <View style={styles.connectedBadge}>
                <View style={styles.connectedDot} />
                <Text style={styles.connectedText}>Connected</Text>
              </View>
            </View>
            <View style={styles.batteryBadge}>
              <Ionicons name="battery-charging" size={18} color="#66BB6A" />
              <Text style={styles.batteryText}>87%</Text>
            </View>
          </View>
        </View>

        {/* Device Information Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Device Information</Text>
          
          <View style={styles.card}>
            <View style={styles.infoRow}>
              <View style={styles.infoLeft}>
                <Ionicons name="hardware-chip" size={20} color="#757575" />
                <Text style={styles.infoLabel}>Model</Text>
              </View>
              <Text style={styles.infoValue}>Medipulse Pro V2.1</Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.infoRow}>
              <View style={styles.infoLeft}>
                <Ionicons name="code-slash" size={20} color="#757575" />
                <Text style={styles.infoLabel}>Firmware</Text>
              </View>
              <Text style={styles.infoValue}>v1.4.2</Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.infoRow}>
              <View style={styles.infoLeft}>
                <Ionicons name="barcode" size={20} color="#757575" />
                <Text style={styles.infoLabel}>Serial Number</Text>
              </View>
              <Text style={styles.infoValue}>MT2024-001-PK</Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.infoRow}>
              <View style={styles.infoLeft}>
                <Ionicons name="shield-checkmark" size={20} color="#66BB6A" />
                <Text style={styles.infoLabel}>Warranty</Text>
              </View>
              <Text style={styles.infoValueGreen}>Valid till Dec 2030</Text>
            </View>
          </View>
        </View>

        {/* Connection Settings Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Connection Settings</Text>
          
          <View style={styles.card}>
            <View style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <View style={[styles.settingIcon, { backgroundColor: '#E3F2FD' }]}>
                  <Ionicons name="wifi" size={22} color="#42A5F5" />
                </View>
                <View style={styles.settingInfo}>
                  <Text style={styles.settingTitle}>Auto-Connect</Text>
                  <Text style={styles.settingSubtitle}>Connect automatically when in range</Text>
                </View>
              </View>
              <Switch
                value={autoConnect}
                onValueChange={setAutoConnect}
                trackColor={{ false: '#E0E0E0', true: '#4CAF50' }}
                thumbColor="#fff"
                ios_backgroundColor="#E0E0E0"
              />
            </View>

            <View style={styles.divider} />

            <View style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <View style={[styles.settingIcon, { backgroundColor: '#E8F5E9' }]}>
                  <Ionicons name="bluetooth" size={22} color="#66BB6A" />
                </View>
                <View style={styles.settingInfo}>
                  <Text style={styles.settingTitle}>Bluetooth Low Energy</Text>
                  <Text style={styles.settingSubtitle}>Optimize battery consumption</Text>
                </View>
              </View>
              <Switch
                value={bluetoothLowEnergy}
                onValueChange={setBluetoothLowEnergy}
                trackColor={{ false: '#E0E0E0', true: '#4CAF50' }}
                thumbColor="#fff"
                ios_backgroundColor="#E0E0E0"
              />
            </View>
          </View>
        </View>

        {/* Data Sync Settings Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data Sync Settings</Text>
          
          <View style={styles.card}>
            <TouchableOpacity 
              style={styles.dropdownButton}
              onPress={() => setSyncDropdownOpen(!syncDropdownOpen)}
            >
              <View style={styles.dropdownLeft}>
                <Text style={styles.dropdownLabel}>Sync Frequency</Text>
                <View style={styles.dropdownValueRow}>
                  <Ionicons name="sync" size={16} color="#42A5F5" />
                  <Text style={styles.dropdownValue}>{selectedSync}</Text>
                </View>
              </View>
              <Ionicons 
                name={syncDropdownOpen ? "chevron-up" : "chevron-down"} 
                size={22} 
                color="#BDBDBD" 
              />
            </TouchableOpacity>

            {syncDropdownOpen && (
              <View style={styles.dropdownMenu}>
                {syncOptions.map((option, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.dropdownItem,
                      selectedSync === option.label && styles.dropdownItemActive,
                      index === syncOptions.length - 1 && { borderBottomWidth: 0 }
                    ]}
                    onPress={() => handleSyncSelect(option)}
                  >
                    <View style={styles.dropdownItemLeft}>
                      <Ionicons 
                        name={option.icon} 
                        size={20} 
                        color={selectedSync === option.label ? '#fff' : '#757575'} 
                      />
                      <View style={styles.dropdownItemText}>
                        <Text style={[
                          styles.dropdownItemLabel,
                          selectedSync === option.label && styles.dropdownItemLabelActive
                        ]}>
                          {option.label}
                        </Text>
                        {option.subtitle !== '' && (
                          <Text style={[
                            styles.dropdownItemSubtitle,
                            selectedSync === option.label && styles.dropdownItemSubtitleActive
                          ]}>
                            {option.subtitle}
                          </Text>
                        )}
                      </View>
                    </View>
                    {selectedSync === option.label && (
                      <Ionicons name="checkmark-circle" size={22} color="#fff" />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            )}

            <View style={styles.divider} />

            <View style={styles.lastSyncRow}>
              <View style={styles.lastSyncLeft}>
                <Ionicons name="time-outline" size={18} color="#757575" />
                <Text style={styles.lastSyncLabel}>Last sync</Text>
              </View>
              <Text style={styles.lastSyncValue}>09:02:04 PM</Text>
            </View>

            <TouchableOpacity style={styles.forceSyncButton}>
              <Ionicons name="refresh" size={18} color="#fff" />
              <Text style={styles.forceSyncText}>Force Sync Now</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Firmware Update Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Firmware Update</Text>
          
          <View style={styles.updateCard}>
            <View style={styles.updateIconContainer}>
              <Ionicons name="shield-checkmark" size={48} color="#66BB6A" />
            </View>
            <Text style={styles.updateTitle}>Device is up to date</Text>
            <Text style={styles.updateSubtitle}>Current version: v1.4.2</Text>
            
            <TouchableOpacity 
              style={styles.checkUpdateButton}
              onPress={() => setShowUpdateModal(true)}
            >
              <Ionicons name="cloud-download-outline" size={20} color="#42A5F5" />
              <Text style={styles.checkUpdateText}>Check for Updates</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Update Modal */}
      <Modal
        visible={showUpdateModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowUpdateModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalIconContainer}>
              <Ionicons name="checkmark-circle" size={70} color="#66BB6A" />
            </View>
            <Text style={styles.modalTitle}>No Updates Available</Text>
            <Text style={styles.modalMessage}>Your device is running the latest firmware version</Text>
            <TouchableOpacity 
              style={styles.modalButton}
              onPress={() => setShowUpdateModal(false)}
            >
              <Text style={styles.modalButtonText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Reusable Footer Component */}
      <Footer />
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

  // Device Card
  deviceCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  deviceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  deviceIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  deviceInfo: {
    flex: 1,
  },
  deviceName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  deviceId: {
    fontSize: 14,
    color: '#757575',
    fontWeight: '500',
  },
  deviceStatusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F5F5F5',
  },
  statusItem: {
    flex: 1,
  },
  connectedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  connectedDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#66BB6A',
    marginRight: 8,
  },
  connectedText: {
    fontSize: 15,
    color: '#66BB6A',
    fontWeight: '600',
  },
  batteryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  batteryText: {
    fontSize: 14,
    color: '#66BB6A',
    marginLeft: 6,
    fontWeight: '600',
  },

  // Section
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#757575',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
    paddingLeft: 4,
  },

  // Card
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },

  // Info Rows
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  infoLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  infoLabel: {
    fontSize: 15,
    color: '#616161',
    fontWeight: '500',
    marginLeft: 12,
  },
  infoValue: {
    fontSize: 15,
    color: '#1A1A1A',
    fontWeight: '600',
  },
  infoValueGreen: {
    fontSize: 15,
    color: '#66BB6A',
    fontWeight: '600',
  },

  // Setting Rows
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  settingIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  settingInfo: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  settingSubtitle: {
    fontSize: 13,
    color: '#757575',
  },

  // Divider
  divider: {
    height: 1,
    backgroundColor: '#F5F5F5',
    marginVertical: 4,
  },

  // Dropdown
  dropdownButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  dropdownLeft: {
    flex: 1,
  },
  dropdownLabel: {
    fontSize: 13,
    color: '#757575',
    marginBottom: 6,
    fontWeight: '500',
  },
  dropdownValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dropdownValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginLeft: 8,
  },
  dropdownMenu: {
    marginTop: 12,
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    overflow: 'hidden',
  },
  dropdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  dropdownItemActive: {
    backgroundColor: '#42A5F5',
  },
  dropdownItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  dropdownItemText: {
    marginLeft: 12,
  },
  dropdownItemLabel: {
    fontSize: 15,
    color: '#1A1A1A',
    fontWeight: '600',
    marginBottom: 2,
  },
  dropdownItemLabelActive: {
    color: '#fff',
  },
  dropdownItemSubtitle: {
    fontSize: 12,
    color: '#757575',
  },
  dropdownItemSubtitleActive: {
    color: 'rgba(255, 255, 255, 0.8)',
  },

  // Last Sync
  lastSyncRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  lastSyncLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  lastSyncLabel: {
    fontSize: 14,
    color: '#757575',
    marginLeft: 8,
    fontWeight: '500',
  },
  lastSyncValue: {
    fontSize: 14,
    color: '#1A1A1A',
    fontWeight: '600',
  },

  // Force Sync Button
  forceSyncButton: {
    flexDirection: 'row',
    backgroundColor: '#42A5F5',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    shadowColor: '#42A5F5',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  forceSyncText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
    marginLeft: 8,
  },

  // Update Card
  updateCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  updateIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  updateTitle: {
    fontSize: 18,
    color: '#1A1A1A',
    fontWeight: '700',
    marginBottom: 6,
  },
  updateSubtitle: {
    fontSize: 14,
    color: '#757575',
    marginBottom: 20,
  },
  checkUpdateButton: {
    flexDirection: 'row',
    backgroundColor: '#E3F2FD',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
    alignItems: 'center',
  },
  checkUpdateText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#42A5F5',
    marginLeft: 8,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    width: '85%',
    maxWidth: 340,
  },
  modalIconContainer: {
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 10,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 15,
    color: '#757575',
    marginBottom: 28,
    textAlign: 'center',
    lineHeight: 22,
  },
  modalButton: {
    backgroundColor: '#42A5F5',
    paddingVertical: 14,
    paddingHorizontal: 60,
    borderRadius: 12,
    shadowColor: '#42A5F5',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
});