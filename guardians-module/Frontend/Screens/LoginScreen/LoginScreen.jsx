import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform, Alert, ScrollView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import API_BASE_URL from '../../context/api';

// 3 steps: 'login' | 'register' | 'otp'
export default function LoginScreen({ navigation }) {
  const [screen, setScreen] = useState('login'); // login | register | otp

  // Login fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Register fields
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regRelation, setRegRelation] = useState('');

  // OTP
  const [otp, setOtp] = useState('');
  const [otpPhone, setOtpPhone] = useState('');

  const [loading, setLoading] = useState(false);

  // ── Login ────────────────────────────────────────────────────────────────
  const handleLogin = async () => {
    if (!email || !password) return Alert.alert('Error', 'Email aur password enter karo');
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
      } else {
        Alert.alert('Login Failed', data.message);
      }
    } catch (err) {
      Alert.alert('Error', 'Server se connect nahi ho saka');
    } finally {
      setLoading(false);
    }
  };

  // ── Register → OTP bhejo ─────────────────────────────────────────────────
  const handleRegister = async () => {
    if (!regName || !regEmail || !regPassword || !regPhone) {
      return Alert.alert('Error', 'Sab fields fill karo');
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/guardian/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: regName, email: regEmail,
          password: regPassword, phone: regPhone,
          relation: regRelation,
        }),
      });
      const data = await res.json();

      if (data.success) {
        setOtpPhone(regPhone);
        setScreen('otp');
        Alert.alert('OTP Bheja!', `${regPhone} par OTP bhej diya gaya`);
      } else {
        Alert.alert('Error', data.message);
      }
    } catch (err) {
      Alert.alert('Error', 'Server se connect nahi ho saka');
    } finally {
      setLoading(false);
    }
  };

  // ── OTP Verify ───────────────────────────────────────────────────────────
  const handleVerifyOTP = async () => {
    if (!otp || otp.length < 4) return Alert.alert('Error', '4-digit OTP enter karo');
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/guardian/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: otpPhone, otp }),
      });
      const data = await res.json();

      if (data.success) {
        await AsyncStorage.setItem('guardianToken', data.token);
        Alert.alert('✅ Verified!', `Welcome ${data.guardian.name}! Patient linked: ${data.patient?.name}`);
        navigation.replace('Main');
      } else {
        Alert.alert('Error', data.message);
      }
    } catch (err) {
      Alert.alert('Error', 'Server se connect nahi ho saka');
    } finally {
      setLoading(false);
    }
  };

  // ── Login Screen UI ──────────────────────────────────────────────────────
  if (screen === 'login') {
    return (
      <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={styles.inner}>
          <View style={styles.logoContainer}>
            <View style={styles.logoBox}>
              <Text style={styles.logoIcon}>📍</Text>
            </View>
            <Text style={styles.appName}>MediTrack</Text>
            <Text style={styles.subtitle}>Guardian Health Monitor</Text>
          </View>

          <View style={styles.formContainer}>
            <Text style={styles.label}>Email address</Text>
            <TextInput style={styles.input} placeholder="Enter your email"
              placeholderTextColor="#aaa" keyboardType="email-address"
              autoCapitalize="none" value={email} onChangeText={setEmail} />

            <Text style={styles.label}>Password</Text>
            <TextInput style={styles.input} placeholder="Enter your password"
              placeholderTextColor="#aaa" secureTextEntry
              value={password} onChangeText={setPassword} />

            <TouchableOpacity style={[styles.signInButton, loading && styles.buttonDisabled]}
              onPress={handleLogin} disabled={loading}>
              <Text style={styles.signInText}>{loading ? 'Signing in...' : 'Sign in'}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.switchContainer} onPress={() => setScreen('register')}>
              <Text style={styles.switchText}>Naya account? <Text style={styles.switchLink}>Register karo</Text></Text>
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
          <View style={styles.logoContainer}>
            <Text style={styles.appName}>Guardian Register</Text>
            <Text style={styles.subtitle}>Patient ne jo number add kiya woh daalo</Text>
          </View>

          <View style={styles.formContainer}>
            {[
              { label: 'Full Name', value: regName, set: setRegName, placeholder: 'Apna naam' },
              { label: 'Email', value: regEmail, set: setRegEmail, placeholder: 'Email address', keyboard: 'email-address' },
              { label: 'Password', value: regPassword, set: setRegPassword, placeholder: 'Password', secure: true },
              { label: 'Phone Number (Patient ne add kiya hua)', value: regPhone, set: setRegPhone, placeholder: '+92-300-xxxxxxx', keyboard: 'phone-pad' },
              { label: 'Relation (optional)', value: regRelation, set: setRegRelation, placeholder: 'e.g. Son, Wife, Brother' },
            ].map((field, i) => (
              <View key={i}>
                <Text style={styles.label}>{field.label}</Text>
                <TextInput style={styles.input} placeholder={field.placeholder}
                  placeholderTextColor="#aaa" keyboardType={field.keyboard || 'default'}
                  autoCapitalize="none" secureTextEntry={field.secure || false}
                  value={field.value} onChangeText={field.set} />
              </View>
            ))}

            <TouchableOpacity style={[styles.signInButton, loading && styles.buttonDisabled]}
              onPress={handleRegister} disabled={loading}>
              <Text style={styles.signInText}>{loading ? 'Sending OTP...' : 'OTP Bhejo'}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.switchContainer} onPress={() => setScreen('login')}>
              <Text style={styles.switchText}>Already registered? <Text style={styles.switchLink}>Login karo</Text></Text>
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
        <View style={styles.logoContainer}>
          <Text style={styles.logoIcon}>🔐</Text>
          <Text style={styles.appName}>OTP Verify</Text>
          <Text style={styles.subtitle}>{otpPhone} par code bheja gaya</Text>
        </View>

        <View style={styles.formContainer}>
          <Text style={styles.label}>6-Digit OTP</Text>
          <TextInput style={[styles.input, styles.otpInput]}
            placeholder="- - - -" placeholderTextColor="#aaa"
            keyboardType="number-pad" maxLength={6}
            value={otp} onChangeText={setOtp} />

          <TouchableOpacity style={[styles.signInButton, loading && styles.buttonDisabled]}
            onPress={handleVerifyOTP} disabled={loading}>
            <Text style={styles.signInText}>{loading ? 'Verifying...' : 'Verify OTP'}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.switchContainer} onPress={() => setScreen('register')}>
            <Text style={styles.switchText}><Text style={styles.switchLink}>← Wapas jao</Text></Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f2f2f6' },
  inner: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24, paddingVertical: 40 },
  logoContainer: { alignItems: 'center', marginBottom: 40 },
  logoBox: { width: 72, height: 72, backgroundColor: '#ddeeff', borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  logoIcon: { fontSize: 30 },
  appName: { fontSize: 26, fontWeight: '700', color: '#111', marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#888', textAlign: 'center' },
  formContainer: { width: '100%' },
  label: { fontSize: 13, color: '#555', marginBottom: 6, marginLeft: 2 },
  input: { backgroundColor: '#fff', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, color: '#222', marginBottom: 18, borderWidth: 0.5, borderColor: '#ddd' },
  otpInput: { fontSize: 28, textAlign: 'center', letterSpacing: 12, fontWeight: '700' },
  signInButton: { backgroundColor: '#2979ff', borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 4 },
  buttonDisabled: { backgroundColor: '#88aaee' },
  signInText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  switchContainer: { alignItems: 'center', marginTop: 18 },
  switchText: { color: '#888', fontSize: 14 },
  switchLink: { color: '#2979ff', fontWeight: '600' },
});