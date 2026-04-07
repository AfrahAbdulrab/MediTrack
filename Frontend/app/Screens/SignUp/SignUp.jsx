import { View, Text, TextInput, StyleSheet, TouchableOpacity, Alert, Animated, Dimensions, ActivityIndicator, ScrollView } from 'react-native';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { API_BASE_URL } from '../../constants/constants';
const { width, height } = Dimensions.get('window');

const API_URL = `${API_BASE_URL}/api/auth`;
const BASE_URL = API_BASE_URL;

export default function SignUp() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0)).current;
  const logoRotate = useRef(new Animated.Value(0)).current;
  const cardSlide = useRef(new Animated.Value(height)).current;
  const titleSlide = useRef(new Animated.Value(-50)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const input1Slide = useRef(new Animated.Value(100)).current;
  const input2Slide = useRef(new Animated.Value(100)).current;
  const input3Slide = useRef(new Animated.Value(100)).current;
  const input4Slide = useRef(new Animated.Value(100)).current;
  const buttonSlide = useRef(new Animated.Value(100)).current;
  const signInSlide = useRef(new Animated.Value(50)).current;
  const float1 = useRef(new Animated.Value(0)).current;
  const float2 = useRef(new Animated.Value(0)).current;
  const float3 = useRef(new Animated.Value(0)).current;
  const colorPulse = useRef(new Animated.Value(0)).current;
  const buttonScale = useRef(new Animated.Value(1)).current;

  // Test server connection on mount
  useEffect(() => {
    testServerConnection();
  }, []);

  const testServerConnection = async () => {
    try {
      console.log('🔍 Testing server connection...');
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(BASE_URL, {
        method: 'GET',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const data = await response.json();
      console.log('✅ Server is reachable:', data.message);
    } catch (error) {
      console.error('❌ Server connection test failed:', error.message);
      Alert.alert(
        'Server Unreachable',
        `Cannot connect to backend at ${BASE_URL}\n\nPlease verify:\n\n1. Backend server is running (npm start)\n2. Phone and laptop on same WiFi\n3. Windows Firewall allows port 5000\n4. IP address is correct: 192.168.100.21`,
        [{ text: 'OK' }]
      );
    }
  };

  useEffect(() => {
    // Master animation sequence
    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.parallel([
        Animated.spring(logoScale, {
          toValue: 1,
          tension: 50,
          friction: 5,
          useNativeDriver: true,
        }),
        Animated.spring(logoRotate, {
          toValue: 1,
          tension: 40,
          friction: 8,
          useNativeDriver: true,
        }),
      ]),
      Animated.spring(cardSlide, {
        toValue: 0,
        tension: 40,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();

    setTimeout(() => {
      Animated.stagger(100, [
        Animated.parallel([
          Animated.spring(titleSlide, {
            toValue: 0,
            tension: 50,
            friction: 7,
            useNativeDriver: true,
          }),
          Animated.timing(titleOpacity, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
        ]),
        Animated.spring(input1Slide, {
          toValue: 0,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.spring(input2Slide, {
          toValue: 0,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.spring(input3Slide, {
          toValue: 0,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.spring(input4Slide, {
          toValue: 0,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.spring(buttonSlide, {
          toValue: 0,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.spring(signInSlide, {
          toValue: 0,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
      ]).start();
    }, 600);

    // Continuous floating animations
    Animated.loop(
      Animated.sequence([
        Animated.timing(float1, { toValue: 1, duration: 3000, useNativeDriver: true }),
        Animated.timing(float1, { toValue: 0, duration: 3000, useNativeDriver: true }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(float2, { toValue: 1, duration: 4000, useNativeDriver: true }),
        Animated.timing(float2, { toValue: 0, duration: 4000, useNativeDriver: true }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(float3, { toValue: 1, duration: 5000, useNativeDriver: true }),
        Animated.timing(float3, { toValue: 0, duration: 5000, useNativeDriver: true }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(colorPulse, { toValue: 1, duration: 2000, useNativeDriver: true }),
        Animated.timing(colorPulse, { toValue: 0, duration: 2000, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const handleSignUp = async () => {
    Animated.sequence([
      Animated.spring(buttonScale, { toValue: 0.9, tension: 200, friction: 3, useNativeDriver: true }),
      Animated.spring(buttonScale, { toValue: 1, tension: 200, friction: 3, useNativeDriver: true }),
    ]).start();

    // Validation
    if (!name || !email || !password || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (name.trim().length < 2) {
      Alert.alert('Error', 'Name must be at least 2 characters long');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters long');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    setLoading(true);

    // Create abort controller with 30 second timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    try {
      console.log('🔄 Attempting signup at:', `${API_URL}/signup`);
      console.log('📦 Request data:', { name: name.trim(), email: email.toLowerCase().trim() });

      const response = await fetch(`${API_URL}/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: name.trim(),
          email: email.toLowerCase().trim(),
          password: password,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      console.log('✅ Response status:', response.status);
      const data = await response.json();
      console.log('📦 Response data:', data);

      if (response.ok) {
        Alert.alert(
          'Success', 
          'Account created successfully! Please sign in.',
          [
            {
              text: 'OK',
              onPress: () => {
                Animated.parallel([
                  Animated.timing(cardSlide, { toValue: height, duration: 400, useNativeDriver: true }),
                  Animated.timing(fadeAnim, { toValue: 0, duration: 400, useNativeDriver: true }),
                ]).start(() => {
                  router.push('/Screens/SignIn/SignIn');
                });
              }
            }
          ]
        );
      } else {
        Alert.alert('Registration Failed', data.message || 'Unable to create account');
      }
    } catch (error) {
      clearTimeout(timeoutId);
      
      console.error('❌ SignUp error:', error);
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);

      if (error.name === 'AbortError') {
        Alert.alert(
          'Connection Timeout',
          `Request timed out after 30 seconds.\n\nServer: ${BASE_URL}\n\nTroubleshooting:\n\n✓ Backend running? (npm start)\n✓ Same WiFi network?\n✓ Firewall blocking port 5000?\n✓ Try: http://192.168.100.21:5000 in browser`
        );
      } else if (error.message.includes('Network request failed')) {
        Alert.alert(
          'Network Error',
          'Cannot connect to server.\n\nCheck:\n1. Backend is running\n2. Same WiFi network\n3. Correct IP: 192.168.100.21'
        );
      } else {
        Alert.alert('Error', `Connection failed: ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const float1Y = float1.interpolate({ inputRange: [0, 1], outputRange: [0, -20] });
  const float2Y = float2.interpolate({ inputRange: [0, 1], outputRange: [0, -30] });
  const float3Y = float3.interpolate({ inputRange: [0, 1], outputRange: [0, -25] });
  const logoRotation = logoRotate.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const logoOpacity = colorPulse.interpolate({ inputRange: [0, 0.5, 1], outputRange: [1, 0.8, 1] });

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <View style={styles.backgroundOverlay} />

      <Animated.View style={[styles.particle1, { transform: [{ translateY: float1Y }] }]} />
      <Animated.View style={[styles.particle2, { transform: [{ translateY: float2Y }] }]} />
      <Animated.View style={[styles.particle3, { transform: [{ translateY: float3Y }] }]} />

      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={28} color="#fff" />
        </TouchableOpacity>

        <Animated.View
          style={[
            styles.logoContainer,
            {
              transform: [{ scale: logoScale }, { rotate: logoRotation }],
              opacity: logoOpacity,
            }
          ]}
        >
          <Ionicons name="person-add" size={50} color="#fff" />
        </Animated.View>
      </View>

      <Animated.View style={[styles.card, { transform: [{ translateY: cardSlide }] }]}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          <Animated.View style={{ transform: [{ translateY: titleSlide }], opacity: titleOpacity }}>
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Sign up to get started</Text>
          </Animated.View>

          <Animated.View 
            style={[
              styles.inputContainer,
              {
                transform: [{ translateX: input1Slide }],
                opacity: input1Slide.interpolate({ inputRange: [0, 100], outputRange: [1, 0] })
              }
            ]}
          >
            <View style={styles.iconWrapper}>
              <Ionicons name="person-outline" size={20} color="#667eea" />
            </View>
            <TextInput
              style={styles.input}
              placeholder="Full Name"
              placeholderTextColor="#999"
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
              editable={!loading}
            />
          </Animated.View>

          <Animated.View 
            style={[
              styles.inputContainer,
              {
                transform: [{ translateX: input2Slide }],
                opacity: input2Slide.interpolate({ inputRange: [0, 100], outputRange: [1, 0] })
              }
            ]}
          >
            <View style={styles.iconWrapper}>
              <Ionicons name="mail-outline" size={20} color="#667eea" />
            </View>
            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor="#999"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              editable={!loading}
            />
          </Animated.View>

          <Animated.View 
            style={[
              styles.inputContainer,
              {
                transform: [{ translateX: input3Slide }],
                opacity: input3Slide.interpolate({ inputRange: [0, 100], outputRange: [1, 0] })
              }
            ]}
          >
            <View style={styles.iconWrapper}>
              <Ionicons name="lock-closed-outline" size={20} color="#667eea" />
            </View>
            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor="#999"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              editable={!loading}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon} disabled={loading}>
              <Ionicons name={showPassword ? "eye-outline" : "eye-off-outline"} size={20} color="#667eea" />
            </TouchableOpacity>
          </Animated.View>

          <Animated.View 
            style={[
              styles.inputContainer,
              {
                transform: [{ translateX: input4Slide }],
                opacity: input4Slide.interpolate({ inputRange: [0, 100], outputRange: [1, 0] })
              }
            ]}
          >
            <View style={styles.iconWrapper}>
              <Ionicons name="lock-closed-outline" size={20} color="#667eea" />
            </View>
            <TextInput
              style={styles.input}
              placeholder="Confirm Password"
              placeholderTextColor="#999"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showConfirmPassword}
              editable={!loading}
            />
            <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)} style={styles.eyeIcon} disabled={loading}>
              <Ionicons name={showConfirmPassword ? "eye-outline" : "eye-off-outline"} size={20} color="#667eea" />
            </TouchableOpacity>
          </Animated.View>

          <Animated.View style={{ transform: [{ translateY: buttonSlide }, { scale: buttonScale }] }}>
            <TouchableOpacity 
              style={[styles.signUpButton, loading && styles.signUpButtonDisabled]} 
              onPress={handleSignUp}
              activeOpacity={0.9}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.signUpButtonText}>Sign Up</Text>
              )}
            </TouchableOpacity>
          </Animated.View>

          <Animated.View 
            style={[
              styles.signInContainer,
              {
                transform: [{ translateY: signInSlide }],
                opacity: signInSlide.interpolate({ inputRange: [0, 50], outputRange: [1, 0] })
              }
            ]}
          >
            <Text style={styles.signInText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => router.push('/Screens/SignIn/SignIn')} activeOpacity={0.7} disabled={loading}>
              <Text style={styles.signInLink}>Sign In</Text>
            </TouchableOpacity>
          </Animated.View>
        </ScrollView>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#667eea' },
  backgroundOverlay: { position: 'absolute', width: '100%', height: '100%', backgroundColor: '#764ba2', opacity: 0.3 },
  particle1: { position: 'absolute', width: 100, height: 100, borderRadius: 50, backgroundColor: 'rgba(255, 255, 255, 0.15)', top: 100, left: 50 },
  particle2: { position: 'absolute', width: 150, height: 150, borderRadius: 75, backgroundColor: 'rgba(255, 255, 255, 0.1)', top: 50, right: 30 },
  particle3: { position: 'absolute', width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(255, 255, 255, 0.12)', top: 200, right: 100 },
  header: { height: 220, paddingTop: 50, paddingHorizontal: 20, justifyContent: 'space-between' },
  backButton: { width: 40, height: 40, justifyContent: 'center' },
  logoContainer: { alignSelf: 'center', width: 100, height: 100, borderRadius: 50, backgroundColor: 'rgba(255, 255, 255, 0.25)', justifyContent: 'center', alignItems: 'center', marginTop: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 20, elevation: 10 },
  card: { flex: 1, backgroundColor: '#fff', borderTopLeftRadius: 40, borderTopRightRadius: 40, shadowColor: '#000', shadowOffset: { width: 0, height: -5 }, shadowOpacity: 0.1, shadowRadius: 10, elevation: 10 },
  scrollContent: { paddingHorizontal: 30, paddingTop: 40, paddingBottom: 30 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#333', textAlign: 'center', marginBottom: 3 },
  subtitle: { fontSize: 14, color: '#999', textAlign: 'center', marginBottom: 20 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', borderWidth: 2, borderColor: '#e8e8e8', borderRadius: 16, paddingHorizontal: 15, marginBottom: 12, backgroundColor: '#fafafa' },
  iconWrapper: { width: 35, height: 35, borderRadius: 10, backgroundColor: '#f0f0ff', justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  input: { flex: 1, paddingVertical: 15, fontSize: 15, color: '#333' },
  eyeIcon: { padding: 8 },
  signUpButton: { backgroundColor: '#667eea', paddingVertical: 14, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginTop: 8, marginBottom: 16, shadowColor: '#667eea', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 6 },
  signUpButtonDisabled: { opacity: 0.7 },
  signUpButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  signInContainer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 12 },
  signInText: { color: '#666', fontSize: 15 },
  signInLink: { color: '#667eea', fontSize: 15, fontWeight: 'bold' },
});