import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
  Alert,
  RefreshControl,
 
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import {
  ChevronLeft,
  AlertTriangle,
  Zap,
  Shield,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Minus,
} from "lucide-react-native";
import Footer from "../components/Footer";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SMS from "expo-sms";
import * as Location from "expo-location";
import axios from "axios";
import { API_BASE_URL } from "../../constants/constants";

const VITALS_API   = `${API_BASE_URL}/api/vitals`;
const CONTACTS_API = `${API_BASE_URL}/api/emergency-contacts`;

// ══════════════════════════════════════════════════════════════
//  STATUS HELPER FUNCTIONS
// ══════════════════════════════════════════════════════════════

const getHeartRateStatus = (hr, gender = null) => {
  if (hr == null) return null;
  const v      = Number(hr);
  const female = gender === "Female" || gender === "0" || gender === 0;
  const low    = female ? 61 : 57;
  const high   = female ? 92 : 90;
  if (v < 40 || v > 150) return { label: "Critical",  dir: "high", color: "#DC2626", bg: "#FEE2E2" };
  if (v < low)           return { label: "Low ↓",     dir: "low",  color: "#3B82F6", bg: "#DBEAFE" };
  if (v > high)          return { label: "High ↑",    dir: "high", color: "#EF4444", bg: "#FEE2E2" };
  return                        { label: "Normal",     dir: "ok",   color: "#10B981", bg: "#D1FAE5" };
};

const getSpO2Status = (spo2) => {
  if (spo2 == null) return null;
  const v = Number(spo2);
  if (v < 85) return { label: "Critical ↓", dir: "low",  color: "#DC2626", bg: "#FEE2E2" };
  if (v < 90) return { label: "Very Low ↓", dir: "low",  color: "#EF4444", bg: "#FEE2E2" };
  if (v < 94) return { label: "Low ↓",      dir: "low",  color: "#F97316", bg: "#FFEDD5" };
  if (v < 96) return { label: "Mild ↓",     dir: "low",  color: "#F59E0B", bg: "#FEF3C7" };
  return             { label: "Normal",      dir: "ok",   color: "#10B981", bg: "#D1FAE5" };
};

const getTempStatus = (temp) => {
  if (temp == null) return null;
  const v = Number(temp);
  if (v >= 40 || v < 34) return { label: "Critical",   dir: v >= 40 ? "high" : "low", color: "#DC2626", bg: "#FEE2E2" };
  if (v >= 39)            return { label: "High ↑",     dir: "high", color: "#EF4444", bg: "#FEE2E2" };
  if (v < 35)             return { label: "Low ↓",      dir: "low",  color: "#3B82F6", bg: "#DBEAFE" };
  if (v >= 38)            return { label: "Moderate ↑", dir: "high", color: "#F97316", bg: "#FFEDD5" };
  if (v >= 37.5)          return { label: "Mild ↑",     dir: "high", color: "#F59E0B", bg: "#FEF3C7" };
  return                         { label: "Normal",      dir: "ok",   color: "#10B981", bg: "#D1FAE5" };
};

const getBPStatus = (systolic, diastolic) => {
  if (systolic == null) return null;
  const s = Number(systolic);
  const d = diastolic ? Number(diastolic) : 0;
  if (s > 180 || d > 120) return { label: "Crisis ↑",   dir: "high", color: "#DC2626", bg: "#FEE2E2", stage: "Hypertensive Crisis" };
  if (s >= 140 || d >= 90) return { label: "Stage 2 ↑", dir: "high", color: "#EF4444", bg: "#FEE2E2", stage: "Stage 2 Hypertension" };
  if (s >= 130 || d >= 80) return { label: "Stage 1 ↑", dir: "high", color: "#F97316", bg: "#FFEDD5", stage: "Stage 1 Hypertension" };
  if (s >= 120)            return  { label: "Elevated ↑", dir: "high", color: "#F59E0B", bg: "#FEF3C7", stage: "Elevated BP" };
  return                           { label: "Normal",     dir: "ok",   color: "#10B981", bg: "#D1FAE5", stage: "Normal" };
};

const getBMIStatus = (bmi) => {
  if (bmi == null) return null;
  const v = Number(bmi);
  if (v >= 40)  return { label: "Class 3 Obesity ↑", dir: "high", color: "#DC2626", bg: "#FEE2E2" };
  if (v >= 35)  return { label: "Class 2 Obesity ↑", dir: "high", color: "#EF4444", bg: "#FEE2E2" };
  if (v >= 30)  return { label: "Class 1 Obesity ↑", dir: "high", color: "#F97316", bg: "#FFEDD5" };
  if (v >= 25)  return { label: "Overweight ↑",      dir: "high", color: "#F59E0B", bg: "#FEF3C7" };
  if (v < 18.5) return { label: "Underweight ↓",     dir: "low",  color: "#3B82F6", bg: "#DBEAFE" };
  return               { label: "Healthy",             dir: "ok",   color: "#10B981", bg: "#D1FAE5" };
};

const getAgeHTRisk = (age) => {
  if (age == null) return null;
  const v = Number(age);
  if (v >= 65) return { label: "Very High Risk ↑", dir: "high", color: "#DC2626", bg: "#FEE2E2", range: "65+ yrs" };
  if (v >= 50) return { label: "High Risk ↑",      dir: "high", color: "#EF4444", bg: "#FEE2E2", range: "50–64 yrs" };
  if (v >= 35) return { label: "Moderate Risk",     dir: "mid",  color: "#F97316", bg: "#FFEDD5", range: "35–49 yrs" };
  return              { label: "Low Risk",           dir: "ok",   color: "#10B981", bg: "#D1FAE5", range: "20–34 yrs" };
};

const getStepsStatus = (steps) => {
  if (steps == null) return null;
  const v = Number(steps);
  if (v < 1000)  return { label: "Critical Low ↓", dir: "low",  color: "#DC2626", bg: "#FEE2E2" };
  if (v < 4000)  return { label: "Low ↓",           dir: "low",  color: "#F97316", bg: "#FFEDD5" };
  if (v <= 6999) return  { label: "Moderate",        dir: "ok",   color: "#F59E0B", bg: "#FEF3C7" };
  return                 { label: "Active ✓",         dir: "ok",   color: "#10B981", bg: "#D1FAE5" };
};

const getSeverityColor = (s) =>
  ({ Normal: "#10B981", Mild: "#F59E0B", Moderate: "#F97316", Severe: "#EF4444", Critical: "#DC2626" }[s] || "#6B7280");
const getSeverityBg = (s) =>
  ({ Normal: "#D1FAE5", Mild: "#FEF3C7", Moderate: "#FFEDD5", Severe: "#FEE2E2", Critical: "#FEE2E2" }[s] || "#F3F4F6");

// ══════════════════════════════════════════════════════════════
//  VITAL TAB  (horizontal scroll mein chota card)
// ══════════════════════════════════════════════════════════════
const VitalTab = ({ label, value, unit, status }) => {
  if (value == null) return null;
  const DirIcon =
    status?.dir === "high" ? TrendingUp :
    status?.dir === "low"  ? TrendingDown : Minus;
  return (
    <View style={styles.vitalTab}>
      <Text style={styles.vitalTabLabel}>{label}</Text>
      <View style={styles.vitalTabValueRow}>
        {status && <DirIcon size={11} color={status.color} />}
        <Text style={[styles.vitalTabValue, status ? { color: status.color } : {}]}>
          {value}
        </Text>
        <Text style={styles.vitalTabUnit}>{unit}</Text>
      </View>
      {status && (
        <View style={[styles.vitalTabBadge, { backgroundColor: status.bg }]}>
          <Text style={[styles.vitalTabBadgeText, { color: status.color }]}>
            {status.label}
          </Text>
        </View>
      )}
    </View>
  );
};

// ══════════════════════════════════════════════════════════════
//  HYPERTENSION CARD
// ══════════════════════════════════════════════════════════════
const HypertensionCard = ({ data, vitals, profileData }) => {
  const severity  = data?.severity  || "No Data";
  const riskScore = data?.risk_score != null ? (data.risk_score * 100).toFixed(1) : null;
  const color     = getSeverityColor(severity);

  const f      = data?.features || {};
  const gender = f?.gender ?? f?.Gender ?? profileData?.gender;
  const sys    = vitals?.bpSystolic  ?? f?.Systolic_BP_mmHg  ?? f?.systolic_bp;
  const dia    = vitals?.bpDiastolic ?? f?.Diastolic_BP_mmHg ?? f?.diastolic_bp;
  const hr     = vitals?.heartRate   ?? f?.RHR               ?? f?.resting_heart_rate;
  const bmi    = f?.BMI              ?? f?.bmi;
  const age    = f?.Age              ?? f?.age;
  const steps  = f?.Daily_Steps      ?? f?.daily_steps;

  const bpSt    = getBPStatus(sys, dia);
  const hrSt    = getHeartRateStatus(hr, gender);
  const bmiSt   = getBMIStatus(bmi);
  const ageSt   = getAgeHTRisk(age);
  const stepsSt = getStepsStatus(steps);

  const reasons = [];
  if (bpSt   && bpSt.dir   !== "ok")  reasons.push(`Blood Pressure is ${bpSt.stage} — primary HT indicator`);
  if (hrSt   && hrSt.dir   !== "ok")  reasons.push(`Resting Heart Rate (${hr} bpm) is ${hrSt.label}`);
  if (bmiSt  && bmiSt.dir  !== "ok")  reasons.push(`BMI ${Number(bmi).toFixed(1)} — ${bmiSt.label} raises HT risk`);
  if (ageSt  && ageSt.dir  !== "ok")  reasons.push(`Age group (${ageSt.range}) has elevated HT prevalence`);
  if (stepsSt&& stepsSt.dir!== "ok")  reasons.push(`Daily steps (${steps}) are ${stepsSt.label} — low activity increases BP`);

  const hasVitals = sys || hr || bmi || age || steps;

  return (
    <View style={[styles.mlCard, { borderLeftColor: color }]}>
      <View style={styles.mlCardHeader}>
        <View style={styles.mlCardLeft}>
          <Text style={styles.mlCardIcon}></Text>
          <Text style={styles.mlCardTitle}>Hypertension</Text>
        </View>
        <View style={[styles.severityBadge, { backgroundColor: color }]}>
          <Text style={styles.severityText}>{severity}</Text>
        </View>
      </View>

      {riskScore && (
        <View style={styles.riskRow}>
          <Text style={styles.riskLabel}>Risk Score:</Text>
          <Text style={[styles.riskValue, { color }]}>{riskScore}%</Text>
          <View style={styles.riskBarBg}>
            <View style={[styles.riskBarFill, { width: `${Math.min(riskScore,100)}%`, backgroundColor: color }]} />
          </View>
        </View>
      )}

      {hasVitals ? (
        <>
          <Text style={styles.featureHeading}>📊 Vitals used for prediction:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 10 }}>
            {sys   != null && <VitalTab label="Systolic BP"  value={sys}   unit="mmHg" status={bpSt} />}
            {dia   != null && <VitalTab label="Diastolic BP" value={dia}   unit="mmHg" status={getBPStatus(sys, dia)} />}
            {hr    != null && <VitalTab label="Heart Rate"   value={hr}    unit="bpm"  status={hrSt} />}
            {bmi   != null && <VitalTab label="BMI"          value={Number(bmi).toFixed(1)} unit="" status={bmiSt} />}
            {age   != null && <VitalTab label="Age"          value={age}   unit="yrs"  status={ageSt} />}
            {steps != null && <VitalTab label="Daily Steps"  value={steps} unit="steps" status={stepsSt} />}
          </ScrollView>
          {reasons.length > 0 && (
            <View style={styles.reasonBox}>
              <Text style={styles.reasonTitle}>⚠️ Why this prediction?</Text>
              {reasons.map((r, i) => (
                <View key={i} style={styles.reasonRow}>
                  <Text style={styles.reasonBullet}>•</Text>
                  <Text style={styles.reasonText}>{r}</Text>
                </View>
              ))}
            </View>
          )}
        </>
      ) : (
        <Text style={styles.noFeatureText}>Vitals sync karo — hypertension features load honge</Text>
      )}

      {!data && <Text style={styles.noFeatureText}>Data available nahi — pehle sync karo</Text>}
      {data?.timestamp && (
        <Text style={styles.timestampText}> {new Date(data.timestamp).toLocaleString()}</Text>
      )}
    </View>
  );
};

// ══════════════════════════════════════════════════════════════
//  SLEEP APNEA CARD
// ══════════════════════════════════════════════════════════════
const SleepApneaCard = ({ data, vitals }) => {
  const severity  = data?.severity  || "No Data";
  const riskScore = data?.risk_score != null ? (data.risk_score * 100).toFixed(1) : null;
  const color     = getSeverityColor(severity);

  const f     = data?.features || {};
  const spo2  = vitals?.bloodOxygen ?? f?.SpO2          ?? f?.blood_oxygen;
  const hr    = vitals?.heartRate   ?? f?.HR             ?? f?.heart_rate;
  const temp  = vitals?.temperature ?? f?.Temp           ?? f?.temperature;
  const bmi   = f?.BMI              ?? f?.bmi;
  const snore = f?.Snoring_Rate     ?? f?.snoring_rate;

  const spo2St  = getSpO2Status(spo2);
  const hrSt    = getHeartRateStatus(hr);
  const tempSt  = getTempStatus(temp);
  const bmiSt   = getBMIStatus(bmi);
  const snoreSt = snore != null
    ? (Number(snore) > 50
        ? { label: "High ↑", dir: "high", color: "#EF4444", bg: "#FEE2E2" }
        : { label: "Normal", dir: "ok",   color: "#10B981", bg: "#D1FAE5" })
    : null;

  const reasons = [];
  if (spo2St && spo2St.dir !== "ok") reasons.push(`SpO2 (${spo2}%) is ${spo2St.label} — oxygen drop during sleep`);
  if (hrSt   && hrSt.dir   !== "ok") reasons.push(`Heart Rate (${hr} bpm) is ${hrSt.label} — irregular rhythm`);
  if (bmiSt  && bmiSt.dir  !== "ok") reasons.push(`BMI ${Number(bmi).toFixed(1)} is ${bmiSt.label} — airway obstruction risk`);
  if (snore != null && Number(snore) > 50) reasons.push(`Snoring rate (${snore}%) is high — key apnea indicator`);

  const hasVitals = spo2 || hr || temp || bmi;

  return (
    <View style={[styles.mlCard, { borderLeftColor: color }]}>
      <View style={styles.mlCardHeader}>
        <View style={styles.mlCardLeft}>
          <Text style={styles.mlCardIcon}></Text>
          <Text style={styles.mlCardTitle}>Sleep Apnea</Text>
        </View>
        <View style={[styles.severityBadge, { backgroundColor: color }]}>
          <Text style={styles.severityText}>{severity}</Text>
        </View>
      </View>

      {riskScore && (
        <View style={styles.riskRow}>
          <Text style={styles.riskLabel}>Risk Score:</Text>
          <Text style={[styles.riskValue, { color }]}>{riskScore}%</Text>
          <View style={styles.riskBarBg}>
            <View style={[styles.riskBarFill, { width: `${Math.min(riskScore,100)}%`, backgroundColor: color }]} />
          </View>
        </View>
      )}

      {hasVitals ? (
        <>
          <Text style={styles.featureHeading}>📊 Vitals used for prediction:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 10 }}>
            {spo2  != null && <VitalTab label="SpO2"        value={spo2}  unit="%"   status={spo2St} />}
            {hr    != null && <VitalTab label="Heart Rate"   value={hr}    unit="bpm" status={hrSt} />}
            {temp  != null && <VitalTab label="Temperature"  value={temp}  unit="°C"  status={tempSt} />}
            {bmi   != null && <VitalTab label="BMI"          value={Number(bmi).toFixed(1)} unit="" status={bmiSt} />}
            {snore != null && <VitalTab label="Snoring"      value={snore} unit="%"   status={snoreSt} />}
          </ScrollView>
          {reasons.length > 0 && (
            <View style={styles.reasonBox}>
              <Text style={styles.reasonTitle}>⚠️ Why this prediction?</Text>
              {reasons.map((r, i) => (
                <View key={i} style={styles.reasonRow}>
                  <Text style={styles.reasonBullet}>•</Text>
                  <Text style={styles.reasonText}>{r}</Text>
                </View>
              ))}
            </View>
          )}
        </>
      ) : (
        <Text style={styles.noFeatureText}>Vitals sync karo — sleep apnea features load honge</Text>
      )}

      {!data && <Text style={styles.noFeatureText}>Data available nahi — pehle sync karo</Text>}
      {data?.timestamp && (
        <Text style={styles.timestampText}>🕐 {new Date(data.timestamp).toLocaleString()}</Text>
      )}
    </View>
  );
};

// ══════════════════════════════════════════════════════════════
//  TACHY/BRADY CARD
// ══════════════════════════════════════════════════════════════
const TachyBradyCard = ({ data, vitals }) => {
  const severity  = data?.severity  || "No Data";
  const riskScore = data?.risk_score != null ? (data.risk_score * 100).toFixed(1) : null;
  const color     = getSeverityColor(severity);

  const f      = data?.features || {};
  const hr     = vitals?.heartRate   ?? f?.HR          ?? f?.heart_rate;
  const spo2   = vitals?.bloodOxygen ?? f?.SpO2        ?? f?.blood_oxygen;
  const temp   = vitals?.temperature ?? f?.Temp        ?? f?.temperature;
  const gender = f?.gender           ?? f?.Gender;

  const hrSt   = getHeartRateStatus(hr, gender);
  const spo2St = getSpO2Status(spo2);
  const tempSt = getTempStatus(temp);

  const reasons = [];
  if (hr != null) {
    const v = Number(hr);
    if (v > 100) reasons.push(`Heart Rate ${v} bpm — Tachycardia detected (normal: 60–100 bpm)`);
    else if (v < 60) reasons.push(`Heart Rate ${v} bpm — Bradycardia detected (normal: 60–100 bpm)`);
  }
  if (spo2St && spo2St.dir !== "ok") reasons.push(`Low SpO2 (${spo2}%) — low oxygen stresses heart rhythm`);
  if (tempSt && tempSt.dir !== "ok") reasons.push(`Temperature ${temp}°C — fever/hypothermia affects heart rate`);

  const hasVitals = hr || spo2 || temp;

  return (
    <View style={[styles.mlCard, { borderLeftColor: color }]}>
      <View style={styles.mlCardHeader}>
        <View style={styles.mlCardLeft}>
          <Text style={styles.mlCardIcon}></Text>
          <Text style={styles.mlCardTitle}>Tachy / Bradycardia</Text>
        </View>
        <View style={[styles.severityBadge, { backgroundColor: color }]}>
          <Text style={styles.severityText}>{severity}</Text>
        </View>
      </View>

      {riskScore && (
        <View style={styles.riskRow}>
          <Text style={styles.riskLabel}>Risk Score:</Text>
          <Text style={[styles.riskValue, { color }]}>{riskScore}%</Text>
          <View style={styles.riskBarBg}>
            <View style={[styles.riskBarFill, { width: `${Math.min(riskScore,100)}%`, backgroundColor: color }]} />
          </View>
        </View>
      )}

      {hasVitals ? (
        <>
          <Text style={styles.featureHeading}>📊 Vitals used for prediction:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 10 }}>
            {hr   != null && <VitalTab label="Heart Rate"   value={hr}   unit="bpm" status={hrSt} />}
            {spo2 != null && <VitalTab label="SpO2"         value={spo2} unit="%"   status={spo2St} />}
            {temp != null && <VitalTab label="Temperature"  value={temp} unit="°C"  status={tempSt} />}
          </ScrollView>
          {reasons.length > 0 && (
            <View style={styles.reasonBox}>
              <Text style={styles.reasonTitle}>⚠️ Why this prediction?</Text>
              {reasons.map((r, i) => (
                <View key={i} style={styles.reasonRow}>
                  <Text style={styles.reasonBullet}>•</Text>
                  <Text style={styles.reasonText}>{r}</Text>
                </View>
              ))}
            </View>
          )}
        </>
      ) : (
        <Text style={styles.noFeatureText}>Vitals sync karo — heart rhythm features load honge</Text>
      )}

      {!data && <Text style={styles.noFeatureText}>Data available nahi — pehle sync karo</Text>}
      {data?.timestamp && (
        <Text style={styles.timestampText}>🕐 {new Date(data.timestamp).toLocaleString()}</Text>
      )}
    </View>
  );
};

// ══════════════════════════════════════════════════════════════
//  TOP VITALS BOX  (with status badge + trending icon)
// ══════════════════════════════════════════════════════════════
const VitalBox = ({ value, label, unit, statusFn, gender }) => {
  const status  = statusFn ? statusFn(value, gender) : null;
  const DirIcon =
    status?.dir === "high" ? TrendingUp :
    status?.dir === "low"  ? TrendingDown : Minus;
  return (
    <View style={styles.vitalItem}>
      <Text style={[styles.vitalValue, status ? { color: status.color } : {}]}>
        {value ?? "-"}
      </Text>
      <Text style={styles.vitalLabel}>{label}</Text>
      <Text style={styles.vitalUnit}>{unit}</Text>
      {status && (
        <View style={[styles.vitalStatusBadge, { backgroundColor: status.bg }]}>
          {status.dir !== "ok" && <DirIcon size={9} color={status.color} />}
          <Text style={[styles.vitalStatusText, { color: status.color }]}>
            {status.label}
          </Text>
        </View>
      )}
    </View>
  );
};

// ══════════════════════════════════════════════════════════════
//  MAIN SCREEN
// ══════════════════════════════════════════════════════════════
export default function HealthDashboard() {
  const router = useRouter();
  const [loading,      setLoading]      = useState(false);
  const [syncing,      setSyncing]      = useState(false);
  const [refreshing,   setRefreshing]   = useState(false);
  const [sendingAlert, setSendingAlert] = useState(false);
  const [hypertension, setHypertension] = useState(null);
  const [sleepApnea,   setSleepApnea]   = useState(null);
  const [tachyBrady,   setTachyBrady]   = useState(null);
  const [latestVitals, setLatestVitals] = useState(null);
  const [profileData,  setProfileData]  = useState(null);
  const autoAlertFired = useRef(false);

  useEffect(() => { fetchLatestData(); }, []);

  useEffect(() => {
    if (autoAlertFired.current) return;
    const check = (d) => {
      if (!d) return false;
      if (["Severe","Critical"].includes(d.severity)) return true;
      if (d.risk_score != null && d.risk_score * 100 >= 75) return true;
      return false;
    };
    if (check(hypertension) || check(sleepApnea) || check(tachyBrady)) {
      autoAlertFired.current = true;
      setTimeout(() => sendEmergencyAlert(true), 1500);
    }
  }, [hypertension, sleepApnea, tachyBrady]);

  const fetchLatestData = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem("userToken");
      if (!token) return;
      const headers = { Authorization: `Bearer ${token}` };

      try {
        const res = await axios.get(`${VITALS_API}/latest`, { headers });
        if (res.data.success) setLatestVitals(res.data.data);
      } catch (e) { console.log("Vitals:", e.message); }

      try {
        const ud = await AsyncStorage.getItem("userData");
        if (ud) setProfileData(JSON.parse(ud));
      } catch (e) {}

      const userDataStr = await AsyncStorage.getItem("userData");
      const userData    = userDataStr ? JSON.parse(userDataStr) : null;
      const userId =
        userData?._id || userData?.id ||
        userData?.user?._id || userData?.user?.id || userData?.data?._id;

      if (userId) {
        try {
          const mlRes = await axios.get(`${VITALS_API}/patient/${userId}`, { headers });
          if (mlRes.data.success) {
            const { hypertension, sleepApnea, tachyBrady } = mlRes.data.data;
            if (hypertension?.length > 0) setHypertension(hypertension[0]);
            if (sleepApnea?.length > 0)   setSleepApnea(sleepApnea[0]);
            if (tachyBrady?.length > 0)   setTachyBrady(tachyBrady[0]);
          }
        } catch (e) { console.log("ML:", e.message); }
      }
    } catch (err) { console.log("Fetch error:", err.message); }
    finally { setLoading(false); }
  };

  const handleSync = async () => {
    try {
      setSyncing(true);
      autoAlertFired.current = false;
      await fetchLatestData();
      Alert.alert("Done!", "Latest ML predictions loaded!");
    } catch (err) {
      Alert.alert("Failed", err.message || "Please try again");
    } finally { setSyncing(false); }
  };

  const sendEmergencyAlert = async (isAuto = false) => {
    try {
      setSendingAlert(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        if (!isAuto) Alert.alert("Permission Denied", "Location permission required.");
        return;
      }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const { latitude, longitude } = loc.coords;

      let address = "Address not available";
      try {
        const results = await Location.reverseGeocodeAsync({ latitude, longitude });
        if (results.length > 0) {
          const a = results[0];
          address = [a.name, a.street, a.city, a.region, a.country].filter(Boolean).join(", ");
        }
      } catch (e) {}

      const mapsUrl   = `https://www.google.com/maps?q=${latitude},${longitude}`;
      const userName  = (await AsyncStorage.getItem("userName")) || "Patient";
      const timestamp = new Date().toLocaleString();

      const criticalConditions = [];
      if (hypertension?.severity && !["Normal","Mild"].includes(hypertension.severity))
        criticalConditions.push(`Hypertension: ${hypertension.severity}`);
      if (sleepApnea?.severity && !["Normal","Mild"].includes(sleepApnea.severity))
        criticalConditions.push(`Sleep Apnea: ${sleepApnea.severity}`);
      if (tachyBrady?.severity && !["Normal","Mild"].includes(tachyBrady.severity))
        criticalConditions.push(`Heart: ${tachyBrady.severity}`);

      const alertMessage =
        `EMERGENCY HEALTH ALERT\n\n${userName} needs immediate help!\n\n` +
        `ML Detected:\n${criticalConditions.length > 0 ? criticalConditions.join("\n") : "Critical vitals detected"}\n\n` +
        `Location: ${address}\n\nMaps: ${mapsUrl}\n\nTime: ${timestamp}\n\n- Sent from MediTrack`;

      const token       = await AsyncStorage.getItem("userToken");
      const userDataStr = await AsyncStorage.getItem("userData");
      const userData    = userDataStr ? JSON.parse(userDataStr) : null;
      const userId      = userData?._id || userData?.id || userData?.user?._id || userData?.user?.id;

      const response = await axios.post(
        `${CONTACTS_API}/send-alert`,
        { userId, alertMessage },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        const contacts = response.data.contacts || [];
        if (contacts.length === 0) {
          if (!isAuto) Alert.alert("No Contacts", "Please add emergency contacts first.");
          return;
        }
        const isAvailable = await SMS.isAvailableAsync();
        if (!isAvailable) {
          if (!isAuto) Alert.alert("SMS Unavailable", "This device cannot send SMS.");
          return;
        }
        const { result } = await SMS.sendSMSAsync(contacts.map((c) => c.phone), alertMessage);
        if (result === "sent") {
          Alert.alert(
            isAuto ? "Auto Alert Sent!" : "Alert Sent!",
            `Emergency SMS sent to ${contacts.length} guardian(s).`
          );
        }
      }
    } catch (err) {
      if (!isAuto) Alert.alert("Error", "Failed to send emergency alert.");
      else console.log("Auto alert error:", err.message);
    } finally { setSendingAlert(false); }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    autoAlertFired.current = false;
    await fetchLatestData();
    setRefreshing(false);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#8B5CF6" />
          <Text style={styles.loadingText}>Loading Health Dashboard...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />

      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ChevronLeft size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Health Dashboard</Text>
        <TouchableOpacity onPress={fetchLatestData}>
          <RefreshCw size={20} color="#8B5CF6" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={{ paddingBottom: 120 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Hero */}
        <View style={styles.heroCard}>
          <View style={styles.heroIcon}><Shield size={40} color="#FFFFFF" /></View>
          <Text style={styles.heroTitle}>ML Health Predictions</Text>
          <Text style={styles.heroSubtitle}>Trained ML models analyzing your vitals in real-time</Text>
        </View>

        {/* Latest Vitals — har vital ka status */}
        {latestVitals && (
          <View style={styles.vitalsCard}>
            <Text style={styles.sectionTitle}>Latest Vitals</Text>
            <View style={styles.vitalsGrid}>
              <VitalBox value={latestVitals.heartRate}   label="Heart Rate" unit="bpm" statusFn={getHeartRateStatus} gender={profileData?.gender} />
              <VitalBox value={latestVitals.bloodOxygen} label="SpO2"       unit="%"   statusFn={getSpO2Status} />
              <VitalBox value={latestVitals.temperature} label="Temp"       unit="°C"  statusFn={getTempStatus} />
              <View style={styles.vitalItem}>
                <Text style={[styles.vitalValue, { color: getSeverityColor(latestVitals.severity), fontSize: 14 }]}>
                  {latestVitals.severity || "-"}
                </Text>
                <Text style={styles.vitalLabel}>Severity</Text>
                <Text style={styles.vitalUnit}>overall</Text>
                {latestVitals.severity && (
                  <View style={[styles.vitalStatusBadge, { backgroundColor: getSeverityBg(latestVitals.severity) }]}>
                    <Text style={[styles.vitalStatusText, { color: getSeverityColor(latestVitals.severity) }]}>
                      {latestVitals.severity}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </View>
        )}

        {/* Sync Button */}
        <View style={styles.actionSection}>
          <TouchableOpacity style={[styles.syncButton, syncing && styles.buttonDisabled]} onPress={handleSync} disabled={syncing}>
            {syncing
              ? <><ActivityIndicator color="#FFFFFF" size="small" /><Text style={styles.buttonText}>Loading...</Text></>
              : <><Zap size={20} color="#FFFFFF" /><Text style={styles.buttonText}>Refresh ML Predictions</Text></>
            }
          </TouchableOpacity>
        </View>

        {/* ML Prediction Cards */}
      {/* ML Prediction Cards */}
<View style={styles.section}>
  <Text style={styles.sectionTitle}>ML Model Predictions</Text>

  <TouchableOpacity activeOpacity={0.85} onPress={() => router.push({
    pathname: '/Screens/HealthDashboard/DiseaseDetailScreen',
    params: {
      disease:   'hypertension',
      severity:  hypertension?.severity || 'Normal',
      riskScore: hypertension?.risk_score
        ? (hypertension.risk_score * 100).toFixed(1) : '0',
    }
  })}>
    <HypertensionCard data={hypertension} vitals={latestVitals} profileData={profileData} />
  </TouchableOpacity>

  <TouchableOpacity activeOpacity={0.85} onPress={() => router.push({
    pathname: '/Screens/HealthDashboard/DiseaseDetailScreen',
    params: {
      disease:   'sleep-apnea',
      severity:  sleepApnea?.severity || 'Normal',
      riskScore: sleepApnea?.risk_score
        ? (sleepApnea.risk_score * 100).toFixed(1) : '0',
    }
  })}>
    <SleepApneaCard data={sleepApnea} vitals={latestVitals} />
  </TouchableOpacity>

  <TouchableOpacity activeOpacity={0.85} onPress={() => router.push({
    pathname: '/Screens/HealthDashboard/DiseaseDetailScreen',
    params: {
      disease:   'tachy-brady',
      severity:  tachyBrady?.severity || 'Normal',
      riskScore: tachyBrady?.risk_score
        ? (tachyBrady.risk_score * 100).toFixed(1) : '0',
    }
  })}>
    <TachyBradyCard data={tachyBrady} vitals={latestVitals} />
  </TouchableOpacity>

</View>

        {/* Emergency Alert */}
        <View style={styles.actionSection}>
          <TouchableOpacity style={[styles.emergencyButton, sendingAlert && styles.buttonDisabled]} onPress={() => sendEmergencyAlert(false)} disabled={sendingAlert}>
            {sendingAlert
              ? <><ActivityIndicator color="#FFFFFF" size="small" /><Text style={styles.emergencyButtonText}>Sending...</Text></>
              : <><AlertTriangle size={20} color="#FFFFFF" /><Text style={styles.emergencyButtonText}>Send Emergency Alert</Text></>
            }
          </TouchableOpacity>
        </View>
      </ScrollView>

      <Footer />
    </SafeAreaView>
  );
}

// ══════════════════════════════════════════════════════════════
//  STYLES
// ══════════════════════════════════════════════════════════════
const styles = StyleSheet.create({
  container:        { flex: 1, backgroundColor: "#F8FAFC" },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText:      { marginTop: 16, fontSize: 16, color: "#6B7280" },
  header: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: "#FFFFFF", borderBottomWidth: 1, borderBottomColor: "#E5E7EB",
  },
  backButton:  { width: 40, height: 40, justifyContent: "center", alignItems: "center" },
  headerTitle: { fontSize: 20, fontWeight: "bold", color: "#111827" },
  scrollView:  { flex: 1 },

  heroCard: {
    backgroundColor: "#8B5CF6", borderRadius: 16, padding: 24,
    margin: 16, alignItems: "center",
    shadowColor: "#8B5CF6", shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 8,
  },
  heroIcon:     { width: 80, height: 80, borderRadius: 40, backgroundColor: "rgba(255,255,255,0.2)", justifyContent: "center", alignItems: "center", marginBottom: 16 },
  heroTitle:    { fontSize: 22, fontWeight: "bold", color: "#FFFFFF", marginBottom: 8 },
  heroSubtitle: { fontSize: 14, color: "#E9D5FF", textAlign: "center", lineHeight: 20 },

  vitalsCard: {
    backgroundColor: "#FFFFFF", borderRadius: 16, padding: 16,
    marginHorizontal: 16, marginBottom: 16,
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3,
  },
  vitalsGrid:       { flexDirection: "row", justifyContent: "space-between", marginTop: 12 },
  vitalItem:        { alignItems: "center", flex: 1 },
  vitalValue:       { fontSize: 20, fontWeight: "bold", color: "#111827" },
  vitalLabel:       { fontSize: 11, color: "#6B7280", marginTop: 2 },
  vitalUnit:        { fontSize: 10, color: "#9CA3AF" },
  vitalStatusBadge: { marginTop: 5, flexDirection: "row", alignItems: "center", gap: 2, paddingHorizontal: 5, paddingVertical: 2, borderRadius: 8 },
  vitalStatusText:  { fontSize: 9, fontWeight: "700" },

  actionSection: { paddingHorizontal: 16, marginBottom: 16 },
  syncButton: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    backgroundColor: "#10B981", paddingVertical: 16, borderRadius: 12, gap: 8,
    shadowColor: "#10B981", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4, elevation: 4,
  },
  emergencyButton: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    backgroundColor: "#DC2626", paddingVertical: 14, borderRadius: 12, gap: 8,
    shadowColor: "#DC2626", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4, elevation: 4,
  },
  emergencyButtonText: { color: "#FFFFFF", fontSize: 16, fontWeight: "bold" },
  buttonDisabled:      { opacity: 0.6 },
  buttonText:          { color: "#FFFFFF", fontSize: 16, fontWeight: "bold" },

  section:      { paddingHorizontal: 16, marginBottom: 16 },
  sectionTitle: { fontSize: 18, fontWeight: "bold", color: "#111827", marginBottom: 12 },

  // ML Cards
  mlCard: {
    backgroundColor: "#FFFFFF", borderRadius: 12, padding: 16,
    marginBottom: 12, borderLeftWidth: 4,
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 3,
  },
  mlCardHeader:  { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  mlCardLeft:    { flexDirection: "row", alignItems: "center", gap: 8 },
  mlCardIcon:    { fontSize: 20 },
  mlCardTitle:   { fontSize: 16, fontWeight: "700", color: "#111827" },
  severityBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
  severityText:  { color: "#FFFFFF", fontSize: 12, fontWeight: "bold" },

  riskRow:    { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 },
  riskLabel:  { fontSize: 13, color: "#6B7280" },
  riskValue:  { fontSize: 15, fontWeight: "bold", minWidth: 48 },
  riskBarBg:  { flex: 1, height: 6, backgroundColor: "#F3F4F6", borderRadius: 3, overflow: "hidden" },
  riskBarFill:{ height: 6, borderRadius: 3 },

  featureHeading: { fontSize: 12, fontWeight: "600", color: "#6B7280", marginBottom: 8 },

  // Vital Tabs (horizontal scroll)
  vitalTab: {
    alignItems: "center", marginRight: 10,
    backgroundColor: "#F9FAFB", borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 8,
    borderWidth: 1, borderColor: "#E5E7EB", minWidth: 82,
  },
  vitalTabLabel:     { fontSize: 10, color: "#9CA3AF", marginBottom: 3 },
  vitalTabValueRow:  { flexDirection: "row", alignItems: "center", gap: 3 },
  vitalTabValue:     { fontSize: 15, fontWeight: "700", color: "#111827" },
  vitalTabUnit:      { fontSize: 10, color: "#9CA3AF" },
  vitalTabBadge:     { marginTop: 5, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8 },
  vitalTabBadgeText: { fontSize: 9, fontWeight: "700" },

  // Reason box
  reasonBox:    { backgroundColor: "#FFFBEB", borderRadius: 8, padding: 12, borderLeftWidth: 3, borderLeftColor: "#F59E0B", marginBottom: 8 },
  reasonTitle:  { fontSize: 12, fontWeight: "700", color: "#92400E", marginBottom: 6 },
  reasonRow:    { flexDirection: "row", gap: 6, marginBottom: 4 },
  reasonBullet: { fontSize: 12, color: "#92400E" },
  reasonText:   { fontSize: 12, color: "#78350F", flex: 1, lineHeight: 18 },

  noFeatureText: { fontSize: 13, color: "#9CA3AF", fontStyle: "italic", marginTop: 4, marginBottom: 8 },
  timestampText: { fontSize: 11, color: "#9CA3AF", marginTop: 4 },
});
