// Path: app/Screens/HomeScreen/ShareLocation/ShareLocation.jsx

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import * as Location from 'expo-location';
import * as SMS from 'expo-sms';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';

export default function ShareLocation() {
  const router = useRouter();
  const [contacts, setContacts] = useState([]);
  const [isSending, setIsSending] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // 🔥 REAL-TIME: Load contacts jab bhi screen focus ho
  useFocusEffect(
    React.useCallback(() => {
      loadContacts();
    }, [])
  );

  // 🔹 Load contacts from AsyncStorage
  const loadContacts = async () => {
    setIsLoading(true);
    try {
      const savedContacts = await AsyncStorage.getItem('emergencyContacts');
      console.log('📦 Raw data from storage:', savedContacts);
      
      if (savedContacts) {
        const parsed = JSON.parse(savedContacts);
        console.log('📋 Parsed contacts:', parsed);
        
        // Support multiple data structures
        let contactsList = [];
        
        if (Array.isArray(parsed)) {
          contactsList = parsed.map((c) => ({
            name: c.fullName || c.name || c.firstName || 'Unknown',
            phone: c.phoneNumber || c.phone || c.number || '',
            relationship: c.relationship || c.relation || 'Guardian'
          }));
        }
        
        // Filter valid contacts (must have phone number)
        const validContacts = contactsList.filter(c => c.phone && c.phone.trim() !== '');
        
        console.log('✅ Valid contacts:', validContacts);
        setContacts(validContacts);
      } else {
        console.log('⚠️ No contacts found in AsyncStorage');
        setContacts([]);
      }
    } catch (error) {
      console.error('❌ Error loading contacts:', error);
      setContacts([]);
    } finally {
      setIsLoading(false);
    }
  };

  // 🔹 Share location to ALL guardians
  const shareLocation = async () => {
    if (contacts.length === 0) {
      Alert.alert(
        '❌ No Contacts', 
        'Please add emergency contacts first.',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Add Now', 
            onPress: () => router.push('/Screens/EmergencyContact/EmergencyContact')
          }
        ]
      );
      return;
    }

    setIsSending(true);

    try {
      // Get location permission
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is required.');
        setIsSending(false);
        return;
      }

      // Get current location
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const { latitude, longitude } = location.coords;

      // Get address
      let address = 'Address not available';
      try {
        const addressResults = await Location.reverseGeocodeAsync({ latitude, longitude });
        if (addressResults.length > 0) {
          const addr = addressResults[0];
          address = [
            addr.name,
            addr.street,
            addr.city,
            addr.region,
            addr.country,
          ].filter(Boolean).join(', ');
        }
      } catch (error) {
        console.log('⚠️ Reverse geocode failed:', error);
      }

      // Create message
      const mapsUrl = `https://www.google.com/maps?q=${latitude},${longitude}`;
      const timestamp = new Date().toLocaleString();
      
      const message = `🚨 EMERGENCY ALERT 🚨\n\nI need help! My current location:\n\n📍 ${address}\n\n🗺️ View on Map:\n${mapsUrl}\n\n📌 Coordinates:\n${latitude.toFixed(6)}, ${longitude.toFixed(6)}\n\n⏰ ${timestamp}\n\n- Sent from MediTrack`;

      // Check SMS availability
      const isAvailable = await SMS.isAvailableAsync();
      if (!isAvailable) {
        Alert.alert('SMS Unavailable', 'This device cannot send SMS.');
        setIsSending(false);
        return;
      }

      // Send to ALL contacts
      const phoneNumbers = contacts.map((c) => c.phone);
      console.log('📧 Sending SMS to:', phoneNumbers);

      const { result } = await SMS.sendSMSAsync(phoneNumbers, message);
      
      if (result === 'sent') {
        Alert.alert(
          '✅ Success!', 
          `Location sent to ${contacts.length} guardian${contacts.length > 1 ? 's' : ''}!`,
          [{ text: 'OK', onPress: () => router.back() }]
        );
      } else {
        Alert.alert('Cancelled', 'SMS was cancelled.');
      }
      
    } catch (error) {
      console.error('❌ Error:', error);
      Alert.alert('Error', 'Failed to send location. Try again.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="chevron-back-outline" size={28} color="#007BFF" />
        </TouchableOpacity>
        <Text style={styles.title}>Share Live Location</Text>
      </View>

      {/* Info Box */}
      <View style={styles.infoCard}>
        <Ionicons name="information-circle" size={24} color="#3B82F6" />
        <Text style={styles.infoText}>
          Your location will be sent to all emergency contacts via SMS
        </Text>
      </View>

      {/* Send Button */}
      <TouchableOpacity
        style={[styles.button, isSending && { backgroundColor: '#ff6b60' }]}
        onPress={shareLocation}
        disabled={isSending || isLoading}
      >
        {isSending ? (
          <>
            <ActivityIndicator color="#fff" size="small" />
            <Text style={styles.buttonText}>Sending...</Text>
          </>
        ) : (
          <>
            <Ionicons name="location-sharp" size={24} color="#fff" />
            <Text style={styles.buttonText}>Send Location Now</Text>
          </>
        )}
      </TouchableOpacity>

      {/* Contacts Section */}
      <View style={styles.contactBox}>
        <View style={styles.contactHeader}>
          <Text style={styles.contactTitle}>
            Emergency Contacts ({contacts.length})
          </Text>
          <TouchableOpacity 
            style={styles.syncButton}
            onPress={loadContacts}
            disabled={isLoading}
          >
            <Ionicons 
              name="sync" 
              size={18} 
              color="#3B82F6"
            />
            <Text style={styles.syncText}>Refresh</Text>
          </TouchableOpacity>
        </View>

        {isLoading ? (
          <View style={styles.centerContent}>
            <ActivityIndicator size="large" color="#3B82F6" />
            <Text style={styles.loadingText}>Loading contacts...</Text>
          </View>
        ) : contacts.length === 0 ? (
          <View style={styles.centerContent}>
            <Ionicons name="people-outline" size={64} color="#D1D5DB" />
            <Text style={styles.emptyTitle}>No Contacts Added</Text>
            <Text style={styles.emptyText}>Add emergency contacts to continue</Text>
            <TouchableOpacity 
              style={styles.addButton}
              onPress={() => router.push('/Screens/EmergencyContact/EmergencyContact')}
            >
              <Ionicons name="add-circle" size={22} color="#fff" />
              <Text style={styles.addButtonText}>Add Contacts</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.contactsList}>
            {contacts.map((contact, index) => (
              <View key={index} style={styles.contactItem}>
                <View style={styles.contactIcon}>
                  <Ionicons name="person" size={22} color="#3B82F6" />
                </View>
                <View style={styles.contactInfo}>
                  <Text style={styles.contactName}>{contact.name}</Text>
                  <Text style={styles.contactPhone}>📞 {contact.phone}</Text>
                </View>
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{contact.relationship}</Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Success Note */}
      {contacts.length > 0 && (
        <View style={styles.noteCard}>
          <Ionicons name="checkmark-circle" size={22} color="#10B981" />
          <Text style={styles.noteText}>
            All {contacts.length} guardian{contacts.length > 1 ? 's' : ''} will receive your location
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 20,
  },
  backButton: {
    marginRight: 10,
    padding: 5,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6',
  },
  infoText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 14,
    color: '#1E40AF',
    lineHeight: 20,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EF4444',
    paddingVertical: 18,
    borderRadius: 14,
    marginBottom: 24,
    gap: 10,
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  contactBox: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  contactHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  contactTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  syncButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
  },
  syncText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#3B82F6',
  },
  centerContent: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
  },
  emptyText: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 8,
    marginBottom: 20,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#3B82F6',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  contactsList: {
    gap: 12,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  contactIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  contactPhone: {
    fontSize: 14,
    color: '#6B7280',
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#DBEAFE',
    borderRadius: 14,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1E40AF',
  },
  noteCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D1FAE5',
    padding: 14,
    borderRadius: 12,
    gap: 10,
  },
  noteText: {
    flex: 1,
    fontSize: 14,
    color: '#065F46',
    fontWeight: '500',
  },
});