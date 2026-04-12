import React from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, StatusBar, Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../../context/AppContext';

const { width } = Dimensions.get('window');
const GRAPH_WIDTH = width - 48;
const GRAPH_HEIGHT = 120;

function SimpleGraph({ data, color }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const points = data.map((val, i) => ({
    x: (i / (data.length - 1)) * GRAPH_WIDTH,
    y: GRAPH_HEIGHT - ((val - min) / range) * GRAPH_HEIGHT,
  }));

  const pathD = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`)
    .join(' ');

  const areaD = `${pathD} L ${GRAPH_WIDTH} ${GRAPH_HEIGHT} L 0 ${GRAPH_HEIGHT} Z`;

  return (
    <View style={{ width: GRAPH_WIDTH, height: GRAPH_HEIGHT + 20 }}>
      <svg width={GRAPH_WIDTH} height={GRAPH_HEIGHT}>
        <defs>
          <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.3" />
            <stop offset="100%" stopColor={color} stopOpacity="0.02" />
          </linearGradient>
        </defs>
        <path d={areaD} fill="url(#grad)" />
        <path d={pathD} stroke={color} strokeWidth="2.5" fill="none" strokeLinecap="round" />
      </svg>
    </View>
  );
}

export default function VitalDetailScreen({ navigation, route }) {
  const { vitalKey } = route.params;
  const { vitals } = useApp();
  const v = vitals[vitalKey];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color="#111" />
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>{v.label}</Text>
          <Text style={styles.headerSub}>Last updated 2 min ago</Text>
        </View>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Current value */}
        <View style={styles.currentCard}>
          <Text style={styles.currentLabel}>Current</Text>
          <View style={styles.currentRow}>
            <Text style={[styles.currentValue, { color: v.statusColor }]}>
              {String(v.current)}
            </Text>
            <Text style={styles.currentUnit}> {v.unit}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: v.iconBg }]}>
            <Text style={[styles.statusBadgeText, { color: v.statusColor }]}>{v.status}</Text>
          </View>
        </View>

        {/* Min / Avg / Max */}
        <View style={styles.statsRow}>
          {[
            { label: 'Min today', value: v.min, color: '#27ae60' },
            { label: 'Avg today', value: v.avg, color: '#111' },
            { label: 'Max today', value: v.max, color: '#e74c3c' },
          ].map((s, i) => (
            <View key={i} style={styles.statItem}>
              <Text style={[styles.statValue, { color: s.color }]}>{String(s.value)}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Graph */}
        <View style={styles.graphCard}>
          <Text style={styles.sectionTitle}>24-HOUR TREND</Text>
          <View style={styles.graphArea}>
            {/* Y axis labels */}
            <View style={styles.yAxis}>
              <Text style={styles.axisLabel}>{v.max}</Text>
              <Text style={styles.axisLabel}>{v.min}</Text>
            </View>
            {/* Simple line graph using Views */}
            <View style={styles.graphLines}>
              {v.graphData.map((val, i) => {
                const maxVal = Math.max(...v.graphData);
                const minVal = Math.min(...v.graphData);
                const range = maxVal - minVal || 1;
                const heightPct = ((val - minVal) / range) * 100;
                return (
                  <View key={i} style={styles.barWrapper}>
                    <View style={styles.barBg}>
                      <View
                        style={[
                          styles.barFill,
                          {
                            height: `${heightPct}%`,
                            backgroundColor: v.statusColor + '40',
                            borderTopColor: v.statusColor,
                          },
                        ]}
                      />
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
          {/* X axis */}
          <View style={styles.xAxis}>
            {v.graphLabels.map((l, i) => (
              <Text key={i} style={styles.axisLabel}>{l}</Text>
            ))}
          </View>
        </View>

        {/* Recent readings */}
        <Text style={styles.sectionTitle}>RECENT READINGS</Text>
        <View style={styles.card}>
          {v.readings.map((r, i) => (
            <View
              key={i}
              style={[
                styles.readingRow,
                i === v.readings.length - 1 && { borderBottomWidth: 0 },
              ]}
            >
              <Text style={styles.readingTime}>{r.time}</Text>
              <Text style={[styles.readingVal, { color: r.color }]}>
                {String(r.value)} {v.unit} — {r.status}
              </Text>
            </View>
          ))}
        </View>
        <View style={{ height: 30 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f7' },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingTop: 50, paddingBottom: 14, paddingHorizontal: 16,
    backgroundColor: '#fff', borderBottomWidth: 0.5, borderColor: '#e0e0e0',
  },
  backBtn: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: '#f5f5f7', alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#111' },
  headerSub: { fontSize: 11, color: '#888', marginTop: 2 },
  scroll: { flex: 1, paddingHorizontal: 16, paddingTop: 16 },
  currentCard: {
    backgroundColor: '#fff', borderRadius: 16, padding: 20,
    alignItems: 'center', marginBottom: 12,
    borderWidth: 0.5, borderColor: '#e8e8e8',
  },
  currentLabel: { fontSize: 12, color: '#888', marginBottom: 6 },
  currentRow: { flexDirection: 'row', alignItems: 'flex-end' },
  currentValue: { fontSize: 56, fontWeight: '800', lineHeight: 60 },
  currentUnit: { fontSize: 18, color: '#888', marginBottom: 8 },
  statusBadge: { paddingHorizontal: 14, paddingVertical: 5, borderRadius: 20, marginTop: 8 },
  statusBadgeText: { fontSize: 12, fontWeight: '600' },
  statsRow: {
    flexDirection: 'row', backgroundColor: '#fff', borderRadius: 14,
    marginBottom: 12, borderWidth: 0.5, borderColor: '#e8e8e8', overflow: 'hidden',
  },
  statItem: {
    flex: 1, alignItems: 'center', paddingVertical: 14,
    borderRightWidth: 0.5, borderColor: '#f0f0f0',
  },
  statValue: { fontSize: 20, fontWeight: '700' },
  statLabel: { fontSize: 11, color: '#888', marginTop: 3 },
  graphCard: {
    backgroundColor: '#fff', borderRadius: 14, padding: 14,
    marginBottom: 16, borderWidth: 0.5, borderColor: '#e8e8e8',
  },
  sectionTitle: {
    fontSize: 11, fontWeight: '600', color: '#999',
    letterSpacing: 0.5, marginBottom: 12,
  },
  graphArea: { flexDirection: 'row', height: 100 },
  yAxis: { justifyContent: 'space-between', marginRight: 6, paddingVertical: 2 },
  axisLabel: { fontSize: 10, color: '#bbb' },
  graphLines: {
    flex: 1, flexDirection: 'row', alignItems: 'flex-end',
    gap: 3, height: 100,
  },
  barWrapper: { flex: 1, height: '100%', justifyContent: 'flex-end' },
  barBg: { width: '100%', height: '100%', justifyContent: 'flex-end' },
  barFill: { width: '100%', borderTopWidth: 2, borderRadius: 2 },
  xAxis: {
    flexDirection: 'row', justifyContent: 'space-between', marginTop: 6,
  },
  card: {
    backgroundColor: '#fff', borderRadius: 14, paddingHorizontal: 14,
    borderWidth: 0.5, borderColor: '#e8e8e8', marginBottom: 12,
  },
  readingRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingVertical: 12, borderBottomWidth: 0.5, borderColor: '#f0f0f0',
  },
  readingTime: { fontSize: 13, color: '#888' },
  readingVal: { fontSize: 13, fontWeight: '500' },
});