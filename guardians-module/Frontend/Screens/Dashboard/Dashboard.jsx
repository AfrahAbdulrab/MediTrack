import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, StatusBar, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../../context/AppContext';

const TABS = ['Overview', 'Vitals', 'Location'];
const VITALS_ORDER = ['heartRate', 'spo2', 'bloodPressure', 'bloodSugar', 'temperature', 'steps'];

export default function Dashboard({ navigation }) {
  const { vitals, patient, guardian, watchConnected, lastSynced, overallStatus, alerts, loading } = useApp();
  const [activeTab, setActiveTab] = useState('Overview');

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  // Loading screen
  if (loading || !vitals || !guardian || !patient) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2979ff" />
        <Text style={styles.loadingText}>Loading health data...</Text>
      </View>
    );
  }

  const latestAlert = alerts[0];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* Top bar */}
      <View style={styles.topBar}>
        <View>
          <Text style={styles.greeting}>{getGreeting()}, {guardian.name.split(' ')[0]}</Text>
          <Text style={styles.monitoringText}>Monitoring {patient.name}</Text>
        </View>
        <TouchableOpacity
          style={styles.avatar}
          onPress={() => navigation.navigate('Profile')}
        >
          <Text style={styles.avatarText}>{guardian.initials}</Text>
        </TouchableOpacity>
      </View>

      {/* Tab bar */}
      <View style={styles.tabBar}>
        {TABS.map(t => (
          <TouchableOpacity key={t} style={styles.tabItem} onPress={() => setActiveTab(t)}>
            <Text style={[styles.tabText, activeTab === t && styles.tabTextActive]}>{t}</Text>
            {activeTab === t && <View style={styles.tabUnderline} />}
          </TouchableOpacity>
        ))}
      </View>

      {/* Overview Tab */}
      {activeTab === 'Overview' && (
        <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
          {/* Status card */}
          <View style={styles.card}>
            <View style={styles.statusRow}>
              <View>
                <Text style={styles.statusLabel}>Overall status</Text>
                <Text style={[
                  styles.statusValue,
                  { color: overallStatus === 'Critical' ? '#e74c3c' : overallStatus === 'Moderate' ? '#e67e22' : '#27ae60' }
                ]}>
                  {overallStatus}
                </Text>
              </View>
              <View style={[styles.badge, {
                backgroundColor: overallStatus === 'Critical' ? '#fdecea' : overallStatus === 'Moderate' ? '#fff3e0' : '#e8f8f0'
              }]}>
                <Text style={[styles.badgeText, {
                  color: overallStatus === 'Critical' ? '#e74c3c' : overallStatus === 'Moderate' ? '#b36200' : '#27ae60'
                }]}>
                  {overallStatus}
                </Text>
              </View>
            </View>
            <View style={styles.watchRow}>
              <Text style={styles.watchText}>
                Watch: <Text style={watchConnected ? styles.watchConnected : styles.watchDisconnected}>
                  {watchConnected ? 'Connected' : 'Disconnected'}
                </Text>
              </Text>
              <Text style={styles.syncedText}>
                Synced: <Text style={{ fontWeight: '600' }}>{lastSynced}</Text>
              </Text>
            </View>
          </View>

          {/* Quick vitals */}
          <Text style={styles.sectionTitle}>QUICK VITALS — TAP TO SEE DETAILS</Text>
          <View style={styles.vitalsGrid}>
            {VITALS_ORDER.map(key => {
              const v = vitals[key];
              if (!v) return null;
              return (
                <TouchableOpacity
                  key={key}
                  style={styles.vitalCard}
                  onPress={() => navigation.navigate('VitalDetail', { vitalKey: key })}
                  activeOpacity={0.75}
                >
                  <View style={styles.vitalLabelRow}>
                    <View style={[styles.vitalDot, { backgroundColor: v.dotColor }]} />
                    <Text style={styles.vitalLabel}>{v.label}</Text>
                  </View>
                  <Text style={styles.vitalNum}>
                    {String(v.current)}
                    <Text style={styles.vitalUnit}> {v.unit}</Text>
                  </Text>
                  <Text style={[styles.vitalStatus, { color: v.statusColor }]}>{v.status}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Latest Alert */}
          <Text style={styles.sectionTitle}>LATEST ALERT</Text>
          {latestAlert && (
            <TouchableOpacity
              style={styles.alertCard}
              onPress={() => navigation.navigate('Alerts')}
              activeOpacity={0.8}
            >
              <View style={[styles.alertIcon, { backgroundColor: latestAlert.iconBg }]}>
                <Text style={[styles.alertIconText, { color: latestAlert.iconColor }]}>
                  {latestAlert.icon}
                </Text>
              </View>
              <View style={styles.alertBody}>
                <Text style={styles.alertTitle}>{latestAlert.title}</Text>
                <Text style={styles.alertSub}>{latestAlert.sub}</Text>
              </View>
              <View style={[styles.badge, { backgroundColor: latestAlert.badgeBg }]}>
                <Text style={[styles.badgeText, { color: latestAlert.badgeColor }]}>
                  {latestAlert.badge}
                </Text>
              </View>
            </TouchableOpacity>
          )}
          <View style={{ height: 24 }} />
        </ScrollView>
      )}

      {/* Vitals Tab */}
      {activeTab === 'Vitals' && (
        <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
          <Text style={styles.sectionTitle}>ALL VITALS — LIVE DATA</Text>
          <View style={styles.card}>
            {VITALS_ORDER.map((key, idx) => {
              const v = vitals[key];
              if (!v) return null;
              return (
                <TouchableOpacity
                  key={key}
                  style={[
                    styles.vitalsListItem,
                    idx === VITALS_ORDER.length - 1 && { borderBottomWidth: 0 },
                  ]}
                  onPress={() => navigation.navigate('VitalDetail', { vitalKey: key })}
                  activeOpacity={0.75}
                >
                  <View style={[styles.vitalsListIcon, { backgroundColor: v.iconBg }]}>
                    <Text style={[styles.vitalsListIconText, { color: v.iconColor }]}>{v.abbr}</Text>
                  </View>
                  <View style={styles.vitalsListBody}>
                    <Text style={styles.vitalsListName}>{v.label}</Text>
                    <Text style={styles.vitalsListVal}>
                      {String(v.current)}{v.unit ? ` ${v.unit}` : ''} —{' '}
                      <Text style={{ color: v.statusColor }}>{v.status}</Text>
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color="#ccc" />
                </TouchableOpacity>
              );
            })}
          </View>
          <View style={{ height: 24 }} />
        </ScrollView>
      )}

      {/* Location Tab */}
      {activeTab === 'Location' && (
        <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
          <Text style={styles.sectionTitle}>CURRENT LOCATION — {patient.name}</Text>
          <View style={styles.mapCard}>
            <View style={styles.mapPlaceholder}>
              <View style={styles.mapPinOuter}>
                <View style={styles.mapPinInner} />
              </View>
              <Text style={styles.mapPlaceholderText}>Map View</Text>
            </View>
            <View style={styles.mapInfo}>
              <View>
                <Text style={styles.mapCity}>Rawalpindi, Punjab</Text>
                <Text style={styles.mapCoords}>33.5651° N, 73.0169° E</Text>
              </View>
              <Text style={styles.mapTime}>
                {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </View>
          </View>

          <Text style={[styles.sectionTitle, { marginTop: 16 }]}>LOCATION HISTORY TODAY</Text>
          <View style={styles.card}>
            {[
              { time: '9:15 AM', place: 'Home — Rawalpindi' },
              { time: '11:30 AM', place: 'Shifa Hospital' },
              { time: '1:45 PM', place: 'Commercial Market' },
              { time: '3:47 PM', place: 'Rawalpindi — Current' },
            ].map((item, i, arr) => (
              <View
                key={i}
                style={[styles.locRow, i === arr.length - 1 && { borderBottomWidth: 0 }]}
              >
                <Text style={styles.locTime}>{item.time}</Text>
                <Text style={[
                  styles.locPlace,
                  item.place.includes('Current') && { color: '#2979ff', fontWeight: '600' },
                ]}>
                  {item.place}
                </Text>
              </View>
            ))}
          </View>
          <View style={{ height: 24 }} />
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f7' },
  loadingContainer: {
    flex: 1, justifyContent: 'center',
    alignItems: 'center', backgroundColor: '#f5f5f7',
  },
  loadingText: { marginTop: 12, fontSize: 14, color: '#888' },
  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 50, paddingBottom: 14, backgroundColor: '#fff',
  },
  greeting: { fontSize: 18, fontWeight: '700', color: '#111' },
  monitoringText: { fontSize: 12, color: '#888', marginTop: 2 },
  avatar: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: '#d0f0e0', alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontSize: 13, fontWeight: '600', color: '#1a7a50' },
  tabBar: {
    flexDirection: 'row', backgroundColor: '#fff',
    borderBottomWidth: 0.5, borderColor: '#e0e0e0',
  },
  tabItem: { flex: 1, alignItems: 'center', paddingVertical: 12 },
  tabText: { fontSize: 14, color: '#888' },
  tabTextActive: { color: '#2979ff', fontWeight: '600' },
  tabUnderline: {
    position: 'absolute', bottom: 0, height: 2,
    width: '80%', backgroundColor: '#2979ff', borderRadius: 2,
  },
  scroll: { flex: 1, paddingHorizontal: 16, paddingTop: 14 },
  card: {
    backgroundColor: '#fff', borderRadius: 14, padding: 14,
    marginBottom: 12, borderWidth: 0.5, borderColor: '#e8e8e8',
  },
  statusRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  statusLabel: { fontSize: 11, color: '#888' },
  statusValue: { fontSize: 20, fontWeight: '700', marginTop: 2 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  badgeText: { fontSize: 11, fontWeight: '600' },
  watchRow: { flexDirection: 'row', gap: 16, marginTop: 10 },
  watchText: { fontSize: 12, color: '#555' },
  watchConnected: { color: '#27ae60', fontWeight: '600' },
  watchDisconnected: { color: '#e74c3c', fontWeight: '600' },
  syncedText: { fontSize: 12, color: '#555' },
  sectionTitle: {
    fontSize: 11, fontWeight: '600', color: '#999',
    letterSpacing: 0.5, marginBottom: 10, marginTop: 4,
  },
  vitalsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 12 },
  vitalCard: {
    width: '47.5%', backgroundColor: '#fff', borderRadius: 14,
    padding: 12, borderWidth: 0.5, borderColor: '#e8e8e8',
  },
  vitalLabelRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  vitalDot: { width: 7, height: 7, borderRadius: 4, marginRight: 5 },
  vitalLabel: { fontSize: 11, color: '#888' },
  vitalNum: { fontSize: 22, fontWeight: '700', color: '#111' },
  vitalUnit: { fontSize: 12, fontWeight: '400', color: '#888' },
  vitalStatus: { fontSize: 11, marginTop: 3 },
  alertCard: {
    backgroundColor: '#fff', borderRadius: 14, padding: 12,
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderWidth: 0.5, borderColor: '#e8e8e8',
  },
  alertIcon: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
  },
  alertIconText: { fontSize: 16, fontWeight: '700' },
  alertBody: { flex: 1 },
  alertTitle: { fontSize: 13, fontWeight: '600', color: '#111' },
  alertSub: { fontSize: 11, color: '#888', marginTop: 2 },
  vitalsListItem: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 13,
    borderBottomWidth: 0.5, borderColor: '#f0f0f0',
  },
  vitalsListIcon: {
    width: 38, height: 38, borderRadius: 19,
    alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  vitalsListIconText: { fontSize: 12, fontWeight: '700' },
  vitalsListBody: { flex: 1 },
  vitalsListName: { fontSize: 14, fontWeight: '600', color: '#111' },
  vitalsListVal: { fontSize: 12, color: '#888', marginTop: 2 },
  mapCard: {
    backgroundColor: '#fff', borderRadius: 14, overflow: 'hidden',
    marginBottom: 12, borderWidth: 0.5, borderColor: '#e8e8e8',
  },
  mapPlaceholder: {
    height: 160, backgroundColor: '#dce8f8',
    alignItems: 'center', justifyContent: 'center',
  },
  mapPinOuter: {
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: 'rgba(41,121,255,0.2)',
    alignItems: 'center', justifyContent: 'center', marginBottom: 6,
  },
  mapPinInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#2979ff' },
  mapPlaceholderText: { fontSize: 13, color: '#5570aa' },
  mapInfo: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'flex-end', padding: 12,
  },
  mapCity: { fontSize: 14, fontWeight: '600', color: '#111' },
  mapCoords: { fontSize: 11, color: '#888', marginTop: 2 },
  mapTime: { fontSize: 13, color: '#888' },
  locRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 11, borderBottomWidth: 0.5, borderColor: '#f0f0f0',
  },
  locTime: { fontSize: 13, color: '#888' },
  locPlace: { fontSize: 13, color: '#111' },
});