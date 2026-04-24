import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { FontAwesome5, Entypo, MaterialCommunityIcons } from '@expo/vector-icons';

export default function Intro2() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      {/* Back Button */}
      <TouchableOpacity 
        style={styles.back} 
        onPress={() => router.push('/Screens/Intro1/Intro1')}
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
      </View>

      <View style={styles.content}> b
        {/* Icon with animated pulse effect background */}
        <View style={styles.iconContainer}>
          <View style={styles.pulseOuter} />
          <View style={styles.pulseMiddle} />
          <View style={styles.iconCircle}>
            <MaterialCommunityIcons name="shield-check" size={80} color="#4169E1" />
          </View>
        </View>

        <Text style={styles.title}>Secure & Private{'\n'}Data Protection</Text>
        <Text style={styles.description}>
          Your health data is encrypted and stored securely. We prioritize your privacy with industry-leading security standards.
        </Text>

        {/* Feature Pills */}
        <View style={styles.features}>
          <View style={styles.featurePill}>
            <FontAwesome5 name="lock" size={16} color="#4169E1" />
            <Text style={styles.featureText}>Encrypted</Text>
          </View>
          <View style={styles.featurePill}>
            <MaterialCommunityIcons name="shield-check" size={16} color="#00C853" />
            <Text style={styles.featureText}>HIPAA Compliant</Text>
          </View>
          <View style={styles.featurePill}>
            <FontAwesome5 name="user-shield" size={16} color="#ff8c42" />
            <Text style={styles.featureText}>Private</Text>
          </View>
        </View>
      </View>

      {/* Next Button */}
      <TouchableOpacity 
        style={styles.button} 
        onPress={() => router.push('/Screens/Intro3/Intro3')}
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
    backgroundColor: '#4169E1',
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
    backgroundColor: '#4169E1',
    opacity: 0.08,
  },
  pulseMiddle: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: '#4169E1',
    opacity: 0.12,
  },
  iconCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#4169E1',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
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