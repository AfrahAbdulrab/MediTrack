import { View, Text, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import { FontAwesome5, Entypo, MaterialCommunityIcons } from '@expo/vector-icons';
import { useState } from 'react';
export default function RoleSelect() {
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState('patient');

  return (
    <View style={styles.container}>

      {/* Logo & Branding */}
      <View style={styles.brandContainer}>
        <View style={styles.logoCircle}>
          <MaterialCommunityIcons name="map-marker" size={42} color="#fff" />
        </View>
        <Text style={styles.brandTitle}>MediTrack</Text>
        <Text style={styles.brandSubtitle}>Your Health, Connected</Text>
      </View>

      {/* Role Selection */}
      <Text style={styles.heading}>How will you use this app?</Text>
      <Text style={styles.subheading}>Choose your role to get started</Text>

      <View style={styles.cardsRow}>

        {/* Guardian Card */}
        <TouchableOpacity
          style={[styles.card, selectedRole === 'guardian' && styles.cardActive]}
          onPress={() => setSelectedRole('guardian')}
          activeOpacity={0.85}
        >
          <View style={[styles.cardIconBg, { backgroundColor: '#FDE8E8' }]}>
            <FontAwesome5 name="users" size={28} color="#E57373" />
          </View>
          <Text style={styles.cardTitle}>Guardian</Text>
          <Text style={styles.cardDesc}>Monitor family member's health remotely</Text>
        </TouchableOpacity>

        {/* Patient Card */}
        <TouchableOpacity
          style={[styles.card, selectedRole === 'patient' && styles.cardActive]}
          onPress={() => setSelectedRole('patient')}
          activeOpacity={0.85}
        >
          <View style={[styles.cardIconBg, { backgroundColor: '#E8EAF6' }]}>
            <FontAwesome5 name="user" size={28} color="#4169E1" />
          </View>
          <Text style={styles.cardTitle}>Patient</Text>
          <Text style={styles.cardDesc}>Track your own vitals & health data</Text>
        </TouchableOpacity>

      </View>

      {/* Continue Button */}
      <TouchableOpacity
        style={styles.button}
        onPress={() => {
        if (selectedRole === 'guardian') {
  Linking.openURL('exp://192.168.1.3:8082/--/Screens/GuardianWelcomeScreen/GuardianWelcomeScreen');
}
           else {
           router.push('/Screens/WelcomeScreen/WelcomeScreen');
          }
        }}
        activeOpacity={0.85}
      >
        <Text style={styles.buttonText}>Continue</Text>
        <View style={styles.arrowCircle}>
          <Entypo name="chevron-right" size={18} color="#fff" />
        </View>
      </TouchableOpacity>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ECEEF8',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 40,
  },

  /* Brand */
  brandContainer: {
    alignItems: 'center',
    marginBottom: 36,
    marginTop: 40,
  },
  logoCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#4169E1',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
    shadowColor: '#4169E1',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.38,
    shadowRadius: 16,
    elevation: 8,
  },
  brandTitle: {
    fontSize: 34,
    fontWeight: '900',
    color: '#4169E1',
    letterSpacing: 0.6,
  },
  brandSubtitle: {
    fontSize: 15,
    color: '#999',
    marginTop: 4,
    fontWeight: '600',
  },

  /* Heading */
  heading: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1a1a1a',
    textAlign: 'center',
    marginBottom: 6,
  },
  subheading: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    marginBottom: 26,
  },

  /* Cards */
  cardsRow: {
    flexDirection: 'row',
    gap: 14,
    width: '100%',
    marginBottom: 30,
  },
  card: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingVertical: 24,
    paddingHorizontal: 14,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 2,
  },
  cardActive: {
    borderColor: '#4169E1',
    shadowColor: '#4169E1',
    shadowOpacity: 0.18,
    elevation: 5,
  },
  cardIconBg: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1a1a1a',
    textAlign: 'center',
    marginBottom: 6,
  },
  cardDesc: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    lineHeight: 17,
  },

  /* Button */
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#4169E1',
    borderRadius: 18,
    paddingVertical: 13,
    width: '70%',
    alignSelf: 'center',
    shadowColor: '#4169E1',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.38,
    shadowRadius: 16,
    elevation: 8,
  },
  buttonText: {
    fontSize: 17,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 0.3,
  },
  arrowCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.22)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});