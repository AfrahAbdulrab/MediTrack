import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, StatusBar, Alert, ActivityIndicator,
  Modal, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../../context/AppContext';
import { authFetch } from '../../context/api';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import DateTimePicker from '@react-native-community/datetimepicker';

// ─── Alert color helper ───────────────────────────────────────────────────────
const alertRowStyle = (level) => {
  if (level === 'critical') return { backgroundColor: '#FEF2F2' };
  if (level === 'warning')  return { backgroundColor: '#FFFBEB' };
  return {};
};

// ─── Mini Bar Graph ───────────────────────────────────────────────────────────
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

// ─── PDF HTML Builder ─────────────────────────────────────────────────────────
const buildPdfHtml = ({
  patient, rangeLabel, columnLabel,
  vitalRows, currentDate, currentTime,
}) => {
  const patientName   = patient?.name            || 'N/A';
  const patientId     = patient?.patientId       || 'N/A';
  const patientAge    = patient?.age             || 'N/A';
  const patientGender = patient?.gender          || 'N/A';
  const bloodGroup    = patient?.bloodGroup      || 'N/A';
  const condition     = patient?.condition       || 'N/A';
  const phone         = patient?.phone           || 'N/A';
  const address       = patient?.address         || 'N/A';
  const since         = patient?.monitoringSince || 'N/A';

  const vitalTableRows = !vitalRows || vitalRows.length === 0
    ? `<tr><td colspan="8" style="text-align:center;color:#9CA3AF;padding:16px">No vitals data for this range</td></tr>`
    : vitalRows.map(r => {
        const rowBg = r.alertLevel === 'critical'
          ? 'background:#FEF2F2'
          : r.alertLevel === 'warning'
          ? 'background:#FFFBEB'
          : '';
        const bp = (r.systolicBP && r.diastolicBP)
          ? `${r.systolicBP}/${r.diastolicBP}`
          : '—';
        return `
        <tr style="${rowBg}">
          <td>${r.label || '—'}</td>
          <td>${r.heartRate   ?? '—'} <span style="color:#999;font-size:9px">bpm</span></td>
          <td>${r.spo2        ?? '—'} <span style="color:#999;font-size:9px">%</span></td>
          <td>${r.temperature ?? '—'} <span style="color:#999;font-size:9px">°C</span></td>
          <td>${r.steps       ?? '—'}</td>
          <td>${bp}           <span style="color:#999;font-size:9px">mmHg</span></td>
          <td>${r.bloodSugar  ?? '—'} <span style="color:#999;font-size:9px">mg/dL</span></td>
          <td>${r.bmi         ?? '—'}</td>
        </tr>`;
      }).join('');

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Patient Health Report</title>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    body { font-family: Arial, sans-serif; background:#fff; color:#1a1a2e; font-size:11px; }
    .report-id-bar { background:#1a3c6e; padding:10px 28px; display:flex; justify-content:space-between; align-items:center; font-size:9px; color:#a8c4e8; border-bottom:3px solid #2979ff; }
    .report-id-bar .title { font-size:14px; font-weight:700; color:#fff; letter-spacing:0.5px; }
    .report-id-bar .meta  { text-align:right; font-size:9px; color:#a8c4e8; line-height:1.6; }
    .page-body { padding:18px 28px; }
    .section-header { display:flex; align-items:center; gap:8px; background:#1a3c6e; color:#fff; padding:6px 12px; margin:18px 0 0; font-size:10px; font-weight:700; letter-spacing:0.8px; text-transform:uppercase; }
    .section-header::before { content:''; display:block; width:3px; height:14px; background:#4fc3f7; border-radius:2px; }
    .patient-box { border:1px solid #c8d8ee; margin-bottom:2px; }
    .patient-row { display:flex; border-bottom:1px solid #e8eef8; }
    .patient-row:last-child { border-bottom:none; }
    .patient-field { flex:1; padding:7px 12px; border-right:1px solid #e8eef8; }
    .patient-field:last-child { border-right:none; }
    .pf-label { font-size:8px; color:#6b7a99; text-transform:uppercase; letter-spacing:0.5px; margin-bottom:2px; }
    .pf-value { font-size:11px; font-weight:700; color:#1a1a2e; }
    .vitals-table { width:100%; border-collapse:collapse; margin-top:0; font-size:9.5px; }
    .vitals-table thead tr { background:#1a3c6e; }
    .vitals-table th { color:#fff; padding:7px 8px; text-align:center; font-size:8.5px; font-weight:700; letter-spacing:0.3px; border-right:1px solid #2a4c7e; }
    .vitals-table th:first-child { text-align:left; }
    .vitals-table th:last-child  { border-right:none; }
    .vitals-table td { padding:5px 8px; text-align:center; border-bottom:1px solid #edf0f7; border-right:1px solid #edf0f7; color:#333; }
    .vitals-table td:first-child { text-align:left; font-weight:600; color:#1a3c6e; border-right:1px solid #d0daea; }
    .vitals-table td:last-child  { border-right:none; }
    .vitals-table tr:nth-child(even) td { background:#f4f7fc; }
  </style>
</head>
<body>
  <div class="report-id-bar">
    <div class="title">PATIENT HEALTH REPORT</div>
    <div class="meta">
      <div>Patient: <strong style="color:#fff">${patientName}</strong> &nbsp;|&nbsp; ID: <strong style="color:#fff">${patientId}</strong></div>
      <div>Period: <strong style="color:#fff">${rangeLabel}</strong> &nbsp;|&nbsp; Generated: <strong style="color:#fff">${currentDate}</strong></div>
    </div>
  </div>
  <div class="page-body">
    <div class="section-header">Patient Information</div>
    <div class="patient-box">
      <div class="patient-row">
        <div class="patient-field"><div class="pf-label">Full Name</div><div class="pf-value">${patientName}</div></div>
        <div class="patient-field"><div class="pf-label">Patient ID</div><div class="pf-value">${patientId}</div></div>
        <div class="patient-field"><div class="pf-label">Age</div><div class="pf-value">${patientAge} yrs</div></div>
        <div class="patient-field"><div class="pf-label">Gender</div><div class="pf-value">${patientGender}</div></div>
      </div>
      <div class="patient-row">
        <div class="patient-field"><div class="pf-label">Blood Group</div><div class="pf-value">${bloodGroup}</div></div>
        <div class="patient-field"><div class="pf-label">Condition / Status</div><div class="pf-value">${condition}</div></div>
        <div class="patient-field"><div class="pf-label">Contact</div><div class="pf-value">${phone}</div></div>
        <div class="patient-field"><div class="pf-label">Monitoring Since</div><div class="pf-value">${since}</div></div>
      </div>
      <div class="patient-row">
        <div class="patient-field" style="flex:4"><div class="pf-label">Address</div><div class="pf-value">${address}</div></div>
      </div>
    </div>
    <div class="section-header">Vital Signs — ${rangeLabel}</div>
    <table class="vitals-table">
      <thead>
        <tr>
          <th style="min-width:90px">${columnLabel}</th>
          <th>Heart Rate<br><span style="font-weight:400;color:#a8c4e8">(bpm)</span></th>
          <th>SpO₂<br><span style="font-weight:400;color:#a8c4e8">(%)</span></th>
          <th>Temperature<br><span style="font-weight:400;color:#a8c4e8">(°C)</span></th>
          <th>Steps</th>
          <th>Blood Pressure<br><span style="font-weight:400;color:#a8c4e8">(mmHg)</span></th>
          <th>Blood Sugar<br><span style="font-weight:400;color:#a8c4e8">(mg/dL)</span></th>
          <th>BMI</th>
        </tr>
      </thead>
      <tbody>${vitalTableRows}</tbody>
    </table>
  </div>
</body>
</html>`;
};

// ─── Range Options ─────────────────────────────────────────────────────────────
const RANGES = [
  { id: '24h',    label: 'Last 24 hours' },
  { id: '30d',    label: 'Last 30 days' },
  { id: 'all',    label: 'Since watch connected' },
  { id: 'custom', label: 'Custom date range' },
];

// ─── PDF Range Modal ───────────────────────────────────────────────────────────
function PdfModal({ visible, onClose, onExport, isExporting }) {
  const [selected,       setSelected]       = useState('24h');
  const [fromDate,       setFromDate]       = useState(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000));
  const [toDate,         setToDate]         = useState(new Date());
  const [showFromPicker, setShowFromPicker] = useState(false);
  const [showToPicker,   setShowToPicker]   = useState(false);

  const fmt = (d) => d.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });

  const handleExportPress = () => {
    if (selected === 'custom') {
      if (fromDate >= toDate) {
        Alert.alert('Invalid Range', '"From" date must be before "To" date.');
        return;
      }
      onExport('custom', fromDate.toISOString(), toDate.toISOString());
    } else {
      onExport(selected);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={modal.overlay}>
        <View style={modal.sheet}>

          <View style={modal.header}>
            <Text style={modal.title}>📥 Export PDF Report</Text>
            <TouchableOpacity onPress={onClose} disabled={isExporting}>
              <Ionicons name="close" size={22} color="#6B7280" />
            </TouchableOpacity>
          </View>
          <Text style={modal.sub}>Select time range for your report</Text>

          {RANGES.map(r => (
            <TouchableOpacity
              key={r.id}
              style={[modal.option, selected === r.id && modal.optionActive]}
              onPress={() => setSelected(r.id)}
              disabled={isExporting}
            >
              <Text style={[modal.optionText, selected === r.id && modal.optionTextActive]}>
                {r.label}
              </Text>
              {selected === r.id && <View style={modal.dot} />}
            </TouchableOpacity>
          ))}

          {/* Custom date pickers — sirf tab dikhao jab custom select ho */}
          {selected === 'custom' && (
            <View style={modal.datePickerBox}>
              <TouchableOpacity
                style={modal.dateBtn}
                onPress={() => { setShowFromPicker(true); setShowToPicker(false); }}
                disabled={isExporting}
              >
                <Ionicons name="calendar-outline" size={16} color="#2979ff" />
                <Text style={modal.dateBtnLabel}>  From: </Text>
                <Text style={modal.dateBtnValue}>{fmt(fromDate)}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[modal.dateBtn, { marginTop: 8 }]}
                onPress={() => { setShowToPicker(true); setShowFromPicker(false); }}
                disabled={isExporting}
              >
                <Ionicons name="calendar-outline" size={16} color="#2979ff" />
                <Text style={modal.dateBtnLabel}>  To:     </Text>
                <Text style={modal.dateBtnValue}>{fmt(toDate)}</Text>
              </TouchableOpacity>

              {showFromPicker && (
                <DateTimePicker
                  value={fromDate}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  maximumDate={new Date()}
                  onChange={(_, date) => { setShowFromPicker(false); if (date) setFromDate(date); }}
                />
              )}
              {showToPicker && (
                <DateTimePicker
                  value={toDate}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  minimumDate={fromDate}
                  maximumDate={new Date()}
                  onChange={(_, date) => { setShowToPicker(false); if (date) setToDate(date); }}
                />
              )}
            </View>
          )}

          <TouchableOpacity
            style={[modal.exportBtn, isExporting && { opacity: 0.7 }]}
            onPress={handleExportPress}
            disabled={isExporting}
          >
            {isExporting
              ? <ActivityIndicator color="#fff" />
              : <>
                  <Ionicons name="arrow-down-circle-outline" size={20} color="#fff" />
                  <Text style={modal.exportText}>Generate & Export PDF</Text>
                </>
            }
          </TouchableOpacity>

        </View>
      </View>
    </Modal>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function ReportsScreen({ navigation }) {
  const { patient, monthlyReports, diseases, loading } = useApp();

  const [expandedMonth, setExpandedMonth] = useState(null);
  const [showModal,     setShowModal]     = useState(false);
  const [isExporting,   setIsExporting]   = useState(false);

  // ── PDF Export ──
  const handleExport = async (rangeId, fromIso, toIso) => {
    // Pehle modal band karo
    setShowModal(false);

    // Thoda wait karo taake modal animation complete ho
    await new Promise(resolve => setTimeout(resolve, 400));

    setIsExporting(true);

    try {
      const rangeItem = RANGES.find(r => r.id === rangeId);
      let rangeLabel  = rangeItem?.label || 'Report';
      const currentDate = new Date().toLocaleDateString();
      const currentTime = new Date().toLocaleTimeString();

      // ── Backend se fresh vitals data fetch karo PDF ke liye ──
      // Range ke hisaab se backend proper intervals return karega:
      // 24h  → har 2-3 ghante ka data (columnLabel = "Time")
      // 30d  → har din ka data       (columnLabel = "Date")
      // all  → har din ka data       (columnLabel = "Date")
      // custom → har din ka data     (columnLabel = "Date")
      let rows     = [];
      let colLabel = 'Time';

      try {
        let url = `/api/guardian/reports/vitals?range=${rangeId}`;
        if (rangeId === 'custom' && fromIso && toIso) {
          url += `&from=${encodeURIComponent(fromIso)}&to=${encodeURIComponent(toIso)}`;
        }
        const data = await authFetch(url);
        if (data?.success) {
          rows     = data.rows        || [];
          colLabel = data.columnLabel || 'Time';
          if (data.rangeLabel) rangeLabel = data.rangeLabel;
        }
      } catch (fetchErr) {
        console.warn('Vitals fetch skipped:', fetchErr.message);
        rows     = [];
        colLabel = 'Time';
      }

      // Custom range label
      if (rangeId === 'custom' && fromIso && toIso) {
        const f = new Date(fromIso).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
        const t = new Date(toIso).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
        rangeLabel = `${f} – ${t}`;
      }

      const html = buildPdfHtml({
        patient,
        rangeLabel,
        columnLabel: colLabel,
        vitalRows:   rows,
        currentDate,
        currentTime,
      });

      // PDF banao
      const { uri } = await Print.printToFileAsync({ html, base64: false });

      // Share karo
      await Sharing.shareAsync(uri, {
        mimeType:    'application/pdf',
        dialogTitle: 'Save / Share Health Report',
        UTI:         'com.adobe.pdf',
      });

    } catch (err) {
      console.error('Export error:', err);
      Alert.alert('Export Failed', err.message || 'Could not export PDF. Please try again.');
    } finally {
      setIsExporting(false);
    }
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

      {/* ── Header ── */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Reports</Text>
          <Text style={styles.headerSub}>{patient?.name || '--'}</Text>
        </View>

        {/* PDF generate ho raha ho tab indicator dikhao */}
        {isExporting && (
          <View style={styles.exportingBadge}>
            <ActivityIndicator size="small" color="#fff" />
            <Text style={styles.exportingText}>Generating PDF...</Text>
          </View>
        )}
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* ── Download Report — Sirf ek button ── */}
        <Text style={styles.sectionTitle}>DOWNLOAD REPORT</Text>
        <View style={styles.card}>
          <TouchableOpacity
            style={styles.downloadBtn}
            onPress={() => setShowModal(true)}
            disabled={isExporting}
          >
            <View style={styles.downloadLeft}>
              <View style={styles.downloadIconBox}>
                <Ionicons name="document-text-outline" size={22} color="#2979ff" />
              </View>
              <View>
                <Text style={styles.downloadTitle}>Health Report</Text>
                <Text style={styles.downloadSubtitle}>Vitals, alerts & disease data</Text>
              </View>
            </View>
            <View style={styles.downloadRight}>
              <Ionicons name="arrow-down-circle" size={28} color="#2979ff" />
              <Text style={styles.downloadPdf}>PDF</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* ── Monthly Summaries ── */}
        <Text style={styles.sectionTitle}>MONTHLY SUMMARIES</Text>
        <View style={styles.card}>
          {!monthlyReports || monthlyReports.length === 0 ? (
            <View style={styles.emptyRow}>
              <Text style={styles.emptyText}>No monthly data available</Text>
            </View>
          ) : (
            monthlyReports.map((m, i) => (
              <View key={m.month || i}>
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
                      {m.critical ?? 0} critical • {m.moderate ?? 0} moderate alerts
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
                    <MiniBarGraph data={m.data || []} color={m.critical > 0 ? '#e74c3c' : '#2979ff'} />
                    <View style={styles.xAxisMonth}>
                      <Text style={styles.axisLabel}>1</Text>
                      <Text style={styles.axisLabel}>10</Text>
                      <Text style={styles.axisLabel}>20</Text>
                      <Text style={styles.axisLabel}>30</Text>
                    </View>
                    <View style={styles.monthStats}>
                      <View style={styles.statBox}>
                        <Text style={styles.statNum}>{m.totalReadings ?? 0}</Text>
                        <Text style={styles.statLabel}>Total Readings</Text>
                      </View>
                      <View style={styles.statBox}>
                        <Text style={[styles.statNum, { color: '#e74c3c' }]}>{m.critical ?? 0}</Text>
                        <Text style={styles.statLabel}>Critical</Text>
                      </View>
                      <View style={styles.statBox}>
                        <Text style={[styles.statNum, { color: '#e67e22' }]}>{m.moderate ?? 0}</Text>
                        <Text style={styles.statLabel}>Moderate</Text>
                      </View>
                    </View>
                  </View>
                )}
              </View>
            ))
          )}
        </View>

        {/* ── Disease Detections ── */}
        <Text style={styles.sectionTitle}>DISEASE DETECTIONS</Text>
        <View style={styles.card}>
          {!diseases || diseases.length === 0 ? (
            <View style={styles.emptyRow}>
              <Text style={styles.emptyText}>No disease detected</Text>
            </View>
          ) : (
            diseases.map((d, i) => (
              <View
                key={d.name || i}
                style={[styles.diseaseRow, i === diseases.length - 1 && { borderBottomWidth: 0 }]}
              >
                <Text style={styles.diseaseName}>{d.name}</Text>
                <View style={[styles.badge, { backgroundColor: d.badgeBg || '#e8f8f0' }]}>
                  <Text style={[styles.badgeText, { color: d.badgeColor || '#27ae60' }]}>
                    {d.badge || 'Normal'}
                  </Text>
                </View>
              </View>
            ))
          )}
        </View>

        <View style={{ height: 30 }} />
      </ScrollView>

      {/* ── PDF Modal ── */}
      <PdfModal
        visible={showModal}
        onClose={() => setShowModal(false)}
        onExport={handleExport}
        isExporting={isExporting}
      />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container:        { flex: 1, backgroundColor: '#f5f5f7' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f5f5f7' },
  loadingText:      { marginTop: 12, fontSize: 14, color: '#888' },

  header: {
    paddingTop: 50, paddingBottom: 14, paddingHorizontal: 20,
    backgroundColor: '#fff', borderBottomWidth: 0.5, borderColor: '#e0e0e0',
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end',
  },
  headerTitle:  { fontSize: 20, fontWeight: '700', color: '#111' },
  headerSub:    { fontSize: 12, color: '#888', marginTop: 2 },

  exportingBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#27ae60', paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 20,
  },
  exportingText: { color: '#fff', fontSize: 12, fontWeight: '600' },

  scroll:       { flex: 1, paddingHorizontal: 16, paddingTop: 14 },
  sectionTitle: { fontSize: 11, fontWeight: '600', color: '#999', letterSpacing: 0.5, marginBottom: 10, marginTop: 4 },
  card:         { backgroundColor: '#fff', borderRadius: 14, paddingHorizontal: 14, marginBottom: 16, borderWidth: 0.5, borderColor: '#e8e8e8' },

  // ── Single Download Button ──
  downloadBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 16,
  },
  downloadLeft:     { flexDirection: 'row', alignItems: 'center', gap: 12 },
  downloadIconBox:  {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: '#EFF6FF', justifyContent: 'center', alignItems: 'center',
  },
  downloadTitle:    { fontSize: 15, fontWeight: '600', color: '#111' },
  downloadSubtitle: { fontSize: 12, color: '#888', marginTop: 2 },
  downloadRight:    { alignItems: 'center', gap: 2 },
  downloadPdf:      { fontSize: 10, color: '#2979ff', fontWeight: '700', letterSpacing: 0.5 },

  // ── Monthly ──
  monthRow:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 0.5, borderColor: '#f0f0f0' },
  monthName:     { fontSize: 14, fontWeight: '600', color: '#111' },
  monthSub:      { fontSize: 12, color: '#888', marginTop: 2 },
  viewBtn:       { flexDirection: 'row', alignItems: 'center' },
  viewText:      { fontSize: 13, color: '#2979ff', fontWeight: '600' },
  graphExpanded: { paddingVertical: 12, borderBottomWidth: 0.5, borderColor: '#f0f0f0' },
  graphTitle:    { fontSize: 11, color: '#888', marginBottom: 10 },
  miniGraph:     { flexDirection: 'row', height: 80, alignItems: 'flex-end', gap: 2 },
  miniBarWrapper:{ flex: 1, height: '100%', justifyContent: 'flex-end' },
  miniBar:       { width: '100%', borderRadius: 2, minHeight: 3 },
  xAxisMonth:    { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  axisLabel:     { fontSize: 10, color: '#bbb' },
  monthStats:    { flexDirection: 'row', justifyContent: 'space-around', marginTop: 12, paddingTop: 12, borderTopWidth: 0.5, borderColor: '#f0f0f0' },
  statBox:       { alignItems: 'center' },
  statNum:       { fontSize: 20, fontWeight: '700', color: '#111' },
  statLabel:     { fontSize: 11, color: '#888', marginTop: 2 },

  // ── Disease ──
  diseaseRow:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 0.5, borderColor: '#f0f0f0' },
  diseaseName:   { fontSize: 14, color: '#111' },
  badge:         { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  badgeText:     { fontSize: 11, fontWeight: '600' },

  emptyRow:      { paddingVertical: 20, alignItems: 'center' },
  emptyText:     { fontSize: 13, color: '#aaa' },
});

const modal = StyleSheet.create({
  overlay:          { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet:            { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  header:           { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  title:            { fontSize: 18, fontWeight: '700', color: '#111' },
  sub:              { fontSize: 13, color: '#888', marginBottom: 16 },
  option:           { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 14, borderRadius: 12, borderWidth: 1.5, borderColor: '#e5e7eb', marginBottom: 10, backgroundColor: '#f9fafb' },
  optionActive:     { borderColor: '#2979ff', backgroundColor: '#EFF6FF' },
  optionText:       { fontSize: 15, color: '#374151', fontWeight: '500' },
  optionTextActive: { color: '#1D4ED8', fontWeight: '700' },
  dot:              { width: 10, height: 10, borderRadius: 5, backgroundColor: '#2979ff' },
  datePickerBox:    { backgroundColor: '#f0f6ff', borderRadius: 12, padding: 12, marginBottom: 10, borderWidth: 1, borderColor: '#c7d9f5' },
  dateBtn:          { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 10, borderRadius: 8, borderWidth: 1, borderColor: '#d1e3fa' },
  dateBtnLabel:     { fontSize: 13, color: '#6B7280' },
  dateBtnValue:     { fontSize: 13, fontWeight: '700', color: '#1D4ED8' },
  exportBtn:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#27ae60', paddingVertical: 15, borderRadius: 14, marginTop: 12 },
  exportText:       { color: '#fff', fontSize: 16, fontWeight: '700' },
});
