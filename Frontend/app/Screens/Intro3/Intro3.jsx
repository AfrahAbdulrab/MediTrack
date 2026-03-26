import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Phone } from "lucide-react-native";
import { Entypo } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function Intro3() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Back Button */}
      <TouchableOpacity 
        style={styles.back} 
        onPress={() => router.back()}
        activeOpacity={0.7}
      >
        <View style={styles.navButton}>
          <Entypo name="chevron-left" size={24} color="#333" />
        </View>
      </TouchableOpacity>

      {/* Progress Indicator */}
      <View style={styles.progressContainer}>
        <View style={styles.progressDot} />
        <View style={styles.progressDot} />
        <View style={[styles.progressDot, styles.progressDotActive]} />
        <View style={styles.progressDot} />
      </View>

      <View style={styles.content}>
        {/* Icon with animated pulse effect background */}
        <View style={styles.iconContainer}>
          <View style={styles.pulseOuter} />
          <View style={styles.pulseMiddle} />
          <View style={styles.iconCircle}>
            <Phone size={60} color="#EF4444" strokeWidth={2} />
            <Text style={styles.sosText}>SOS</Text>
          </View>
        </View>

        <Text style={styles.title}>Emergency Alert{'\n'}System</Text>
        <Text style={styles.description}>
          AI monitoring detects abnormal vitals and instantly alerts your emergency contacts with your location.
        </Text>
      </View>

      {/* Next Button */}
      <TouchableOpacity 
        style={styles.button} 
        onPress={() => router.push('/Screens/Intro4/Intro4')}
        activeOpacity={0.8}
      >
        <View style={styles.buttonGradient}>
          <Text style={styles.buttonText}>Next</Text>
          <Entypo name="chevron-right" size={22} color="#fff" style={{ marginLeft: 8 }} />
        </View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#fff', 
    paddingHorizontal: 20 
  },
  back: { 
    position: 'absolute', 
    top: 60, 
    left: 20,
    zIndex: 10
  },
  navButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginTop: 120,
    marginBottom: 40,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ddd',
  },
  progressDotActive: {
    width: 28,
    backgroundColor: '#EF4444',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: 50,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pulseOuter: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#EF4444',
    opacity: 0.08,
  },
  pulseMiddle: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: '#EF4444',
    opacity: 0.12,
  },
  iconCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
    position: 'relative',
  },
  sosText: {
    position: 'absolute',
    top: 25,
    fontSize: 20,
    fontWeight: 'bold',
    color: '#EF4444',
    letterSpacing: 2,
  },
  title: { 
    fontSize: 28, 
    fontWeight: 'bold', 
    textAlign: 'center', 
    marginBottom: 16,
    color: '#1a1a1a',
    lineHeight: 36,
  },
  description: { 
    textAlign: 'center', 
    color: '#666', 
    fontSize: 16, 
    marginBottom: 32,
    lineHeight: 24,
    paddingHorizontal: 10,
  },
  button: { 
    marginBottom: 50,
    borderRadius: 30,
    overflow: 'hidden',
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
    backgroundColor: '#ff6b6b',
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 50,
    backgroundColor: '#EF4444',
  },
  buttonText: { 
    color: '#fff', 
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});