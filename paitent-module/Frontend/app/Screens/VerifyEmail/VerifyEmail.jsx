import React, { useState, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter, useLocalSearchParams } from "expo-router";
import apiService from "../../services/api";

const ShieldIcon = ({ size = 50, color = "#2563EB" }) => (
  <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
    <View
      style={{
        width: size * 0.7,
        height: size * 0.85,
        backgroundColor: color + "10",
        borderWidth: size * 0.08,
        borderColor: color,
        borderBottomLeftRadius: size * 0.1,
        borderBottomRightRadius: size * 0.1,
      }}
    />
    <View
      style={{
        position: "absolute",
        top: 0,
        width: 0,
        height: 0,
        borderLeftWidth: size * 0.35,
        borderRightWidth: size * 0.35,
        borderBottomWidth: size * 0.2,
        backgroundColor: "transparent",
        borderLeftColor: "transparent",
        borderRightColor: "transparent",
        borderBottomColor: color,
      }}
    />
  </View>
);

const MailIcon = ({ size = 16, color = "#2563EB" }) => (
  <View style={{ width: size, height: size * 0.75 }}>
    <View
      style={{
        width: size,
        height: size * 0.75,
        borderWidth: 1.5,
        borderColor: color,
        borderRadius: 3,
        backgroundColor: color + "10",
      }}
    />
  </View>
);

export default function VerifyEmail() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const email = params.email || '';
  
  const [code, setCode] = useState(["", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);

  const inputRefs = [useRef(null), useRef(null), useRef(null), useRef(null)];

  const handleCodeChange = (text, index) => {
    if (text.length > 1) text = text.slice(-1);
    const newCode = [...code];
    newCode[index] = text;
    setCode(newCode);

    if (text && index < 3) inputRefs[index + 1].current?.focus();
  };

  const handleKeyPress = (e, index) => {
    if (e.nativeEvent.key === "Backspace" && !code[index] && index > 0) {
      inputRefs[index - 1].current?.focus();
    }
  };

  const handleVerify = async () => {
    const codeString = code.join("");
    
    if (codeString.length !== 4) {
      Alert.alert("Incomplete Code", "Please enter all 4 digits.");
      return;
    }

    if (!email) {
      Alert.alert("Error", "Email not found. Please go back and try again.");
      return;
    }

    setLoading(true);

    try {
      console.log('Verifying code:', codeString, 'for email:', email);

      // Call API to verify code
      const response = await apiService.verifyCode(email, codeString);
      
      console.log('Code verified successfully:', response);

      Alert.alert(
        "Verified! ✅",
        "Code verified successfully!",
        [
          { 
            text: "Continue", 
            onPress: () => {
              router.push({
                pathname: "/Screens/ResetPassword/ResetPassword",
                params: { email: email }
              });
            }
          },
        ]
      );
    } catch (error) {
      console.error('Verify code error:', error);
      setCode(["", "", "", ""]);
      inputRefs[0].current?.focus();
      Alert.alert("Invalid Code", error.message || "The code you entered is incorrect.");
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (!email) {
      Alert.alert("Error", "Email not found. Please go back and try again.");
      return;
    }

    setResendLoading(true);

    try {
      console.log('Resending code to:', email);
      
      await apiService.forgotPassword(email);

      Alert.alert(
        "Code Resent! ✅",
        "A new verification code has been sent to your email"
      );
    } catch (error) {
      console.error('Resend code error:', error);
      Alert.alert("Error", error.message || "Failed to resend code");
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["#EBF2FF", "#F8FAFF"]}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <KeyboardAvoidingView
          style={styles.content}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <View style={styles.shieldContainer}>
            <View style={styles.shieldCircle}>
              <ShieldIcon size={60} color="#2563EB" />
            </View>
          </View>

          <View style={styles.card}>
            <View style={styles.cardContent}>
              <Text style={styles.title}>Enter Verification Code</Text>

              <View style={styles.emailBox}>
                <MailIcon size={16} />
                <Text style={styles.subtitle}>Code sent to {email}</Text>
              </View>

              <View style={styles.codeContainer}>
                {code.map((digit, index) => (
                  <TextInput
                    key={index}
                    ref={inputRefs[index]}
                    style={[styles.codeInput, digit && styles.codeInputFilled]}
                    keyboardType="number-pad"
                    maxLength={1}
                    value={digit}
                    onChangeText={(text) => handleCodeChange(text, index)}
                    onKeyPress={(e) => handleKeyPress(e, index)}
                    selectTextOnFocus
                    editable={!loading}
                  />
                ))}
              </View>

              <TouchableOpacity
                style={[styles.button, (loading || code.some((d) => !d)) && styles.buttonDisabled]}
                activeOpacity={0.8}
                onPress={handleVerify}
                disabled={loading || code.some((d) => !d)}
              >
                <LinearGradient
                  colors={
                    loading || code.some((d) => !d)
                      ? ["#93C5FD", "#A5B4FC"]
                      : ["#2563EB", "#1E3A8A"]
                  }
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.buttonGradient}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.buttonText}>Verify Code</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>

              <View style={styles.resendContainer}>
                <Text style={styles.didntReceiveText}>Didn't receive code?</Text>
                <TouchableOpacity 
                  onPress={handleResendCode} 
                  activeOpacity={0.7}
                  disabled={resendLoading || loading}
                >
                  {resendLoading ? (
                    <ActivityIndicator size="small" color="#2563EB" />
                  ) : (
                    <Text style={styles.resendText}>Resend code</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  gradient: { flex: 1 },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  shieldContainer: {
    marginBottom: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  shieldCircle: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: "#E0E7FF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: "#2563EB20",
  },
  card: {
    width: "100%",
    maxWidth: 420,
    borderRadius: 24,
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 20,
    elevation: 8,
  },
  cardContent: { padding: 26 },
  title: {
    fontSize: 22,
    fontWeight: "800",
    color: "#0F172A",
    textAlign: "center",
    marginBottom: 12,
  },
  emailBox: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EFF6FF",
    borderRadius: 10,
    padding: 10,
    marginBottom: 24,
    gap: 8,
  },
  subtitle: { fontSize: 13, color: "#1E3A8A", fontWeight: "600" },
  codeContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 24,
    gap: 10,
  },
  codeInput: {
    flex: 1,
    height: 58,
    borderWidth: 2,
    borderColor: "#E2E8F0",
    borderRadius: 14,
    fontSize: 26,
    fontWeight: "800",
    textAlign: "center",
    color: "#0F172A",
    backgroundColor: "#F8FAFC",
  },
  codeInputFilled: {
    borderColor: "#2563EB",
    backgroundColor: "#EFF6FF",
  },
  button: { marginBottom: 18, borderRadius: 14, overflow: "hidden" },
  buttonDisabled: { opacity: 0.6 },
  buttonGradient: {
    height: 54,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "800" },
  resendContainer: { 
    alignItems: "center", 
    marginTop: 8,
    marginBottom: 8
  },
  didntReceiveText: { 
    color: "#64748B", 
    fontSize: 14,
    marginBottom: 6
  },
  resendText: {
    color: "#2563EB",
    fontSize: 15,
    fontWeight: "700",
    textDecorationLine: "underline",
  },
});