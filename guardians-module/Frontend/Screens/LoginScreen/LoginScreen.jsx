import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform, Alert, ScrollView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import API_BASE_URL from '../../context/api';
import { useApp } from '../../context/AppContext';

export default function LoginScreen({ navigation }) {
  const { refreshData } = useApp();

  const [screen, setScreen] = useState('login');

  // Login fields
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');

  // Register fields
  const [regName,     setRegName]     = useState('');
  const [regEmail,    setRegEmail]    = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regPhone,    setRegPhone]    = useState('');
  const [regRelation, setRegRelation] = useState('');

  // OTP
  const [otp,      setOtp]      = useState('');
  const [otpEmail, setOtpEmail] = useState('');

  const [loading, setLoading] = useState(false);

  // Password visibility
  const [showPassword,    setShowPassword]    = useState(false);
  const [showRegPassword, setShowRegPassword] = useState(false);

  // ── Login ────────────────────────────────────────────────────────────────
  const handleLogin = async () => {
    if (!email || !password) return Alert.alert('Error', 'Please enter email and password');
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/guardian/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();

      if (data.success) {
        await AsyncStorage.setItem('guardianToken', data.token);
        navigation.replace('Main');
        refreshData();
      } else {
        Alert.alert('Login Failed', data.message);
      }
    } catch (err) {
      Alert.alert('Error', 'Could not connect to server');
    } finally {
      setLoading(false);
    }
  };

  // ── Register ─────────────────────────────────────────────────────────────
  const handleRegister = async () => {
    if (!regName || !regEmail || !regPassword || !regPhone) {
      return Alert.alert('Error', 'Please fill all fields');
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/guardian/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name:     regName,
          email:    regEmail,
          password: regPassword,
          phone:    regPhone,
          relation: regRelation,
        }),
      });
      const data = await res.json();

      if (data.success) {
        setOtpEmail(regEmail);
        setScreen('otp');
        Alert.alert('OTP Sent!', `A verification code has been sent to:\n${regEmail}`);
      } else {
        Alert.alert('Error', data.message);
      }
    } catch (err) {
      Alert.alert('Error', 'Could not connect to server');
    } finally {
      setLoading(false);
    }
  };

  // ── OTP Verify ───────────────────────────────────────────────────────────
  const handleVerifyOTP = async () => {
    if (!otp || otp.length < 6) return Alert.alert('Error', 'Please enter the 6-digit OTP');
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/guardian/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: otpEmail, otp }),
      });
      const data = await res.json();

      if (data.success) {
        await AsyncStorage.setItem('guardianToken', data.token);
        navigation.replace('Main');
        refreshData();
      } else {
        Alert.alert('Verification Failed', data.message);
      }
    } catch (err) {
      Alert.alert('Error', 'Could not connect to server');
    } finally {
      setLoading(false);
    }
  };

  // ── Login Screen UI ──────────────────────────────────────────────────────
  if (screen === 'login') {
    return (
      <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={styles.inner}>

          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Text style={styles.backArrow}>←</Text>
          </TouchableOpacity>

          <View style={styles.logoContainer}>
            <View style={styles.logoBox}>
              <Text style={styles.logoIcon}>📍</Text>
            </View>
            <Text style={styles.appName}>MediTrack</Text>
            <Text style={styles.subtitle}>Guardian Health Monitor</Text>
          </View>

          <View style={styles.formContainer}>
            <Text style={styles.label}>Email Address</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your email"
              placeholderTextColor="#aaa"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />

            <Text style={styles.label}>Password</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.passwordInput}
                placeholder="Enter your password"
                placeholderTextColor="#aaa"
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                value={password}
                onChangeText={setPassword}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <Ionicons
                  name={showPassword ? 'eye' : 'eye-off'}
                  size={22}
                  color="#aaa"
                />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.signInButton, loading && styles.buttonDisabled]}
              onPress={handleLogin}
              disabled={loading}
            >
              <Text style={styles.signInText}>{loading ? 'Signing in...' : 'Sign In'}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.switchContainer} onPress={() => setScreen('register')}>
              <Text style={styles.switchText}>
                New here? <Text style={styles.switchLink}>Create an account</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  // ── Register Screen UI ───────────────────────────────────────────────────
  if (screen === 'register') {
    return (
      <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={styles.inner}>

          <TouchableOpacity style={styles.backButton} onPress={() => setScreen('login')}>
            <Text style={styles.backArrow}>←</Text>
          </TouchableOpacity>

          <View style={styles.logoContainer}>
            <Text style={styles.appName}>Create Account</Text>
            <Text style={styles.subtitle}>Enter the phone number added by the patient</Text>
          </View>

          <View style={styles.formContainer}>

            <Text style={styles.label}>Full Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Your full name"
              placeholderTextColor="#aaa"
              autoCapitalize="words"
              value={regName}
              onChangeText={setRegName}
            />

            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              placeholder="Email address"
              placeholderTextColor="#aaa"
              keyboardType="email-address"
              autoCapitalize="none"
              value={regEmail}
              onChangeText={setRegEmail}
            />

            <Text style={styles.label}>Password</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.passwordInput}
                placeholder="Create a password"
                placeholderTextColor="#aaa"
                autoCapitalize="none"
                secureTextEntry={!showRegPassword}
                value={regPassword}
                onChangeText={setRegPassword}
              />
              <TouchableOpacity onPress={() => setShowRegPassword(!showRegPassword)}>
                <Ionicons
                  name={showRegPassword ? 'eye' : 'eye-off'}
                  size={22}
                  color="#aaa"
                />
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>Phone Number (added by patient)</Text>
            <TextInput
              style={styles.input}
              placeholder="+92-300-xxxxxxx"
              placeholderTextColor="#aaa"
              keyboardType="phone-pad"
              value={regPhone}
              onChangeText={setRegPhone}
            />

            <Text style={styles.label}>Relation (optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Son, Wife, Brother"
              placeholderTextColor="#aaa"
              value={regRelation}
              onChangeText={setRegRelation}
            />

            <TouchableOpacity
              style={[styles.signInButton, loading && styles.buttonDisabled]}
              onPress={handleRegister}
              disabled={loading}
            >
              <Text style={styles.signInText}>{loading ? 'Sending OTP...' : 'Send OTP'}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.switchContainer} onPress={() => setScreen('login')}>
              <Text style={styles.switchText}>
                Already have an account? <Text style={styles.switchLink}>Sign In</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  // ── OTP Screen UI ────────────────────────────────────────────────────────
  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={styles.inner}>

        <TouchableOpacity style={styles.backButton} onPress={() => setScreen('register')}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>

        <View style={styles.logoContainer}>
          <Text style={styles.logoIcon}>🔐</Text>
          <Text style={styles.appName}>Verify OTP</Text>
          <Text style={styles.subtitle}>A 6-digit code was sent to{'\n'}{otpEmail}</Text>
        </View>

        <View style={styles.formContainer}>
          <Text style={styles.label}>Enter OTP</Text>
          <TextInput
            style={[styles.input, styles.otpInput]}
            placeholder="- - - - - -"
            placeholderTextColor="#aaa"
            keyboardType="number-pad"
            maxLength={6}
            value={otp}
            onChangeText={setOtp}
          />

          <TouchableOpacity
            style={[styles.signInButton, loading && styles.buttonDisabled]}
            onPress={handleVerifyOTP}
            disabled={loading}
          >
            <Text style={styles.signInText}>{loading ? 'Verifying...' : 'Verify OTP'}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.switchContainer} onPress={() => setScreen('register')}>
            <Text style={styles.switchText}>
              <Text style={styles.switchLink}>← Go Back</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container:         { flex: 1, backgroundColor: '#f2f2f6' },
  inner:             { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24, paddingVertical: 40 },
  backButton:        { position: 'absolute', top: 10, left: 0, padding: 10, zIndex: 10 },
  backArrow:         { fontSize: 26, color: '#2979ff', fontWeight: '600' },
  logoContainer:     { alignItems: 'center', marginBottom: 40 },
  logoBox:           { width: 72, height: 72, backgroundColor: '#ddeeff', borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  logoIcon:          { fontSize: 30 },
  appName:           { fontSize: 26, fontWeight: '700', color: '#111', marginBottom: 4 },
  subtitle:          { fontSize: 14, color: '#888', textAlign: 'center' },
  formContainer:     { width: '100%' },
  label:             { fontSize: 13, color: '#555', marginBottom: 6, marginLeft: 2 },
  input:             { backgroundColor: '#fff', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, color: '#222', marginBottom: 18, borderWidth: 0.5, borderColor: '#ddd' },
  otpInput:          { fontSize: 28, textAlign: 'center', letterSpacing: 12, fontWeight: '700' },
  passwordContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, marginBottom: 18, borderWidth: 0.5, borderColor: '#ddd' },
  passwordInput:     { flex: 1, fontSize: 15, color: '#222' },
  signInButton:      { backgroundColor: '#2979ff', borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 4 },
  buttonDisabled:    { backgroundColor: '#88aaee' },
  signInText:        { color: '#fff', fontSize: 16, fontWeight: '600' },
  switchContainer:   { alignItems: 'center', marginTop: 18 },
  switchText:        { color: '#888', fontSize: 14 },
  switchLink:        { color: '#2979ff', fontWeight: '600' },
});