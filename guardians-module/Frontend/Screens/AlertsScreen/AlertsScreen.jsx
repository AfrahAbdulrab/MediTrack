import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  StatusBar, TouchableOpacity, Modal,
  ActivityIndicator, Linking, Platform,
} from 'react-native';
import MapView, { Marker, Circle } from 'react-native-maps';
import { useApp } from '../../context/AppContext';

export default function AlertsScreen({ navigation }) {
  const { alerts, patient, patientLiveLocation, locationPermission } = useApp();

  const [mapVisible, setMapVisible] = useState(false);

  // ✅ Map open karo — live location pe
  const openLiveMap = () => {
    setMapVisible(true);
  };

  // ✅ Google Maps mein open karo (external app)
  const openInGoogleMaps = () => {
    if (!patientLiveLocation) return;
    const { latitude, longitude } = patientLiveLocation;
    const label = encodeURIComponent(patient?.name || 'Patient');
    const url = Platform.select({
      ios:     `maps:0,0?q=${label}@${latitude},${longitude}`,
      android: `geo:${latitude},${longitude}?q=${latitude},${longitude}(${label})`,
    });
    Linking.openURL(url).catch(() => {
      Linking.openURL(
        `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`
      );
    });
  };

  const grouped = alerts.reduce((acc, a) => {
    if (!acc[a.group]) acc[a.group] = [];
    acc[a.group].push(a);
    return acc;
  }, {});

  // ✅ Last updated text
  const getLastUpdated = () => {
    if (!patientLiveLocation?.timestamp) return 'Updating...';
    const diffSec = Math.floor((Date.now() - patientLiveLocation.timestamp) / 1000);
    if (diffSec < 10)  return 'Just now';
    if (diffSec < 60)  return `${diffSec}s ago`;
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
    return `${Math.floor(diffSec / 3600)}h ago`;
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Alerts</Text>
          <Text style={styles.headerSub}>{patient?.name}</Text>
        </View>

        {/* ✅ Live Location Button — header mein */}
        <TouchableOpacity
          style={styles.liveLocBtn}
          onPress={openLiveMap}
          activeOpacity={0.75}
        >
          <View style={[
            styles.liveDot,
            { backgroundColor: patientLiveLocation ? '#27ae60' : '#bbb' },
          ]} />
          <Text style={styles.liveLocText}>Live Location</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {Object.entries(grouped).map(([group, items]) => (
          <View key={group}>
            <Text style={styles.groupLabel}>{group}</Text>
            <View style={styles.card}>
              {items.map((alert, idx) => (
                <View
                  key={alert.id}
                  style={[
                    styles.alertRow,
                    idx === items.length - 1 && { borderBottomWidth: 0 },
                  ]}
                >
                  <View style={[styles.alertIcon, { backgroundColor: alert.iconBg }]}>
                    <Text style={[styles.alertIconText, { color: alert.iconColor }]}>
                      {alert.icon}
                    </Text>
                  </View>
                  <View style={styles.alertBody}>
                    <View style={styles.alertTopRow}>
                      <Text style={styles.alertTitle}>{alert.title}</Text>
                      <Text style={styles.alertTime}>{alert.time}</Text>
                    </View>
                    <Text style={styles.alertSub}>{alert.sub}</Text>
                    <View style={styles.alertBottomRow}>
                      <View style={[styles.badge, { backgroundColor: alert.badgeBg }]}>
                        <Text style={[styles.badgeText, { color: alert.badgeColor }]}>
                          {alert.badge}
                        </Text>
                      </View>

                      {/* ✅ Live Location Chip — click karo to map khule */}
                      <TouchableOpacity
                        style={styles.locationChip}
                        onPress={openLiveMap}
                        activeOpacity={0.7}
                      >
                        <View style={[
                          styles.liveDotSmall,
                          { backgroundColor: patientLiveLocation ? '#27ae60' : '#bbb' },
                        ]} />
                        <Text style={styles.locationText} numberOfLines={1}>
                          {patientLiveLocation ? 'Live Location' : 'Locating...'}
                        </Text>
                      </TouchableOpacity>

                    </View>
                  </View>
                </View>
              ))}
            </View>
          </View>
        ))}
        <View style={{ height: 30 }} />
      </ScrollView>

      {/* ✅ Live Location Map Modal */}
      <Modal
        visible={mapVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setMapVisible(false)}
      >
        <View style={styles.modalContainer}>

          {/* Modal Header */}
          <View style={styles.modalHeader}>
            <View>
              <Text style={styles.modalTitle}>Live Location</Text>
              <Text style={styles.modalSub}>
                {patient?.name} • Updated {getLastUpdated()}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.closeBtn}
              onPress={() => setMapVisible(false)}
            >
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Map */}
          {patientLiveLocation ? (
            <>
              <MapView
                style={styles.map}
                initialRegion={{
                  latitude: patientLiveLocation.latitude,
                  longitude: patientLiveLocation.longitude,
                  latitudeDelta:  0.005,
                  longitudeDelta: 0.005,
                }}
                region={{
                  latitude: patientLiveLocation.latitude,
                  longitude: patientLiveLocation.longitude,
                  latitudeDelta:  0.005,
                  longitudeDelta: 0.005,
                }}
                showsUserLocation={false}
                showsCompass={true}
                showsScale={true}
              >
                {/* ✅ Patient Marker — gol pulsing dot */}
                <Marker
                  coordinate={{
                    latitude:  patientLiveLocation.latitude,
                    longitude: patientLiveLocation.longitude,
                  }}
                  title={patient?.name || 'Patient'}
                  description="Live location"
                >
                  {/* Custom gol marker */}
                  <View style={styles.markerOuter}>
                    <View style={styles.markerInner} />
                  </View>
                </Marker>

                {/* ✅ Accuracy circle */}
                {patientLiveLocation.accuracy && (
                  <Circle
                    center={{
                      latitude:  patientLiveLocation.latitude,
                      longitude: patientLiveLocation.longitude,
                    }}
                    radius={patientLiveLocation.accuracy}
                    fillColor="rgba(74, 108, 247, 0.10)"
                    strokeColor="rgba(74, 108, 247, 0.35)"
                    strokeWidth={1}
                  />
                )}
              </MapView>

              {/* Bottom info bar */}
              <View style={styles.mapBottom}>
                <View style={styles.coordsRow}>
                  <View style={styles.coordBox}>
                    <Text style={styles.coordLabel}>Latitude</Text>
                    <Text style={styles.coordValue}>
                      {patientLiveLocation.latitude.toFixed(5)}
                    </Text>
                  </View>
                  <View style={styles.coordDivider} />
                  <View style={styles.coordBox}>
                    <Text style={styles.coordLabel}>Longitude</Text>
                    <Text style={styles.coordValue}>
                      {patientLiveLocation.longitude.toFixed(5)}
                    </Text>
                  </View>
                  {patientLiveLocation.accuracy && (
                    <>
                      <View style={styles.coordDivider} />
                      <View style={styles.coordBox}>
                        <Text style={styles.coordLabel}>Accuracy</Text>
                        <Text style={styles.coordValue}>
                          ±{Math.round(patientLiveLocation.accuracy)}m
                        </Text>
                      </View>
                    </>
                  )}
                </View>

                {/* Google Maps mein open karo */}
                <TouchableOpacity
                  style={styles.gmapsBtn}
                  onPress={openInGoogleMaps}
                  activeOpacity={0.8}
                >
                  <Text style={styles.gmapsBtnText}>Open in Google Maps</Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            /* Location loading / permission denied */
            <View style={styles.noLocation}>
              {!locationPermission ? (
                <>
                  <Text style={styles.noLocIcon}>📍</Text>
                  <Text style={styles.noLocTitle}>Location Permission Needed</Text>
                  <Text style={styles.noLocSub}>
                    Please allow location access in app settings to track live location.
                  </Text>
                </>
              ) : (
                <>
                  <ActivityIndicator size="large" color="#4a6cf7" />
                  <Text style={styles.noLocTitle}>Getting Location...</Text>
                  <Text style={styles.noLocSub}>Please wait a moment</Text>
                </>
              )}
            </View>
          )}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f7' },

  header: {
    paddingTop: 50, paddingBottom: 14, paddingHorizontal: 20,
    backgroundColor: '#fff', borderBottomWidth: 0.5, borderColor: '#e0e0e0',
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#111' },
  headerSub: { fontSize: 12, color: '#888', marginTop: 2 },

  // ✅ Header Live Location button
  liveLocBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#f0f4ff', borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 7,
    borderWidth: 0.5, borderColor: '#d0d8ff',
  },
  liveDot: {
    width: 8, height: 8, borderRadius: 4,
  },
  liveLocText: { fontSize: 12, fontWeight: '600', color: '#4a6cf7' },

  scroll: { flex: 1, paddingHorizontal: 16, paddingTop: 14 },
  groupLabel: {
    fontSize: 11, fontWeight: '600', color: '#999',
    letterSpacing: 0.5, marginBottom: 10, marginTop: 4,
  },
  card: {
    backgroundColor: '#fff', borderRadius: 14,
    paddingHorizontal: 14, marginBottom: 16,
    borderWidth: 0.5, borderColor: '#e8e8e8',
  },
  alertRow: {
    flexDirection: 'row', paddingVertical: 14,
    borderBottomWidth: 0.5, borderColor: '#f0f0f0', gap: 12,
  },
  alertIcon: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center', marginTop: 2,
  },
  alertIconText: { fontSize: 15, fontWeight: '700' },
  alertBody: { flex: 1 },
  alertTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  alertTitle: { fontSize: 13, fontWeight: '600', color: '#111', flex: 1, marginRight: 8 },
  alertTime: { fontSize: 11, color: '#aaa' },
  alertSub: { fontSize: 12, color: '#888', marginTop: 2, marginBottom: 8 },
  alertBottomRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  badge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20 },
  badgeText: { fontSize: 11, fontWeight: '600' },

  // ✅ Live location chip (tappable)
  locationChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: '#f0f4ff', borderRadius: 20,
    paddingHorizontal: 10, paddingVertical: 4, flexShrink: 1,
  },
  liveDotSmall: {
    width: 7, height: 7, borderRadius: 3.5,
  },
  locationText: { fontSize: 11, color: '#4a6cf7', fontWeight: '600', flexShrink: 1 },

  // ✅ Modal styles
  modalContainer: { flex: 1, backgroundColor: '#fff' },
  modalHeader: {
    paddingTop: 20, paddingBottom: 14, paddingHorizontal: 20,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderBottomWidth: 0.5, borderColor: '#e0e0e0',
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#111' },
  modalSub: { fontSize: 12, color: '#888', marginTop: 2 },
  closeBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: '#f0f0f0', alignItems: 'center', justifyContent: 'center',
  },
  closeBtnText: { fontSize: 14, color: '#555', fontWeight: '600' },

  map: { flex: 1 },

  // ✅ Custom gol marker
  markerOuter: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: 'rgba(74, 108, 247, 0.2)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: '#4a6cf7',
  },
  markerInner: {
    width: 12, height: 12, borderRadius: 6,
    backgroundColor: '#4a6cf7',
  },

  // Bottom info bar
  mapBottom: {
    backgroundColor: '#fff',
    paddingHorizontal: 20, paddingTop: 16, paddingBottom: 30,
    borderTopWidth: 0.5, borderColor: '#e0e0e0',
  },
  coordsRow: {
    flexDirection: 'row', alignItems: 'center',
    marginBottom: 14,
  },
  coordBox: { flex: 1, alignItems: 'center' },
  coordLabel: { fontSize: 11, color: '#999', marginBottom: 3 },
  coordValue: { fontSize: 13, fontWeight: '600', color: '#111' },
  coordDivider: {
    width: 0.5, height: 30, backgroundColor: '#e0e0e0', marginHorizontal: 8,
  },
  gmapsBtn: {
    backgroundColor: '#4a6cf7', borderRadius: 14,
    paddingVertical: 14, alignItems: 'center',
  },
  gmapsBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },

  // No location
  noLocation: {
    flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40, gap: 12,
  },
  noLocIcon: { fontSize: 48 },
  noLocTitle: { fontSize: 17, fontWeight: '600', color: '#111', textAlign: 'center' },
  noLocSub: { fontSize: 13, color: '#888', textAlign: 'center', lineHeight: 20 },
});