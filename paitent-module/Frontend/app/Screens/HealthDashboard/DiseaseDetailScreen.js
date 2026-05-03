import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ChevronLeft, TrendingUp, TrendingDown, Minus, AlertTriangle, Activity } from 'lucide-react-native';
import { API_BASE_URL } from '../../constants/constants';

const { width } = Dimensions.get('window');
const CHART_WIDTH  = width - 48;
const CHART_HEIGHT = 160;

// ─── Disease Config ───────────────────────────────────────────────────────────
const DISEASE_CONFIG = {
  hypertension: {
    title:    ' Hypertension',
    color:    '#EF4444',
    bgColor:  '#FEE2E2',
    endpoint: 'hypertension',
    graphs: [
      { key: 'systolic_bp',   label: 'Systolic BP',    unit: 'mmHg', color: '#EF4444', normalMin: 90,  normalMax: 120 },
      { key: 'diastolic_bp',  label: 'Diastolic BP',   unit: 'mmHg', color: '#F97316', normalMin: 60,  normalMax: 80  },
      { key: 'resting_hr',    label: 'Resting HR',     unit: 'bpm',  color: '#8B5CF6', normalMin: 60,  normalMax: 100 },
      { key: 'bmi',           label: 'BMI',            unit: '',     color: '#06B6D4', normalMin: 18.5, normalMax: 24.9 },
      { key: 'risk_score',    label: 'Risk Score',     unit: '%',    color: '#F59E0B', normalMin: 0,   normalMax: 30,  multiply: 100 },
      { key: 'pulse_pressure',label: 'Pulse Pressure', unit: 'mmHg', color: '#10B981', normalMin: 30,  normalMax: 50  },
    ],
  },
  'sleep-apnea': {
    title:    'Sleep Apnea',
    color:    '#8B5CF6',
    bgColor:  '#EDE9FE',
    endpoint: 'sleep-apnea',
    graphs: [
      { key: 'spo2',         label: 'SpO2',           unit: '%',    color: '#3B82F6', normalMin: 95, normalMax: 100 },
      { key: 'spo2_drop',    label: 'SpO2 Drop',      unit: '%',    color: '#EF4444', normalMin: 0,  normalMax: 3   },
      { key: 'heart_rate',   label: 'Heart Rate',     unit: 'bpm',  color: '#8B5CF6', normalMin: 60, normalMax: 100 },
      { key: 'risk_score',   label: 'Risk Score',     unit: '%',    color: '#F59E0B', normalMin: 0,  normalMax: 30,  multiply: 100 },
      { key: 'physio_score', label: 'Physio Score',   unit: '',     color: '#10B981', normalMin: 0,  normalMax: 5   },
      { key: 'event_score',  label: 'Event Score',    unit: '',     color: '#F97316', normalMin: 0,  normalMax: 3   },
    ],
  },
  'tachy-brady': {
    title:    ' Tachy/Bradycardia',
    color:    '#EC4899',
    bgColor:  '#FCE7F3',
    endpoint: 'tachy-brady',
    graphs: [
      { key: 'heart_rate',    label: 'Heart Rate',    unit: 'bpm',  color: '#EC4899', normalMin: 60, normalMax: 100 },
      { key: 'spo2',          label: 'SpO2',          unit: '%',    color: '#3B82F6', normalMin: 95, normalMax: 100 },
      { key: 'risk_score',    label: 'Risk Score',    unit: '%',    color: '#F59E0B', normalMin: 0,  normalMax: 30,  multiply: 100 },
      { key: 'pulse_pressure',label: 'Pulse Pressure',unit: 'mmHg', color: '#10B981', normalMin: 30, normalMax: 50  },
      { key: 'shock_index',   label: 'Shock Index',   unit: '',     color: '#EF4444', normalMin: 0,  normalMax: 0.7 },
    ],
  },
};

const SEVERITY_COLORS = {
  Normal:   '#10B981',
  Mild:     '#F59E0B',
  Moderate: '#F97316',
  Severe:   '#EF4444',
  Critical: '#DC2626',
};

// ─── Mini Line Chart ──────────────────────────────────────────────────────────
const LineChart = ({ data, color, normalMin, normalMax, unit, multiply = 1 }) => {
  if (!data || data.length === 0) {
    return (
      <View style={[chartStyles.empty, { height: CHART_HEIGHT }]}>
        <Text style={chartStyles.emptyText}>No data yet</Text>
      </View>
    );
  }

  const values  = data.map(d => (d.value ?? 0) * multiply);
  const minVal  = Math.min(...values);
  const maxVal  = Math.max(...values);
  const range   = maxVal - minVal || 1;
  const padH    = 20;
  const padV    = 20;
  const chartW  = CHART_WIDTH - padH * 2;
  const chartH  = CHART_HEIGHT - padV * 2;

  const getX = (i) => padH + (i / Math.max(values.length - 1, 1)) * chartW;
  const getY = (v) => padV + chartH - ((v - minVal) / range) * chartH;

  // Normal range band
  const normMinY = padV + chartH - ((Math.min(normalMax, maxVal) - minVal) / range) * chartH;
  const normMaxY = padV + chartH - ((Math.max(normalMin, minVal) - minVal) / range) * chartH;

  // SVG path
  const points = values.map((v, i) => `${getX(i).toFixed(1)},${getY(v).toFixed(1)}`);
  const linePath = `M ${points.join(' L ')}`;

  // Area fill path
  const areaPath = `M ${getX(0).toFixed(1)},${(padV + chartH).toFixed(1)} L ${points.join(' L ')} L ${getX(values.length - 1).toFixed(1)},${(padV + chartH).toFixed(1)} Z`;

  return (
    <View style={{ width: CHART_WIDTH, height: CHART_HEIGHT + 30 }}>
      {/* SVG-like using absolute positioned views */}
      <View style={{ width: CHART_WIDTH, height: CHART_HEIGHT, position: 'relative', backgroundColor: '#F9FAFB', borderRadius: 8, overflow: 'hidden' }}>

        {/* Normal range band */}
        <View style={{
          position: 'absolute',
          left: padH,
          top: Math.min(normMinY, normMaxY),
          width: chartW,
          height: Math.abs(normMaxY - normMinY),
          backgroundColor: color + '15',
          borderTopWidth: 1,
          borderBottomWidth: 1,
          borderColor: color + '40',
        }} />

        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((fraction, i) => (
          <View key={i} style={{
            position: 'absolute',
            left: padH,
            top: padV + chartH * fraction,
            width: chartW,
            height: 1,
            backgroundColor: '#E5E7EB',
          }} />
        ))}

        {/* Data points connected by lines */}
        {values.map((v, i) => {
          if (i === 0) return null;
          const x1 = getX(i - 1), y1 = getY(values[i - 1]);
          const x2 = getX(i),     y2 = getY(v);
          const len = Math.sqrt((x2-x1)**2 + (y2-y1)**2);
          const angle = Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI;
          return (
            <View key={i} style={{
              position: 'absolute',
              left: x1,
              top: y1,
              width: len,
              height: 2,
              backgroundColor: color,
              transformOrigin: '0 50%',
              transform: [{ rotate: `${angle}deg` }],
            }} />
          );
        })}

        {/* Data dots */}
        {values.map((v, i) => (
          <View key={i} style={{
            position: 'absolute',
            left: getX(i) - 4,
            top:  getY(v) - 4,
            width: 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: color,
            borderWidth: 2,
            borderColor: '#FFF',
          }} />
        ))}

        {/* Y axis labels */}
        <Text style={{ position: 'absolute', left: 2, top: padV - 8, fontSize: 9, color: '#9CA3AF' }}>
          {(maxVal * multiply).toFixed(0)}
        </Text>
        <Text style={{ position: 'absolute', left: 2, top: padV + chartH - 8, fontSize: 9, color: '#9CA3AF' }}>
          {(minVal * multiply).toFixed(0)}
        </Text>
      </View>

      {/* X axis — dates */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: padH, marginTop: 4 }}>
        {data.length > 0 && (
          <>
            <Text style={{ fontSize: 9, color: '#9CA3AF' }}>
              {new Date(data[0].timestamp).toLocaleDateString('en', { month: 'short', day: 'numeric' })}
            </Text>
            {data.length > 2 && (
              <Text style={{ fontSize: 9, color: '#9CA3AF' }}>
                {new Date(data[Math.floor(data.length / 2)].timestamp).toLocaleDateString('en', { month: 'short', day: 'numeric' })}
              </Text>
            )}
            <Text style={{ fontSize: 9, color: '#9CA3AF' }}>
              {new Date(data[data.length - 1].timestamp).toLocaleDateString('en', { month: 'short', day: 'numeric' })}
            </Text>
          </>
        )}
      </View>
    </View>
  );
};

// ─── Graph Card ───────────────────────────────────────────────────────────────
const GraphCard = ({ graphConfig, historyData }) => {
  const { key, label, unit, color, normalMin, normalMax, multiply = 1 } = graphConfig;

  const chartData = historyData
    .filter(d => d[key] != null)
    .map(d => ({ value: d[key], timestamp: d.timestamp }));

  if (chartData.length === 0) return null;

  const latest    = chartData[chartData.length - 1]?.value * multiply;
  const prev      = chartData.length > 1 ? chartData[chartData.length - 2]?.value * multiply : null;
  const trend     = prev !== null ? (latest > prev ? 'up' : latest < prev ? 'down' : 'same') : 'same';
  const isNormal  = latest >= normalMin && latest <= normalMax;

  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;
  const trendColor = isNormal ? '#10B981' : '#EF4444';

  // Stats
  const vals   = chartData.map(d => d.value * multiply);
  const avgVal = (vals.reduce((s, v) => s + v, 0) / vals.length).toFixed(1);
  const minVal = Math.min(...vals).toFixed(1);
  const maxVal = Math.max(...vals).toFixed(1);

  return (
    <View style={styles.graphCard}>
      <View style={styles.graphHeader}>
        <View>
          <Text style={styles.graphLabel}>{label}</Text>
          <Text style={styles.graphUnit}>{unit}</Text>
        </View>
        <View style={styles.graphLatest}>
          <TrendIcon size={14} color={trendColor} />
          <Text style={[styles.graphLatestValue, { color }]}>
            {latest.toFixed(1)}
          </Text>
          <View style={[styles.normalBadge, { backgroundColor: isNormal ? '#D1FAE5' : '#FEE2E2' }]}>
            <Text style={[styles.normalBadgeText, { color: isNormal ? '#10B981' : '#EF4444' }]}>
              {isNormal ? 'Normal' : 'Abnormal'}
            </Text>
          </View>
        </View>
      </View>

      <LineChart
        data={chartData}
        color={color}
        normalMin={normalMin}
        normalMax={normalMax}
        unit={unit}
        multiply={multiply}
      />

      {/* Stats row */}
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Avg</Text>
          <Text style={[styles.statValue, { color }]}>{avgVal}</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Min</Text>
          <Text style={styles.statValue}>{minVal}</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Max</Text>
          <Text style={styles.statValue}>{maxVal}</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Normal Range</Text>
          <Text style={styles.statValue}>{normalMin}–{normalMax}</Text>
        </View>
      </View>
    </View>
  );
};

// ─── Severity Timeline ────────────────────────────────────────────────────────
const SeverityTimeline = ({ historyData }) => {
  if (!historyData || historyData.length === 0) return null;

  return (
    <View style={styles.timelineCard}>
      <Text style={styles.graphLabel}>Severity Timeline</Text>
      <Text style={styles.graphUnit}>Last {historyData.length} readings</Text>
      <View style={styles.timelineRow}>
        {historyData.slice(-20).map((d, i) => {
          const color = SEVERITY_COLORS[d.severity] || '#6B7280';
          return (
            <View key={i} style={styles.timelineDotWrapper}>
              <View style={[styles.timelineDot, { backgroundColor: color }]} />
              {i === 0 || i === historyData.slice(-20).length - 1 ? (
                <Text style={styles.timelineDateText}>
                  {new Date(d.timestamp).toLocaleDateString('en', { month: 'short', day: 'numeric' })}
                </Text>
              ) : null}
            </View>
          );
        })}
      </View>
      {/* Legend */}
      <View style={styles.legendRow}>
        {Object.entries(SEVERITY_COLORS).map(([label, color]) => (
          <View key={label} style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: color }]} />
            <Text style={styles.legendText}>{label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
};

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function DiseaseDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const diseaseKey = params.disease || 'hypertension';
  const severity   = params.severity || 'Normal';
  const riskScore  = params.riskScore ? parseFloat(params.riskScore) : null;

  const config = DISEASE_CONFIG[diseaseKey];

  const [loading,     setLoading]     = useState(true);
  const [historyData, setHistoryData] = useState([]);
  const [error,       setError]       = useState(null);

  useEffect(() => {
    fetchHistory();
  }, [diseaseKey]);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = await AsyncStorage.getItem('userToken');
      if (!token) return;

      const response = await fetch(
        `${API_BASE_URL}/api/vitals/disease-history/${config.endpoint}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await response.json();

      if (data.success) {
        setHistoryData(data.data || []);
      } else {
        setError('Could not load history data');
      }
    } catch (e) {
      setError('Network error: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  if (!config) {
    return (
      <SafeAreaView style={styles.container}>
        <Text>Invalid disease type</Text>
      </SafeAreaView>
    );
  }

  const sevColor = SEVERITY_COLORS[severity] || '#6B7280';

  return (
    <SafeAreaView style={styles.container}>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ChevronLeft size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{config.title}</Text>
        <View style={[styles.severityBadge, { backgroundColor: sevColor }]}>
          <Text style={styles.severityText}>{severity}</Text>
        </View>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={{ paddingBottom: 100, padding: 16 }}>

        {/* Summary Card */}
        <View style={[styles.summaryCard, { backgroundColor: config.bgColor, borderColor: config.color + '40' }]}>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Current Status</Text>
              <Text style={[styles.summaryValue, { color: sevColor }]}>{severity}</Text>
            </View>
            {riskScore !== null && (
              <>
                <View style={styles.summaryDivider} />
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>Risk Score</Text>
                  <Text style={[styles.summaryValue, { color: config.color }]}>{riskScore.toFixed(1)}%</Text>
                </View>
              </>
            )}
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Total Readings</Text>
              <Text style={[styles.summaryValue, { color: config.color }]}>{historyData.length}</Text>
            </View>
          </View>

          {/* Risk bar */}
          {riskScore !== null && (
            <View style={styles.riskBarContainer}>
              <View style={styles.riskBarBg}>
                <View style={[styles.riskBarFill, {
                  width: `${Math.min(riskScore, 100)}%`,
                  backgroundColor: sevColor,
                }]} />
              </View>
              <Text style={styles.riskBarLabel}>{riskScore.toFixed(1)}% Risk</Text>
            </View>
          )}
        </View>

        {/* Info Banner */}
        <View style={styles.infoBanner}>
          <Activity size={16} color={config.color} />
          <Text style={styles.infoText}>
            Graphs show data from {historyData.length > 0
              ? `${new Date(historyData[0]?.timestamp).toLocaleDateString('en', { month: 'long', day: 'numeric', year: 'numeric' })} to now`
              : 'last 3 months'}
            . Green band = normal range.
          </Text>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={config.color} />
            <Text style={[styles.loadingText, { color: config.color }]}>Loading history...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <AlertTriangle size={32} color="#EF4444" />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={fetchHistory}>
              <Text style={styles.retryBtnText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : historyData.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>No History Yet</Text>
            <Text style={styles.emptySubtitle}>
              Graphs will appear here as your health data is collected over time.
              Keep the app running and your watch connected.
            </Text>
          </View>
        ) : (
          <>
            {/* Severity Timeline */}
            <SeverityTimeline historyData={historyData} />

            {/* Feature Graphs */}
            <Text style={styles.sectionTitle}>Feature Trends</Text>
            <Text style={styles.sectionSubtitle}>
              Each graph shows how a key health indicator has changed over time.
              The shaded band represents the normal range.
            </Text>

            {config.graphs.map((graphConfig) => (
              <GraphCard
                key={graphConfig.key}
                graphConfig={graphConfig}
                historyData={historyData}
              />
            ))}
          </>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Chart Styles ─────────────────────────────────────────────────────────────
const chartStyles = StyleSheet.create({
  empty:     { justifyContent: 'center', alignItems: 'center', backgroundColor: '#F9FAFB', borderRadius: 8 },
  emptyText: { fontSize: 13, color: '#9CA3AF' },
});

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container:   { flex: 1, backgroundColor: '#F8FAFC' },
  scrollView:  { flex: 1 },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#E5E7EB',
  },
  backButton:   { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  headerTitle:  { fontSize: 18, fontWeight: 'bold', color: '#111827', flex: 1, marginLeft: 8 },
  severityBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
  severityText:  { color: '#FFF', fontSize: 12, fontWeight: 'bold' },

  summaryCard: {
    borderRadius: 16, padding: 16, marginBottom: 12,
    borderWidth: 1,
  },
  summaryRow:     { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 12 },
  summaryItem:    { alignItems: 'center', flex: 1 },
  summaryLabel:   { fontSize: 11, color: '#6B7280', marginBottom: 4 },
  summaryValue:   { fontSize: 20, fontWeight: 'bold' },
  summaryDivider: { width: 1, backgroundColor: '#E5E7EB', marginVertical: 4 },

  riskBarContainer: { marginTop: 4 },
  riskBarBg:  { height: 8, backgroundColor: '#E5E7EB', borderRadius: 4, overflow: 'hidden', marginBottom: 4 },
  riskBarFill:{ height: 8, borderRadius: 4 },
  riskBarLabel: { fontSize: 11, color: '#6B7280', textAlign: 'right' },

  infoBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#F0F9FF', borderRadius: 8, padding: 10, marginBottom: 16,
  },
  infoText: { fontSize: 12, color: '#0369A1', flex: 1, lineHeight: 18 },

  loadingContainer: { alignItems: 'center', paddingVertical: 60 },
  loadingText:      { marginTop: 12, fontSize: 14 },

  errorContainer: { alignItems: 'center', paddingVertical: 40 },
  errorText:      { fontSize: 14, color: '#6B7280', marginTop: 12, textAlign: 'center' },
  retryBtn:       { marginTop: 16, backgroundColor: '#EF4444', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },
  retryBtnText:   { color: '#FFF', fontWeight: '600' },

  emptyContainer: { alignItems: 'center', paddingVertical: 60, paddingHorizontal: 24 },
  emptyTitle:     { fontSize: 18, fontWeight: 'bold', color: '#111827', marginBottom: 8 },
  emptySubtitle:  { fontSize: 14, color: '#6B7280', textAlign: 'center', lineHeight: 22 },

  sectionTitle:    { fontSize: 16, fontWeight: 'bold', color: '#111827', marginBottom: 4, marginTop: 8 },
  sectionSubtitle: { fontSize: 12, color: '#6B7280', marginBottom: 12, lineHeight: 18 },

  graphCard: {
    backgroundColor: '#FFF', borderRadius: 12, padding: 14,
    marginBottom: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  graphHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 10,
  },
  graphLabel:       { fontSize: 14, fontWeight: '700', color: '#111827' },
  graphUnit:        { fontSize: 11, color: '#9CA3AF', marginTop: 2 },
  graphLatest:      { flexDirection: 'row', alignItems: 'center', gap: 6 },
  graphLatestValue: { fontSize: 22, fontWeight: 'bold' },
  normalBadge:      { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  normalBadgeText:  { fontSize: 10, fontWeight: '700' },

  statsRow:    { flexDirection: 'row', marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#F3F4F6' },
  statItem:    { flex: 1, alignItems: 'center' },
  statDivider: { width: 1, backgroundColor: '#F3F4F6' },
  statLabel:   { fontSize: 10, color: '#9CA3AF', marginBottom: 2 },
  statValue:   { fontSize: 13, fontWeight: '600', color: '#111827' },

  timelineCard: {
    backgroundColor: '#FFF', borderRadius: 12, padding: 14,
    marginBottom: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  timelineRow:     { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 10, marginBottom: 8 },
  timelineDotWrapper: { alignItems: 'center' },
  timelineDot:     { width: 12, height: 12, borderRadius: 6 },
  timelineDateText: { fontSize: 8, color: '#9CA3AF', marginTop: 2 },
  legendRow:       { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  legendItem:      { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendDot:       { width: 8, height: 8, borderRadius: 4 },
  legendText:      { fontSize: 10, color: '#6B7280' },
});