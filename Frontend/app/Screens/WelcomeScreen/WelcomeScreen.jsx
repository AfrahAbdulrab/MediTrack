import { View, Text, StyleSheet, TouchableOpacity, Animated, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef } from 'react';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

export default function WelcomeScreen() {
  const router = useRouter();
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0)).current;
  const logoRotate = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const titleSlide = useRef(new Animated.Value(50)).current;
  const subtitleSlide = useRef(new Animated.Value(50)).current;
  const button1Scale = useRef(new Animated.Value(0)).current;
  const button2Scale = useRef(new Animated.Value(0)).current;
  const floatingAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Main fade in
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();

    // Logo entrance animation
    Animated.parallel([
      Animated.spring(logoScale, {
        toValue: 1,
        delay: 300,
        tension: 40,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.spring(logoRotate, {
        toValue: 1,
        delay: 300,
        tension: 40,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Start pulse animation after logo appears
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.15,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    });

    // Title animations
    Animated.spring(titleSlide, {
      toValue: 0,
      delay: 600,
      tension: 50,
      friction: 8,
      useNativeDriver: true,
    }).start();

    Animated.spring(subtitleSlide, {
      toValue: 0,
      delay: 750,
      tension: 50,
      friction: 8,
      useNativeDriver: true,
    }).start();

    // Button animations
    Animated.spring(button1Scale, {
      toValue: 1,
      delay: 900,
      tension: 50,
      friction: 7,
      useNativeDriver: true,
    }).start();

    Animated.spring(button2Scale, {
      toValue: 1,
      delay: 1050,
      tension: 50,
      friction: 7,
      useNativeDriver: true,
    }).start();

    // Floating animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatingAnim, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: true,
        }),
        Animated.timing(floatingAnim, {
          toValue: 0,
          duration: 3000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const logoRotation = logoRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const floatingY = floatingAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -15],
  });

  return (
    <View style={styles.container}>
      {/* Background Gradient */}
      <View style={styles.gradientBackground}>
        <View style={[styles.gradientCircle, styles.circle1]} />
        <View style={[styles.gradientCircle, styles.circle2]} />
        <View style={[styles.gradientCircle, styles.circle3]} />
      </View>

      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        {/* Logo Container with Medical Cross */}
        <Animated.View
          style={[
            styles.logoContainer,
            {
              transform: [
                { scale: Animated.multiply(logoScale, pulseAnim) },
                { rotate: logoRotation },
                { translateY: floatingY },
              ],
            },
          ]}
        >
          {/* Outer circle glow */}
          <View style={styles.outerGlow} />
          
          {/* Main logo circle */}
          <View style={styles.logoCircle}>
            {/* Medical cross */}
            <View style={styles.crossVertical} />
            <View style={styles.crossHorizontal} />
            
            {/* Heart icon in center */}
            <View style={styles.heartContainer}>
              <Ionicons name="heart" size={45} color="#fff" />
            </View>
          </View>

          {/* Pulse rings */}
          <Animated.View 
            style={[
              styles.pulseRing,
              {
                transform: [{ scale: pulseAnim }],
                opacity: pulseAnim.interpolate({
                  inputRange: [1, 1.15],
                  outputRange: [0.6, 0],
                }),
              },
            ]}
          />
        </Animated.View>

        {/* Title Section */}
        <Animated.View
          style={{
            transform: [{ translateY: titleSlide }],
            opacity: titleSlide.interpolate({
              inputRange: [0, 50],
              outputRange: [1, 0],
            }),
          }}
        >
          <Text style={styles.title}>MediTrack</Text>
        </Animated.View>

        <Animated.View
          style={{
            transform: [{ translateY: subtitleSlide }],
            opacity: subtitleSlide.interpolate({
              inputRange: [0, 50],
              outputRange: [1, 0],
            }),
          }}
        >
          <Text style={styles.subtitle}>Your Health, Our Priority</Text>
          <Text style={styles.tagline}>Track • Monitor • Stay Healthy</Text>
        </Animated.View>

        {/* Buttons */}
        <View style={styles.buttonContainer}>
          <Animated.View
            style={{
              transform: [{ scale: button1Scale }],
              width: '100%',
            }}
          >
            <TouchableOpacity
              style={styles.signInButton}
              onPress={() => router.push('/Screens/SignIn/SignIn')}
              activeOpacity={0.8}
            >
              <Ionicons name="log-in-outline" size={22} color="#fff" style={styles.buttonIcon} />
              <Text style={styles.buttonText}>Sign In</Text>
            </TouchableOpacity>
          </Animated.View>

          <Animated.View
            style={{
              transform: [{ scale: button2Scale }],
              width: '100%',
            }}
          >
            <TouchableOpacity
              style={styles.signUpButton}
              onPress={() => router.push('/Screens/SignUp/SignUp')}
              activeOpacity={0.8}
            >
              <Ionicons name="person-add-outline" size={22} color="#667eea" style={styles.buttonIcon} />
              <Text style={[styles.buttonText, styles.signUpText]}>Sign Up</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>

        {/* Features Section */}
        <View style={styles.featuresContainer}>
          <View style={styles.featureItem}>
            <Ionicons name="fitness-outline" size={20} color="#667eea" />
            <Text style={styles.featureText}>Vitals Tracking</Text>
          </View>
          <View style={styles.featureItem}>
            <Ionicons name="analytics-outline" size={20} color="#667eea" />
            <Text style={styles.featureText}>AI Analysis</Text>
          </View>
          <View style={styles.featureItem}>
            <Ionicons name="shield-checkmark-outline" size={20} color="#667eea" />
            <Text style={styles.featureText}>Secure & Private</Text>
          </View>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9ff',
  },
  gradientBackground: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  gradientCircle: {
    position: 'absolute',
    borderRadius: 1000,
  },
  circle1: {
    width: 300,
    height: 300,
    backgroundColor: 'rgba(102, 126, 234, 0.15)',
    top: -100,
    right: -100,
  },
  circle2: {
    width: 250,
    height: 250,
    backgroundColor: 'rgba(118, 75, 162, 0.1)',
    bottom: -80,
    left: -80,
  },
  circle3: {
    width: 200,
    height: 200,
    backgroundColor: 'rgba(102, 126, 234, 0.08)',
    top: height / 2,
    left: -50,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  logoContainer: {
    marginBottom: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  outerGlow: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(102, 126, 234, 0.2)',
  },
  logoCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#667eea',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 15,
    borderWidth: 5,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  crossVertical: {
    position: 'absolute',
    width: 20,
    height: 70,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 10,
  },
  crossHorizontal: {
    position: 'absolute',
    width: 70,
    height: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 10,
  },
  heartContainer: {
    zIndex: 10,
  },
  pulseRing: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    borderWidth: 3,
    borderColor: '#667eea',
  },
  title: {
    fontSize: 42,
    fontWeight: 'bold',
    color: '#667eea',
    marginBottom: 8,
    textAlign: 'center',
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 18,
    color: '#666',
    marginBottom: 5,
    textAlign: 'center',
    fontWeight: '600',
  },
  tagline: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginBottom: 50,
    letterSpacing: 2,
  },
  buttonContainer: {
    width: '100%',
    gap: 15,
  },
  signInButton: {
    flexDirection: 'row',
    backgroundColor: '#667eea',
    width: '100%',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  signUpButton: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    width: '100%',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#667eea',
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonIcon: {
    marginRight: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  signUpText: {
    color: '#667eea',
  },
  featuresContainer: {
    flexDirection: 'row',
    marginTop: 40,
    gap: 20,
  },
  featureItem: {
    alignItems: 'center',
    gap: 5,
  },
  featureText: {
    fontSize: 11,
    color: '#999',
    fontWeight: '600',
  },
});