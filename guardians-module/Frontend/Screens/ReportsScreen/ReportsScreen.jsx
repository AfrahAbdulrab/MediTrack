import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, StatusBar, Alert, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../../context/AppContext';

function MiniBarGraph({ data, color }) {
  if (!data || data.length === 0) return null;
  const max = Math.max(...data) || 1;
  return (
    <View style={styles.miniGraph}>
      {data.map((val, i) => (
        <View key={i} style={styles.miniBarWrapper}>
          <View style={[styles.miniBar, {
            height: `${(val / max) * 100}%`,
            backgroundColor: color,
          }]} />
        </View>
      ))}
    </View>
  );
}

export default function ReportsScreen({ navigation }) {
  // ✅ Real data AppContext se
  const { patient, monthlyReports, diseases, loading } = useApp();
  const [expandedMonth, setExpandedMonth] = useState(null);

  const handleDownload = (type) => {
    Alert.alert('Download Started', `${type} report PDF is being generated.`);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2979ff" />
        <Text style={styles.loadingText}>Loading reports...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Reports</Text>
          <Text style={styles.headerSub}>{patient?.name || '--'}</Text>
        </View>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Download section */}
        <Text style={styles.sectionTitle}>DOWNLOAD REPORT</Text>
        <View style={styles.card}>
          {[
            { label: 'Last 24 hours', type: '24h' },
            { label: 'Last 30 days', type: '30d' },
            { label: 'Since watch connected', type: 'all' },
          ].map((item, i, arr) => (
            <TouchableOpacity
              key={item.type}
              style={[styles.downloadRow, i === arr.length - 1 && { borderBottomWidth: 0 }]}
              onPress={() => handleDownload(item.label)}
            >
              <Text style={styles.downloadLabel}>{item.label}</Text>
              <View style={styles.downloadRight}>
                <Ionicons name="arrow-down" size={14} color="#2979ff" />
                <Text style={styles.downloadPdf}> PDF</Text>
              </View>
            </TouchableOpacity>
          ))}
          <TouchableOpacity
            style={[styles.downloadRow, { borderBottomWidth: 0 }]}
            onPress={() => Alert.alert('Custom Range', 'Date picker coming soon!')}
          >
            <Text style={styles.downloadLabel}>Custom date range</Text>
            <View style={styles.downloadRight}>
              <Text style={styles.selectText}>› Select</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* ✅ Monthly summaries — real data */}
        <Text style={styles.sectionTitle}>MONTHLY SUMMARIES</Text>
        <View style={styles.card}>
          {monthlyReports.length === 0 ? (
            <View style={styles.emptyRow}>
              <Text style={styles.emptyText}>Abhi koi monthly data nahi hai</Text>
            </View>
          ) : (
            monthlyReports.map((m, i) => (
              <View key={m.month}>
                <TouchableOpacity
                  style={[
                    styles.monthRow,
                    i === monthlyReports.length - 1 && expandedMonth !== m.month && { borderBottomWidth: 0 },
                  ]}
                  onPress={() => setExpandedMonth(expandedMonth === m.month ? null : m.month)}
                >
                  <View>
                    <Text style={styles.monthName}>{m.month}</Text>
                    <Text style={styles.monthSub}>
                      {m.critical} critical • {m.moderate} moderate alerts
                    </Text>
                  </View>
                  <View style={styles.viewBtn}>
                    <Ionicons
                      name={expandedMonth === m.month ? 'arrow-up' : 'arrow-down'}
                      size={14} color="#2979ff"
                    />
                    <Text style={styles.viewText}> View</Text>
                  </View>
                </TouchableOpacity>

                {expandedMonth === m.month && (
                  <View style={styles.graphExpanded}>
                    <Text style={styles.graphTitle}>Alerts per day — {m.month}</Text>
                    <MiniBarGraph
                      data={m.data}
                      color={m.critical > 0 ? '#e74c3c' : '#2979ff'}
                    />
                    <View style={styles.xAxisMonth}>
                      <Text style={styles.axisLabel}>1</Text>
                      <Text style={styles.axisLabel}>10</Text>
                      <Text style={styles.axisLabel}>20</Text>
                      <Text style={styles.axisLabel}>30</Text>
                    </View>
                    <View style={styles.monthStats}>
                      <View style={styles.statBox}>
                        <Text style={styles.statNum}>{m.totalReadings}</Text>
                        <Text style={styles.statLabel}>Total Readings</Text>
                      </View>
                      <View style={styles.statBox}>
                        <Text style={[styles.statNum, { color: '#e74c3c' }]}>{m.critical}</Text>
                        <Text style={styles.statLabel}>Critical</Text>
                      </View>
                      <View style={styles.statBox}>
                        <Text style={[styles.statNum, { color: '#e67e22' }]}>{m.moderate}</Text>
                        <Text style={styles.statLabel}>Moderate</Text>
                      </View>
                    </View>
                  </View>
                )}
              </View>
            ))
          )}
        </View>

        {/* ✅ Disease detections — real data */}
        <Text style={styles.sectionTitle}>DISEASE DETECTIONS</Text>
        <View style={styles.card}>
          {diseases.length === 0 ? (
            <View style={styles.emptyRow}>
              <Text style={styles.emptyText}>Koi disease detect nahi hui</Text>
            </View>
          ) : (
            diseases.map((d, i) => (
              <View
                key={d.name}
                style={[styles.diseaseRow, i === diseases.length - 1 && { borderBottomWidth: 0 }]}
              >
                <Text style={styles.diseaseName}>{d.name}</Text>
                <View style={[styles.badge, { backgroundColor: d.badgeBg }]}>
                  <Text style={[styles.badgeText, { color: d.badgeColor }]}>{d.badge}</Text>
                </View>
              </View>
            ))
          )}
        </View>

        <View style={{ height: 30 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f7' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f5f5f7' },
  loadingText: { marginTop: 12, fontSize: 14, color: '#888' },
  header: {
    paddingTop: 50, paddingBottom: 14, paddingHorizontal: 20,
    backgroundColor: '#fff', borderBottomWidth: 0.5, borderColor: '#e0e0e0',
  },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#111' },
  headerSub: { fontSize: 12, color: '#888', marginTop: 2 },
  scroll: { flex: 1, paddingHorizontal: 16, paddingTop: 14 },
  sectionTitle: {
    fontSize: 11, fontWeight: '600', color: '#999',
    letterSpacing: 0.5, marginBottom: 10, marginTop: 4,
  },
  card: {
    backgroundColor: '#fff', borderRadius: 14, paddingHorizontal: 14,
    marginBottom: 16, borderWidth: 0.5, borderColor: '#e8e8e8',
  },
  downloadRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 14, borderBottomWidth: 0.5, borderColor: '#f0f0f0',
  },
  downloadLabel: { fontSize: 14, color: '#111' },
  downloadRight: { flexDirection: 'row', alignItems: 'center' },
  downloadPdf: { fontSize: 13, color: '#2979ff', fontWeight: '600' },
  selectText: { fontSize: 13, color: '#2979ff', fontWeight: '600' },
  monthRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 14, borderBottomWidth: 0.5, borderColor: '#f0f0f0',
  },
  monthName: { fontSize: 14, fontWeight: '600', color: '#111' },
  monthSub: { fontSize: 12, color: '#888', marginTop: 2 },
  viewBtn: { flexDirection: 'row', alignItems: 'center' },
  viewText: { fontSize: 13, color: '#2979ff', fontWeight: '600' },
  graphExpanded: { paddingVertical: 12, borderBottomWidth: 0.5, borderColor: '#f0f0f0' },
  graphTitle: { fontSize: 11, color: '#888', marginBottom: 10 },
  miniGraph: { flexDirection: 'row', height: 80, alignItems: 'flex-end', gap: 2 },
  miniBarWrapper: { flex: 1, height: '100%', justifyContent: 'flex-end' },
  miniBar: { width: '100%', borderRadius: 2, minHeight: 3 },
  xAxisMonth: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  axisLabel: { fontSize: 10, color: '#bbb' },
  monthStats: {
    flexDirection: 'row', justifyContent: 'space-around',
    marginTop: 12, paddingTop: 12, borderTopWidth: 0.5, borderColor: '#f0f0f0',
  },
  statBox: { alignItems: 'center' },
  statNum: { fontSize: 20, fontWeight: '700', color: '#111' },
  statLabel: { fontSize: 11, color: '#888', marginTop: 2 },
  diseaseRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 14, borderBottomWidth: 0.5, borderColor: '#f0f0f0',
  },
  diseaseName: { fontSize: 14, color: '#111' },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  badgeText: { fontSize: 11, fontWeight: '600' },
  emptyRow: { paddingVertical: 20, alignItems: 'center' },
  emptyText: { fontSize: 13, color: '#aaa' },
});