import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import Footer from '../components/Footer';

export default function SettingScreen() {
  const router = useRouter();
  
  // Emergency contacts state - real time data (initially empty)
  const [emergencyContacts, setEmergencyContacts] = useState([]);

  const handleCallEmergency = (contact) => {
    Alert.alert(
      'Emergency Call',
      `Call ${contact.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Call', onPress: () => console.log(`Calling ${contact.name}`) }
      ]
    );
  };

  const handleAddEmergencyContact = () => {
    // Yahan aap navigation kar sakte hain add contact screen par
    Alert.alert('Add Contact', 'Navigate to add emergency contact screen');
    // router.push('/Screens/AddEmergencyContact');
  };

  const handleEditContact = (contact) => {
    Alert.alert('Edit Contact', `Edit ${contact.name}`);
    // router.push(`/Screens/EditEmergencyContact/${contact.id}`);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={26} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={{ width: 26 }} />
      </View>

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* Settings List */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>General</Text>
          
          <TouchableOpacity 
            style={styles.settingItem}
            onPress={() => router.push('/Screens/SettingScreen/NotificationsScreen/NotificationsScreen')}
          >
            <View style={[styles.iconContainer, { backgroundColor: '#FFF3E0' }]}>
              <Ionicons name="notifications" size={24} color="#FFB74D" />
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>Notifications</Text>
              <Text style={styles.settingSubtitle}>Manage your notifications</Text>
            </View>
            <Ionicons name="chevron-forward" size={22} color="#BDBDBD" />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.settingItem}
            onPress={() => router.push('/Screens/SettingScreen/DeviceSettingScreen/DeviceSettingScreen')}
          >
            <View style={[styles.iconContainer, { backgroundColor: '#E3F2FD' }]}>
              <Ionicons name="phone-portrait" size={24} color="#64B5F6" />
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>Device Setting</Text>
              <Text style={styles.settingSubtitle}>Manage your device</Text>
            </View>
            <Ionicons name="chevron-forward" size={22} color="#BDBDBD" />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.settingItem}
            onPress={() => router.push('/Screens/SettingScreen/Privacy&Security/Privacy&Security')}
          >
            <View style={[styles.iconContainer, { backgroundColor: '#E8F5E9' }]}>
              <Ionicons name="shield-checkmark" size={24} color="#81C784" />
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>Privacy & Security</Text>
              <Text style={styles.settingSubtitle}>Manage your privacy</Text>
            </View>
            <Ionicons name="chevron-forward" size={22} color="#BDBDBD" />
          </TouchableOpacity>
        </View>

        {/* Device & Health Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Device & Health</Text>

          <TouchableOpacity style={styles.settingItem}>
            <View style={[styles.iconContainer, { backgroundColor: '#F3E5F5' }]}>
              <Ionicons name="information-circle" size={24} color="#BA68C8" />
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>About Device</Text>
              <Text style={styles.settingSubtitle}>See device information</Text>
            </View>
            <Ionicons name="chevron-forward" size={22} color="#BDBDBD" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem}>
            <View style={[styles.iconContainer, { backgroundColor: '#FFEBEE' }]}>
              <Ionicons name="medical" size={24} color="#EF5350" />
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>Medical History</Text>
              <Text style={styles.settingSubtitle}>Manage your medical history</Text>
            </View>
            <Ionicons name="chevron-forward" size={22} color="#BDBDBD" />
          </TouchableOpacity>
        </View>

        {/* Support Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Support</Text>

          <TouchableOpacity 
            style={styles.settingItem}
            onPress={() => router.push('/Screens/SettingScreen/Support&Help/Support&Help')}
          >
            <View style={[styles.iconContainer, { backgroundColor: '#E0F2F1' }]}>
              <Ionicons name="help-circle" size={24} color="#26A69A" />
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>Support & Help</Text>
              <Text style={styles.settingSubtitle}>Get help and support</Text>
            </View>
            <Ionicons name="chevron-forward" size={22} color="#BDBDBD" />
          </TouchableOpacity>
        </View>

        {/* Emergency Contacts Section - Real Time */}
        <View style={styles.section}>
          <View style={styles.emergencyHeader}>
            <View style={styles.emergencyHeaderLeft}>
              <Ionicons name="alert-circle" size={22} color="#EF5350" />
              <Text style={styles.emergencyTitle}>Emergency Contacts</Text>
            </View>
            <TouchableOpacity 
              style={styles.addButton}
              onPress={handleAddEmergencyContact}
            >
              <Ionicons name="add-circle" size={28} color="#EF5350" />
            </TouchableOpacity>
          </View>

          {emergencyContacts.map((contact) => (
            <TouchableOpacity 
              key={contact.id}
              style={[styles.settingItem, styles.emergencyItem]}
              onLongPress={() => handleEditContact(contact)}
            >
              <View style={[styles.iconContainer, { backgroundColor: contact.color }]}>
                <Ionicons name={contact.icon} size={24} color={contact.iconColor} />
              </View>
              <View style={styles.settingContent}>
                <Text style={styles.settingTitle}>{contact.name}</Text>
                <Text style={styles.settingSubtitle}>{contact.relation}</Text>
              </View>
              <TouchableOpacity 
                style={styles.emergencyBadge}
                onPress={() => handleCallEmergency(contact)}
              >
                <Ionicons name="call" size={18} color="#fff" />
              </TouchableOpacity>
            </TouchableOpacity>
          ))}

          {emergencyContacts.length === 0 && (
            <View style={styles.emptyState}>
              <Ionicons name="people-outline" size={48} color="#BDBDBD" />
              <Text style={styles.emptyText}>No emergency contacts added</Text>
              <TouchableOpacity 
                style={styles.addEmptyButton}
                onPress={handleAddEmergencyContact}
              >
                <Text style={styles.addEmptyButtonText}>Add Contact</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>

      <Footer />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#d6eaf8ff',
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
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 20,
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
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 14,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    color: '#1A1A1A',
    fontWeight: '600',
    marginBottom: 4,
  },
  settingSubtitle: {
    fontSize: 13,
    color: '#9E9E9E',
  },
  
  // Emergency Contact Enhanced Styles
  emergencyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 15,
    paddingHorizontal: 4,
  },
  emergencyHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  emergencyTitle: {
    fontSize: 13,
    color: '#EF5350',
    fontWeight: '700',
    marginLeft: 8,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  addButton: {
    padding: 4,
  },
  emergencyItem: {
    borderLeftWidth: 4,
    borderLeftColor: '#EF5350',
    backgroundColor: '#FFFAFA',
  },
  emergencyBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EF5350',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#EF5350',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#F5F5F5',
    borderStyle: 'dashed',
  },
  emptyText: {
    fontSize: 15,
    color: '#9E9E9E',
    marginTop: 12,
    marginBottom: 20,
  },
  addEmptyButton: {
    backgroundColor: '#EF5350',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  addEmptyButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
});