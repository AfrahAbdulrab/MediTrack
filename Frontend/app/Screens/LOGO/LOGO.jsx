import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';

const LOGO = () => {
  const router = useRouter();
  
  // Animation values
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const heartbeatAnim = useRef(new Animated.Value(1)).current;
  const waveAnim = useRef(new Animated.Value(0)).current;
  const skipButtonAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Fade in animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();

    // Skip button fade in
    Animated.timing(skipButtonAnim, {
      toValue: 1,
      delay: 500,
      duration: 800,
      useNativeDriver: true,
    }).start();

    // Pulse animation for watch
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1000,
          easing: Easing.ease,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          easing: Easing.ease,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Rotation animation for connection line
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 2000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    // Heartbeat animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(heartbeatAnim, {
          toValue: 1.2,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(heartbeatAnim, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(heartbeatAnim, {
          toValue: 1.15,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(heartbeatAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Wave animation for vitals
    Animated.loop(
      Animated.timing(waveAnim, {
        toValue: 1,
        duration: 1500,
        easing: Easing.ease,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const waveTranslate = waveAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -20],
  });

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        
        {/* App Title */}
        <Text style={styles.appName}>MediTrack</Text>
        <Text style={styles.tagline}>Your Health, Connected</Text>

        {/* Main Logo Container */}
        <View style={styles.logoContainer}>
          
          {/* Smartwatch Icon */}
          <Animated.View 
            style={[
              styles.watchContainer,
              { transform: [{ scale: pulseAnim }] }
            ]}
          >
            <View style={styles.watch}>
              <View style={styles.watchScreen}>
                <Animated.View style={{ transform: [{ scale: heartbeatAnim }] }}>
                  <Text style={styles.heartIcon}>💓</Text>
                </Animated.View>
              </View>
              <View style={styles.watchBand} />
              <View style={styles.watchBandRight} />
            </View>
          </Animated.View>

          {/* Connection Animation */}
          <Animated.View 
            style={[
              styles.connectionLine,
              { transform: [{ rotate }] }
            ]}
          >
            <View style={styles.dot} />
            <View style={styles.dot} />
            <View style={styles.dot} />
          </Animated.View>

          {/* Medical Cross with Vitals */}
          <View style={styles.medicalContainer}>
            <View style={styles.medicalCross}>
              <View style={styles.crossVertical} />
              <View style={styles.crossHorizontal} />
              
              {/* Center Circle */}
              <View style={styles.centerCircle}>
                <Text style={styles.plusSign}>+</Text>
              </View>
            </View>

            {/* Vitals Display */}
            <View style={styles.vitalsContainer}>
              <Animated.View 
                style={[
                  styles.vitalItem,
                  { transform: [{ translateY: waveTranslate }] }
                ]}
              >
                <Text style={styles.vitalIcon}>❤️</Text>
                <Text style={styles.vitalValue}>72</Text>
                <Text style={styles.vitalLabel}>BPM</Text>
              </Animated.View>

              <View style={styles.vitalItem}>
                <Text style={styles.vitalIcon}>🌡️</Text>
                <Text style={styles.vitalValue}>98.6</Text>
                <Text style={styles.vitalLabel}>°F</Text>
              </View>

              <View style={styles.vitalItem}>
                <Text style={styles.vitalIcon}>💧</Text>
                <Text style={styles.vitalValue}>98</Text>
                <Text style={styles.vitalLabel}>SpO₂</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Loading Text */}
        <Text style={styles.loadingText}>Initializing...</Text>
        
        {/* Loading Dots */}
        <View style={styles.dotsContainer}>
          <Animated.View style={[styles.loadingDot, { opacity: waveAnim }]} />
          <Animated.View style={[styles.loadingDot, { opacity: waveAnim }]} />
          <Animated.View style={[styles.loadingDot, { opacity: waveAnim }]} />
        </View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A1128',
    justifyContent: 'center',
    alignItems: 'center',
  },
  skipButtonContainer: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
  },
  skipButton: {
    backgroundColor: 'rgba(0, 217, 255, 0.2)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#00D9FF',
  },
  skipButtonText: {
    color: '#00D9FF',
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    alignItems: 'center',
    width: '100%',
  },
  appName: {
    fontSize: 42,
    fontWeight: 'bold',
    color: '#00D9FF',
    marginBottom: 5,
    letterSpacing: 2,
  },
  tagline: {
    fontSize: 14,
    color: '#88C0D0',
    marginBottom: 50,
    fontWeight: '300',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 60,
  },
  watchContainer: {
    marginRight: 40,
  },
  watch: {
    width: 80,
    height: 100,
    backgroundColor: '#1E3A5F',
    borderRadius: 20,
    borderWidth: 3,
    borderColor: '#00D9FF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#00D9FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 10,
  },
  watchScreen: {
    width: 60,
    height: 60,
    backgroundColor: '#0F2847',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heartIcon: {
    fontSize: 30,
  },
  watchBand: {
    position: 'absolute',
    left: -10,
    width: 10,
    height: 40,
    backgroundColor: '#1E3A5F',
    borderTopLeftRadius: 5,
    borderBottomLeftRadius: 5,
  },
  watchBandRight: {
    position: 'absolute',
    right: -10,
    width: 10,
    height: 40,
    backgroundColor: '#1E3A5F',
    borderTopRightRadius: 5,
    borderBottomRightRadius: 5,
  },
  connectionLine: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 60,
    justifyContent: 'space-around',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#00D9FF',
    shadowColor: '#00D9FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 5,
    elevation: 5,
  },
  medicalContainer: {
    alignItems: 'center',
    marginLeft: 40,
  },
  medicalCross: {
    width: 100,
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  crossVertical: {
    width: 30,
    height: 100,
    backgroundColor: '#FF6B6B',
    borderRadius: 15,
    shadowColor: '#FF6B6B',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 10,
  },
  crossHorizontal: {
    position: 'absolute',
    width: 100,
    height: 30,
    backgroundColor: '#FF6B6B',
    borderRadius: 15,
    shadowColor: '#FF6B6B',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 10,
  },
  centerCircle: {
    position: 'absolute',
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 10,
  },
  plusSign: {
    fontSize: 32,
    color: '#FF6B6B',
    fontWeight: 'bold',
  },
  vitalsContainer: {
    flexDirection: 'row',
    marginTop: 30,
    gap: 20,
  },
  vitalItem: {
    alignItems: 'center',
    backgroundColor: '#1E3A5F',
    padding: 10,
    borderRadius: 10,
    minWidth: 60,
    borderWidth: 1,
    borderColor: '#00D9FF',
  },
  vitalIcon: {
    fontSize: 20,
    marginBottom: 5,
  },
  vitalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#00D9FF',
  },
  vitalLabel: {
    fontSize: 10,
    color: '#88C0D0',
    marginTop: 2,
  },
  loadingText: {
    fontSize: 16,
    color: '#88C0D0',
    marginTop: 20,
    fontWeight: '300',
  },
  dotsContainer: {
    flexDirection: 'row',
    marginTop: 10,
    gap: 8,
  },
  loadingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#00D9FF',
  },
});

export default LOGO;