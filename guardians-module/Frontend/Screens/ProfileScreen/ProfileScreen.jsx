import React from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, StatusBar, Alert,
} from 'react-native';
import { useApp } from '../../context/AppContext';

export default function ProfileScreen({ navigation }) {
  const { patient, guardian, otherGuardians } = useApp();

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: () => navigation.replace('Login') },
    ]);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Patient Info */}
        <Text style={styles.sectionTitle}>PATIENT INFO</Text>
        <View style={styles.card}>
          <View style={styles.profileRow}>
            <View style={[styles.avatar, { backgroundColor: '#dce8f8' }]}>
              <Text style={[styles.avatarText, { color: '#2979ff' }]}>{patient.initials}</Text>
            </View>
            <View>
              <Text style={styles.profileName}>{patient.name}</Text>
              <Text style={styles.profileSub}>
                Age {patient.age} • {patient.gender} • {patient.bloodGroup}
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          {[
            { label: 'Condition', value: patient.condition },
            { label: 'Watch model', value: patient.watchModel },
            { label: 'Watch since', value: patient.watchSince },
            { label: 'Emergency no.', value: patient.emergencyNo, isLink: true },
          ].map((item, i) => (
            <View key={i} style={styles.infoRow}>
              <Text style={styles.infoLabel}>{item.label}</Text>
              <Text style={[styles.infoValue, item.isLink && { color: '#2979ff' }]}>
                {item.value}
              </Text>
            </View>
          ))}
        </View>

        {/* Guardian Profile */}
        <Text style={styles.sectionTitle}>YOUR GUARDIAN PROFILE</Text>
        <View style={styles.card}>
          <View style={styles.profileRow}>
            <View style={[styles.avatar, { backgroundColor: '#d0f0e0' }]}>
              <Text style={[styles.avatarText, { color: '#1a7a50' }]}>{guardian.initials}</Text>
            </View>
            <View>
              <Text style={styles.profileName}>{guardian.name}</Text>
              <Text style={styles.profileSub}>Daughter • Active guardian</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Email</Text>
            <Text style={styles.infoValue}>{guardian.email}</Text>
          </View>
          <View style={[styles.infoRow, { borderBottomWidth: 0 }]}>
            <Text style={styles.infoLabel}>Phone</Text>
            <Text style={styles.infoValue}>{guardian.phone}</Text>
          </View>
        </View>

        {/* Other Guardians */}
        <Text style={styles.sectionTitle}>OTHER GUARDIANS</Text>
        <View style={styles.card}>
          {otherGuardians.map((g, i) => (
            <View
              key={g.name}
              style={[
                styles.otherGuardianRow,
                i === otherGuardians.length - 1 && { borderBottomWidth: 0 },
              ]}
            >
              <View style={[styles.smallAvatar, { backgroundColor: g.color }]}>
                <Text style={[styles.smallAvatarText, { color: g.textColor }]}>{g.initials}</Text>
              </View>
              <View>
                <Text style={styles.guardianName}>{g.name}</Text>
                <Text style={styles.guardianSub}>{g.relation} • {g.phone}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Sign out */}
        <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut}>
          <Text style={styles.signOutText}>Sign out</Text>
        </TouchableOpacity>

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
  scroll: { flex: 1, paddingHorizontal: 16, paddingTop: 14 },
  sectionTitle: {
    fontSize: 11, fontWeight: '600', color: '#999',
    letterSpacing: 0.5, marginBottom: 10, marginTop: 4,
  },
  card: {
    backgroundColor: '#fff', borderRadius: 14, paddingHorizontal: 14,
    marginBottom: 16, borderWidth: 0.5, borderColor: '#e8e8e8',
  },
  profileRow: {
    flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 14,
  },
  avatar: {
    width: 48, height: 48, borderRadius: 24,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontSize: 16, fontWeight: '700' },
  profileName: { fontSize: 16, fontWeight: '700', color: '#111' },
  profileSub: { fontSize: 12, color: '#888', marginTop: 2 },
  divider: { height: 0.5, backgroundColor: '#f0f0f0', marginBottom: 4 },
  infoRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 12, borderBottomWidth: 0.5, borderColor: '#f0f0f0',
  },
  infoLabel: { fontSize: 13, color: '#888' },
  infoValue: { fontSize: 13, color: '#111', fontWeight: '500' },
  otherGuardianRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 12, borderBottomWidth: 0.5, borderColor: '#f0f0f0',
  },
  smallAvatar: {
    width: 38, height: 38, borderRadius: 19,
    alignItems: 'center', justifyContent: 'center',
  },
  smallAvatarText: { fontSize: 13, fontWeight: '700' },
  guardianName: { fontSize: 14, fontWeight: '600', color: '#111' },
  guardianSub: { fontSize: 12, color: '#888', marginTop: 1 },
  signOutBtn: {
    backgroundColor: '#fff5f5', borderRadius: 14, padding: 16,
    alignItems: 'center', marginBottom: 8,
    borderWidth: 0.5, borderColor: '#fde8e8',
  },
  signOutText: { fontSize: 15, fontWeight: '600', color: '#e74c3c' },
});