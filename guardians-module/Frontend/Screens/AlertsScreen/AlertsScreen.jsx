import React from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../../context/AppContext';

export default function AlertsScreen({ navigation }) {
  const { alerts, markSeen, patient } = useApp();

  const grouped = alerts.reduce((acc, a) => {
    if (!acc[a.group]) acc[a.group] = [];
    acc[a.group].push(a);
    return acc;
  }, {});

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Alerts</Text>
          <Text style={styles.headerSub}>{patient.name}</Text>
        </View>
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
                      {!alert.seen ? (
                        <TouchableOpacity
                          style={styles.markSeenBtn}
                          onPress={() => markSeen(alert.id)}
                        >
                          <Text style={styles.markSeenText}>Mark seen</Text>
                        </TouchableOpacity>
                      ) : (
                        <Text style={styles.seenText}>✓ Seen by you</Text>
                      )}
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </View>
        ))}
        <View style={{ height: 30 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f7' },
  header: {
    paddingTop: 50, paddingBottom: 14, paddingHorizontal: 20,
    backgroundColor: '#fff', borderBottomWidth: 0.5, borderColor: '#e0e0e0',
  },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#111' },
  headerSub: { fontSize: 12, color: '#888', marginTop: 2 },
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
  alertBottomRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  badge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20 },
  badgeText: { fontSize: 11, fontWeight: '600' },
  markSeenBtn: {
    borderWidth: 1, borderColor: '#ddd', borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 3,
  },
  markSeenText: { fontSize: 11, color: '#555' },
  seenText: { fontSize: 11, color: '#27ae60' },
});