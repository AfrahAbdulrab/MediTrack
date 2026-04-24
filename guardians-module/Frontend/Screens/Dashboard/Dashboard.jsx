import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, StatusBar, ActivityIndicator, Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../../context/AppContext';
import { authFetch } from '../../context/api';

const TABS = ['Overview', 'Vitals', 'Location'];
const VITALS_ORDER = ['heartRate', 'spo2', 'bloodPressure', 'bloodSugar', 'temperature', 'steps'];

// Disease name display mapping
const DISEASE_DISPLAY_NAMES = {
  'Hypertension':           'Hypertension',
  'Sleep Apnea':            'Sleep Apnea',
  'Tachycardia':            'Tachycardia',
  'Bradycardia':            'Bradycardia',
  'Tachycardia/Bradycardia':'Tachycardia / Bradycardia',
};

const DISEASE_ICONS = {
  'Hypertension':            '🫀',
  'Sleep Apnea':             '😴',
  'Tachycardia':             '⚡',
  'Bradycardia':             '🐢',
  'Tachycardia/Bradycardia': '⚡',
};

export default function Dashboard({ navigation }) {
  const { vitals, patient, guardian, watchConnected, lastSynced, overallStatus, alerts, diseases, loading } = useApp();
  const [activeTab, setActiveTab] = useState('Overview');
  const [locationData, setLocationData] = useState({
    city: 'Fetching...',
    region: '',
    coords: { latitude: null, longitude: null },
  });
  const [locationHistory, setLocationHistory] = useState([]);
  const [locationLoading, setLocationLoading] = useState(true);

  useEffect(() => {
    const fetchLocation = async () => {
      try {
        setLocationLoading(true);
        const data = await authFetch('/api/guardian/vitals/location');

        if (data?.success && data?.data) {
          const { latitude, longitude, city, region, timestamp } = data.data;

          setLocationData({
            city:   city   || 'Unknown',
            region: region || '',
            coords: { latitude, longitude },
          });

          const time = new Date(timestamp).toLocaleTimeString([], {
            hour: '2-digit', minute: '2-digit',
          });
          setLocationHistory([
            { time, place: `${city || 'Unknown'} — Last Known Location` },
          ]);
        } else {
          setLocationData({ city: 'Location not available', region: '', coords: {} });
          setLocationHistory([]);
        }
      } catch (err) {
        console.log('⚠️ Location fetch error:', err.message);
        setLocationData({ city: 'Unavailable', region: '', coords: {} });
      } finally {
        setLocationLoading(false);
      }
    };

    fetchLocation();
  }, []);

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  if (loading || !guardian) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2979ff" />
        <Text style={styles.loadingText}>Loading health data...</Text>
      </View>
    );
  }

  // ── Latest disease prediction (most recent / most severe) ──
  const latestDisease = diseases && diseases.length > 0 ? diseases[0] : null;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* Top bar */}
      <View style={styles.topBar}>
        <View>
          <Text style={styles.greeting}>{getGreeting()}, {guardian.name.split(' ')[0]}</Text>
          <Text style={styles.monitoringText}>Monitoring {patient?.name || '--'}</Text>
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

      {/* ── Overview Tab ── */}
      {activeTab === 'Overview' && (
        <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
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

          <Text style={styles.sectionTitle}>QUICK VITALS — TAP TO SEE DETAILS</Text>
          <View style={styles.vitalsGrid}>
            {VITALS_ORDER.map(key => {
              const v = vitals?.[key];
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

          {/* ── Latest Disease Prediction ── */}
          <Text style={styles.sectionTitle}>LATEST DISEASE PREDICTION</Text>
          {latestDisease ? (
            <TouchableOpacity
              style={styles.alertCard}
              onPress={() => navigation.navigate('Reports')}
              activeOpacity={0.8}
            >
              <View style={[styles.alertIcon, { backgroundColor: latestDisease.badgeBg }]}>
                <Text style={styles.alertIconEmoji}>
                  {DISEASE_ICONS[latestDisease.name] || '🩺'}
                </Text>
              </View>
              <View style={styles.alertBody}>
                <Text style={styles.alertTitle}>
                  {DISEASE_DISPLAY_NAMES[latestDisease.name] || latestDisease.name}
                </Text>
                <Text style={styles.alertSub}>Predicted condition — tap to view report</Text>
                {latestDisease.detectedAt && (
                  <Text style={styles.alertTime}>
                    {new Date(latestDisease.detectedAt).toLocaleDateString('en-GB', {
                      day: '2-digit', month: 'short', year: 'numeric',
                    })}
                  </Text>
                )}
              </View>
              <View style={[styles.badge, { backgroundColor: latestDisease.badgeBg }]}>
                <Text style={[styles.badgeText, { color: latestDisease.badgeColor }]}>
                  {latestDisease.badge}
                </Text>
              </View>
            </TouchableOpacity>
          ) : (
            <View style={[styles.alertCard, { justifyContent: 'center' }]}>
              <Text style={{ color: '#aaa', fontSize: 13 }}>No disease predictions yet</Text>
            </View>
          )}

          <View style={{ height: 24 }} />
        </ScrollView>
      )}

      {/* ── Vitals Tab ── */}
      {activeTab === 'Vitals' && (
        <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
          <Text style={styles.sectionTitle}>ALL VITALS — LIVE DATA</Text>
          <View style={styles.card}>
            {VITALS_ORDER.map((key, idx) => {
              const v = vitals?.[key];
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

      {/* ── Location Tab ── */}
      {activeTab === 'Location' && (
        <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
          <Text style={styles.sectionTitle}>CURRENT LOCATION — {patient?.name || '--'}</Text>
          <View style={styles.mapCard}>
            <TouchableOpacity
              style={styles.mapPlaceholder}
              onPress={() => {
                const lat = locationData.coords.latitude;
                const lon = locationData.coords.longitude;
                if (lat && lon) {
                  Linking.openURL(`https://maps.google.com/?q=${lat},${lon}`);
                }
              }}
            >
              {locationLoading ? (
                <ActivityIndicator color="#2979ff" />
              ) : (
                <>
                  <View style={styles.mapPinOuter}>
                    <View style={styles.mapPinInner} />
                  </View>
                  <Text style={styles.mapPlaceholderText}>
                    {locationData.coords.latitude ? 'Tap to Open Map 🗺️' : 'Location unavailable'}
                  </Text>
                </>
              )}
            </TouchableOpacity>

            <View style={styles.mapInfo}>
              <View>
                <Text style={styles.mapCity}>
                  {locationData.city}
                  {locationData.region ? `, ${locationData.region}` : ''}
                </Text>
                <Text style={styles.mapCoords}>
                  {locationData.coords.latitude
                    ? `${locationData.coords.latitude.toFixed(4)}° N, ${locationData.coords.longitude.toFixed(4)}° E`
                    : 'Coordinates unavailable'}
                </Text>
              </View>
              <Text style={styles.mapTime}>
                {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </View>
          </View>

          <Text style={[styles.sectionTitle, { marginTop: 16 }]}>LOCATION HISTORY TODAY</Text>
          <View style={styles.card}>
            {locationHistory.length > 0 ? (
              locationHistory.map((item, i, arr) => (
                <View
                  key={i}
                  style={[styles.locRow, i === arr.length - 1 && { borderBottomWidth: 0 }]}
                >
                  <Text style={styles.locTime}>{item.time}</Text>
                  <Text style={[
                    styles.locPlace,
                    item.place.includes('Last Known') && { color: '#2979ff', fontWeight: '600' },
                  ]}>
                    {item.place}
                  </Text>
                </View>
              ))
            ) : (
              <View style={styles.emptyRow}>
                <Text style={styles.emptyText}>
                  {locationLoading ? 'Fetching location...' : 'No location history available'}
                </Text>
              </View>
            )}
          </View>
          <View style={{ height: 24 }} />
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container:        { flex: 1, backgroundColor: '#f5f5f7' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f5f5f7' },
  loadingText:      { marginTop: 12, fontSize: 14, color: '#888' },
  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 50, paddingBottom: 14, backgroundColor: '#fff',
  },
  greeting:       { fontSize: 18, fontWeight: '700', color: '#111' },
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
  tabItem:       { flex: 1, alignItems: 'center', paddingVertical: 12 },
  tabText:       { fontSize: 14, color: '#888' },
  tabTextActive: { color: '#2979ff', fontWeight: '600' },
  tabUnderline: {
    position: 'absolute', bottom: 0, height: 2,
    width: '80%', backgroundColor: '#2979ff', borderRadius: 2,
  },
  scroll:       { flex: 1, paddingHorizontal: 16, paddingTop: 14 },
  card: {
    backgroundColor: '#fff', borderRadius: 14, padding: 14,
    marginBottom: 12, borderWidth: 0.5, borderColor: '#e8e8e8',
  },
  statusRow:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  statusLabel: { fontSize: 11, color: '#888' },
  statusValue: { fontSize: 20, fontWeight: '700', marginTop: 2 },
  badge:       { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  badgeText:   { fontSize: 11, fontWeight: '600' },
  watchRow:    { flexDirection: 'row', gap: 16, marginTop: 10 },
  watchText:   { fontSize: 12, color: '#555' },
  watchConnected:    { color: '#27ae60', fontWeight: '600' },
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
  vitalDot:      { width: 7, height: 7, borderRadius: 4, marginRight: 5 },
  vitalLabel:    { fontSize: 11, color: '#888' },
  vitalNum:      { fontSize: 22, fontWeight: '700', color: '#111' },
  vitalUnit:     { fontSize: 12, fontWeight: '400', color: '#888' },
  vitalStatus:   { fontSize: 11, marginTop: 3 },
  alertCard: {
    backgroundColor: '#fff', borderRadius: 14, padding: 12,
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderWidth: 0.5, borderColor: '#e8e8e8', marginBottom: 4,
  },
  alertIcon:      { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  alertIconEmoji: { fontSize: 20 },
  alertBody:      { flex: 1 },
  alertTitle:     { fontSize: 13, fontWeight: '600', color: '#111' },
  alertSub:       { fontSize: 11, color: '#888', marginTop: 2 },
  alertTime:      { fontSize: 10, color: '#bbb', marginTop: 3 },
  vitalsListItem: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 13, borderBottomWidth: 0.5, borderColor: '#f0f0f0',
  },
  vitalsListIcon:     { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  vitalsListIconText: { fontSize: 12, fontWeight: '700' },
  vitalsListBody:     { flex: 1 },
  vitalsListName:     { fontSize: 14, fontWeight: '600', color: '#111' },
  vitalsListVal:      { fontSize: 12, color: '#888', marginTop: 2 },
  mapCard: {
    backgroundColor: '#fff', borderRadius: 14, overflow: 'hidden',
    marginBottom: 12, borderWidth: 0.5, borderColor: '#e8e8e8',
  },
  mapPlaceholder: { height: 160, backgroundColor: '#dce8f8', alignItems: 'center', justifyContent: 'center' },
  mapPinOuter:    { width: 20, height: 20, borderRadius: 10, backgroundColor: 'rgba(41,121,255,0.2)', alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  mapPinInner:    { width: 10, height: 10, borderRadius: 5, backgroundColor: '#2979ff' },
  mapPlaceholderText: { fontSize: 13, color: '#5570aa' },
  mapInfo: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'flex-end', padding: 12,
  },
  mapCity:   { fontSize: 14, fontWeight: '600', color: '#111' },
  mapCoords: { fontSize: 11, color: '#888', marginTop: 2 },
  mapTime:   { fontSize: 13, color: '#888' },
  locRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingVertical: 11,
    borderBottomWidth: 0.5, borderColor: '#f0f0f0',
  },
  locTime:  { fontSize: 13, color: '#888' },
  locPlace: { fontSize: 13, color: '#111', flex: 1, textAlign: 'right' },
  emptyRow: { paddingVertical: 16, alignItems: 'center' },
  emptyText: { fontSize: 13, color: '#aaa' },
});
