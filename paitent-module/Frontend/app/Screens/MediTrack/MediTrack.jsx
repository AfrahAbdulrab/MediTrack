import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

export default function MediTrack() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      {/* Skip Button */}
      <TouchableOpacity 
        style={styles.skip} 
        onPress={() => router.replace('(tabs)')}
        activeOpacity={0.7}
      >
       
      </TouchableOpacity>

      {/* Progress Indicator */}
      <View style={styles.progressContainer}>
        <View style={[styles.progressDot, styles.progressDotActive]} />
        <View style={styles.progressDot} />
        <View style={styles.progressDot} />
      </View>

      {/* Main Content */}
      <View style={styles.content}>
        {/* Icon with Pulse Effect */}
        <View style={styles.iconContainer}>
          <View style={styles.pulseOuter} />
          <View style={styles.pulseMiddle} />
          <View style={styles.iconCircle}>
            <Ionicons name="heart" size={80} color="#ff4d4d" />
          </View>
        </View>

        {/* Title Section */}
        <Text style={styles.title}>Medi Track</Text>
        <Text style={styles.subtitle}>Your Health, Always Within Range</Text>

        {/* Feature Highlights */}
        <View style={styles.features}>
          <View style={styles.featurePill}>
            <Ionicons name="fitness" size={18} color="#ff4d4d" />
            <Text style={styles.featureText}>Real-time Tracking</Text>
          </View>
          <View style={styles.featurePill}>
            <Ionicons name="shield-checkmark" size={18} color="#4169E1" />
            <Text style={styles.featureText}>Secure & Private</Text>
          </View>
        </View>
      </View>

      {/* Next Button */}
       <TouchableOpacity 
        style={styles.button} 
        onPress={() => router.push('/Screens/Intro1/Intro1')}
        activeOpacity={0.8}
      >
        <View style={styles.buttonGradient}>
          <Text style={styles.buttonText}>Next</Text>
          <Ionicons name="chevron-forward" size={22} color="#fff" style={{ marginLeft: 8 }} />
        </View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingHorizontal: 20,
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
    backgroundColor: '#ff4d4d',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: -40,
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
    backgroundColor: '#ff4d4d',
    opacity: 0.08,
  },
  pulseMiddle: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: '#ff4d4d',
    opacity: 0.12,
  },
  iconCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#ff4d4d',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
    color: '#1a1a1a',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 17,
    color: '#1a1a1a',
    textAlign: 'center',
    lineHeight: 26,
    fontWeight: '400',
    marginBottom: 32,
    paddingHorizontal: 20,
  },
  features: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  featurePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#fff',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  featureText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
  },
  button: {
    marginBottom: 50,
    borderRadius: 30,
    overflow: 'hidden',
    shadowColor: '#4169E1',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
    backgroundColor: '#5a7fff',
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 50,
    backgroundColor: '#4169E1',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});