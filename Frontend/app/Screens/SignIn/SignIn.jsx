import { View, Text, TextInput, StyleSheet, TouchableOpacity, Alert, Animated, Dimensions, ActivityIndicator } from 'react-native';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get('window');
const API_URL = 'http://192.168.1.5:5000/api/auth';

export default function SignIn() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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
  const buttonSlide = useRef(new Animated.Value(100)).current;
  const dividerScale = useRef(new Animated.Value(0)).current;
  const socialSlide = useRef(new Animated.Value(100)).current;
  const signUpSlide = useRef(new Animated.Value(50)).current;
  
  // Floating animations
  const float1 = useRef(new Animated.Value(0)).current;
  const float2 = useRef(new Animated.Value(0)).current;
  const float3 = useRef(new Animated.Value(0)).current;
  
  // Color pulse animation
  const colorPulse = useRef(new Animated.Value(0)).current;
  
  // Button animations
  const buttonScale = useRef(new Animated.Value(1)).current;
  const googleScale = useRef(new Animated.Value(1)).current;
  const facebookScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Master animation sequence
    Animated.sequence([
      // Step 1: Fade in screen
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      // Step 2: Logo entrance with rotation
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
      // Step 3: Card slides up
      Animated.spring(cardSlide, {
        toValue: 0,
        tension: 40,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();

    // Stagger other elements
    setTimeout(() => {
      Animated.stagger(100, [
        // Title
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
        // Input 1
        Animated.spring(input1Slide, {
          toValue: 0,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
        // Input 2
        Animated.spring(input2Slide, {
          toValue: 0,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
        // Button
        Animated.spring(buttonSlide, {
          toValue: 0,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
        // Divider
        Animated.spring(dividerScale, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
        // Social buttons
        Animated.spring(socialSlide, {
          toValue: 0,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
        // Sign up
        Animated.spring(signUpSlide, {
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
        Animated.timing(float1, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: true,
        }),
        Animated.timing(float1, {
          toValue: 0,
          duration: 3000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(float2, {
          toValue: 1,
          duration: 4000,
          useNativeDriver: true,
        }),
        Animated.timing(float2, {
          toValue: 0,
          duration: 4000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(float3, {
          toValue: 1,
          duration: 5000,
          useNativeDriver: true,
        }),
        Animated.timing(float3, {
          toValue: 0,
          duration: 5000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Color pulse animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(colorPulse, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(colorPulse, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const handleLogin = async () => {
    Animated.sequence([
      Animated.spring(buttonScale, {
        toValue: 0.9,
        tension: 200,
        friction: 3,
        useNativeDriver: true,
      }),
      Animated.spring(buttonScale, {
        toValue: 1,
        tension: 200,
        friction: 3,
        useNativeDriver: true,
      }),
    ]).start();

    // Validation
    if (!email || !password) {
      Alert.alert('Error', 'Please enter email and password');
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/signin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.toLowerCase().trim(),
          password: password,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Save token and user data
        await AsyncStorage.setItem('userToken', data.token);
        await AsyncStorage.setItem('userEmail', email.toLowerCase().trim());
        
        // Success animation and navigation
        Animated.parallel([
          Animated.timing(cardSlide, {
            toValue: height,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 400,
            useNativeDriver: true,
          }),
        ]).start(() => {
          router.push({
            pathname: '/Screens/HomeScreen/HomeScreen',
            params: { 
              email: email.toLowerCase().trim(),
              username: email.split('@')[0]
            }
          });
        });
      } else {
        Alert.alert('Login Failed', data.message || 'Invalid credentials');
      }
    } catch (error) {
      console.error('Login error:', error);
      Alert.alert('Error', 'Unable to connect to server. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const animateSocialButton = (scale) => {
    Animated.sequence([
      Animated.spring(scale, {
        toValue: 0.95,
        tension: 200,
        friction: 3,
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1,
        tension: 200,
        friction: 3,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const float1Y = float1.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -20],
  });

  const float2Y = float2.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -30],
  });

  const float3Y = float3.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -25],
  });

  const logoRotation = logoRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const logoOpacity = colorPulse.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [1, 0.8, 1],
  });

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      {/* Background with overlay */}
      <View style={styles.backgroundOverlay} />

      {/* Floating particles */}
      <Animated.View 
        style={[
          styles.particle1,
          { transform: [{ translateY: float1Y }] }
        ]}
      />
      <Animated.View 
        style={[
          styles.particle2,
          { transform: [{ translateY: float2Y }] }
        ]}
      />
      <Animated.View 
        style={[
          styles.particle3,
          { transform: [{ translateY: float3Y }] }
        ]}
      />

      {/* Header with logo */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={28} color="#fff" />
        </TouchableOpacity>

        {/* Animated Logo */}
        <Animated.View
          style={[
            styles.logoContainer,
            {
              transform: [
                { scale: logoScale },
                { rotate: logoRotation }
              ],
              opacity: logoOpacity,
            }
          ]}
        >
          <Ionicons name="shield-checkmark" size={50} color="#fff" />
        </Animated.View>
      </View>

      {/* Card with glass morphism */}
      <Animated.View 
        style={[
          styles.card,
          {
            transform: [{ translateY: cardSlide }],
          }
        ]}
      >
        {/* Title */}
        <Animated.View
          style={{
            transform: [{ translateY: titleSlide }],
            opacity: titleOpacity,
          }}
        >
          <Text style={styles.title}>Welcome Back!</Text>
          <Text style={styles.subtitle}>Sign in to continue your journey</Text>
        </Animated.View>

        {/* Email Input */}
        <Animated.View 
          style={[
            styles.inputContainer,
            {
              transform: [{ translateX: input1Slide }],
              opacity: input1Slide.interpolate({
                inputRange: [0, 100],
                outputRange: [1, 0],
              })
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

        {/* Password Input */}
        <Animated.View 
          style={[
            styles.inputContainer,
            {
              transform: [{ translateX: input2Slide }],
              opacity: input2Slide.interpolate({
                inputRange: [0, 100],
                outputRange: [1, 0],
              })
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
          <TouchableOpacity 
            onPress={() => setShowPassword(!showPassword)}
            style={styles.eyeIcon}
            disabled={loading}
          >
            <Ionicons 
              name={showPassword ? "eye-outline" : "eye-off-outline"} 
              size={20} 
              color="#667eea" 
            />
          </TouchableOpacity>
        </Animated.View>

        {/* Forgot Password */}
        <TouchableOpacity 
          onPress={() => router.push('/Screens/ForgetPassword/ForgetPassword')}
          activeOpacity={0.7}
          disabled={loading}
        >
          <Text style={styles.forgotText}>Forgot password?</Text>
        </TouchableOpacity>

        {/* Sign In Button */}
        <Animated.View 
          style={[
            {
              transform: [
                { translateY: buttonSlide },
                { scale: buttonScale }
              ],
            }
          ]}
        >
          <TouchableOpacity 
            style={[styles.signInButton, loading && styles.signInButtonDisabled]} 
            onPress={handleLogin}
            activeOpacity={0.9}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.signInButtonText}>Sign In</Text>
            )}
          </TouchableOpacity>
        </Animated.View>

        {/* Divider */}
        <Animated.View 
          style={[
            styles.dividerContainer,
            {
              transform: [{ scaleX: dividerScale }],
            }
          ]}
        >
          <View style={styles.divider} />
          <Text style={styles.orText}>OR</Text>
          <View style={styles.divider} />
        </Animated.View>

        {/* Social Buttons - Side by Side */}
        <Animated.View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            transform: [{ translateY: socialSlide }],
            opacity: socialSlide.interpolate({
              inputRange: [0, 100],
              outputRange: [1, 0],
            })
          }}
        >
          {/* Google Button */}
          <Animated.View style={{ flex: 1, marginRight: 8, transform: [{ scale: googleScale }] }}>
            <TouchableOpacity 
              style={styles.socialButton}
              onPress={() => {
                animateSocialButton(googleScale);
                Alert.alert('Coming Soon', 'Google Sign In will be available soon!');
              }}
              activeOpacity={0.8}
              disabled={loading}
            >
              <Ionicons name="logo-google" size={24} color="#DB4437" />
            </TouchableOpacity>
          </Animated.View>

          {/* Facebook Button */}
          <Animated.View style={{ flex: 1, marginLeft: 8, transform: [{ scale: facebookScale }] }}>
            <TouchableOpacity 
              style={styles.socialButton}
              onPress={() => {
                animateSocialButton(facebookScale);
                Alert.alert('Coming Soon', 'Facebook Sign In will be available soon!');
              }}
              activeOpacity={0.8}
              disabled={loading}
            >
              <Ionicons name="logo-facebook" size={24} color="#4267B2" />
            </TouchableOpacity>
          </Animated.View>
        </Animated.View>

        {/* Sign Up Link */}
        <Animated.View 
          style={[
            styles.signUpContainer,
            {
              transform: [{ translateY: signUpSlide }],
              opacity: signUpSlide.interpolate({
                inputRange: [0, 50],
                outputRange: [1, 0],
              })
            }
          ]}
        >
          <Text style={styles.signUpText}>Don't have an account? </Text>
          <TouchableOpacity 
            onPress={() => router.push('/Screens/SignUp/SignUp')}
            activeOpacity={0.7}
            disabled={loading}
          >
            <Text style={styles.signUpLink}>Sign Up</Text>
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#667eea',
  },
  backgroundOverlay: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    backgroundColor: '#764ba2',
    opacity: 0.3,
  },
  particle1: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    top: 100,
    left: 50,
  },
  particle2: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    top: 50,
    right: 30,
  },
  particle3: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    top: 200,
    right: 100,
  },
  header: {
    height: 250,
    paddingTop: 50,
    paddingHorizontal: 20,
    justifyContent: 'space-between',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  logoContainer: {
    alignSelf: 'center',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  card: {
    flex: 1,
    backgroundColor: '#fff',
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    paddingHorizontal: 30,
    paddingTop: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -5 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 3,
  },
  subtitle: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginBottom: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e8e8e8',
    borderRadius: 16,
    paddingHorizontal: 15,
    marginBottom: 12,
    backgroundColor: '#fafafa',
  },
  iconWrapper: {
    width: 35,
    height: 35,
    borderRadius: 10,
    backgroundColor: '#f0f0ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  input: {
    flex: 1,
    paddingVertical: 15,
    fontSize: 15,
    color: '#333',
  },
  eyeIcon: {
    padding: 8,
  },
  forgotText: {
    color: '#667eea',
    fontSize: 13,
    textAlign: 'right',
    marginBottom: 18,
    fontWeight: '600',
  },
  signInButton: {
    backgroundColor: '#667eea',
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  signInButtonDisabled: {
    opacity: 0.7,
  },
  signInButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: '#e0e0e0',
  },
  orText: {
    marginHorizontal: 15,
    color: '#999',
    fontSize: 13,
    fontWeight: '600',
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#e8e8e8',
    borderRadius: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
  },
  signUpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 20,
  },
  signUpText: {
    color: '#666',
    fontSize: 15,
  },
  signUpLink: {
    color: '#667eea',
    fontSize: 15,
    fontWeight: 'bold',
  },
});