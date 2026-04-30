// Path: app/Screens/About/About.jsx

import React from "react";
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from 'expo-router';
import {
    ChevronLeft,
    Shield,
    Watch,
    Smartphone,
    CheckCircle,
    Heart,
    Activity,
} from "lucide-react-native";

export default function AboutScreen() {
    const router = useRouter();
    
    const deviceInfo = {
        name: "MediPulse",
        deviceId: "MT2024",
        model: "Medipulse Pro V2.1",
        firmware: "v1.4.2",
        serialNumber: "MT2024-001-PK",
        warranty: "Valid till Dec 2030",
    };

    const appInfo = {
        name: "Meditrack",
        version: "2.1.0",
        buildNumber: "2024.01.15",
        developer: "Meditrack Health Solutions",
        license: "Licensed to: Bahisht Khan",
    };

    const features = [
        { icon: Heart, text: "24/7 Heart Rate Monitoring" },
        { icon: Activity, text: "ECG & Vital Signs Tracking" },
        { icon: Shield, text: "Emergency Alert System" },
        { icon: CheckCircle, text: "AI-Powered Health Insights" },
    ];

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => router.back()}
                >
                    <ChevronLeft size={24} color="#111827" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>About</Text>
                <View style={styles.placeholder} />
            </View>

            <ScrollView
                style={styles.scrollView}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 100 }}
            >
                {/* Device Information Card */}
                <View style={styles.mainCard}>
                    <View style={styles.deviceIconContainer}>
                        <Watch size={32} color="#6366F1" />
                    </View>
                    <Text style={styles.mainTitle}>{deviceInfo.name}</Text>
                    <Text style={styles.mainSubtitle}>
                        Device ID: {deviceInfo.deviceId}
                    </Text>
                </View>

                {/* Device Details Section */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Watch size={20} color="#111827" />
                        <Text style={styles.sectionTitle}>Device Information</Text>
                    </View>

                    <View style={styles.infoCard}>
                        <InfoRow label="Model:" value={deviceInfo.model} />
                        <InfoRow label="Firmware:" value={deviceInfo.firmware} />
                        <InfoRow label="Serial Number:" value={deviceInfo.serialNumber} />
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>Warranty:</Text>
                            <View style={styles.warrantyBadge}>
                                <CheckCircle size={14} color="#10B981" />
                                <Text style={styles.warrantyText}>{deviceInfo.warranty}</Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* App Information Section */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Smartphone size={20} color="#111827" />
                        <Text style={styles.sectionTitle}>App Information</Text>
                    </View>

                    <View style={styles.infoCard}>
                        <InfoRow label="App Name:" value={appInfo.name} />
                        <InfoRow label="Version:" value={appInfo.version} />
                        <InfoRow label="Build:" value={appInfo.buildNumber} />
                        <InfoRow label="Developer:" value={appInfo.developer} />
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>License:</Text>
                            <View style={styles.licenseBadge}>
                                <Shield size={14} color="#3B82F6" />
                                <Text style={styles.licenseText}>{appInfo.license}</Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Features Section */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Activity size={20} color="#111827" />
                        <Text style={styles.sectionTitle}>Key Features</Text>
                    </View>

                    <View style={styles.featuresCard}>
                        {features.map((feature, index) => {
                            const Icon = feature.icon;
                            return (
                                <View
                                    key={index}
                                    style={[
                                        styles.featureItem,
                                        index !== features.length - 1 && styles.featureItemBorder,
                                    ]}
                                >
                                    <View style={styles.featureIconContainer}>
                                        <Icon size={18} color="#6366F1" />
                                    </View>
                                    <Text style={styles.featureText}>{feature.text}</Text>
                                </View>
                            );
                        })}
                    </View>
                </View>

                {/* Support Info */}
                <View style={styles.supportCard}>
                    <Text style={styles.supportTitle}>Need Help?</Text>
                    <Text style={styles.supportText}>
                        Contact our 24/7 support team for any assistance
                    </Text>
                    <TouchableOpacity
                        style={styles.supportButton}
                        onPress={() => router.push('/Screens/About/ContactSupport/ContactSupport')}
                    >
                        <Text style={styles.supportButtonText}>Contact Support</Text>
                    </TouchableOpacity>
                </View>

                {/* Copyright */}
                <View style={styles.copyrightContainer}>
                    <Text style={styles.copyrightText}>
                        © 2024 Meditrack Health Solutions
                    </Text>
                    <Text style={styles.copyrightSubtext}>All rights reserved</Text>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

// Info Row Component
const InfoRow = ({ label, value }) => (
    <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
    </View>
);

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#F8FAFC",
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: "#F8FAFC",
        borderBottomWidth: 1,
        borderBottomColor: "#E5E7EB",
    },
    backButton: {
        width: 40,
        height: 40,
        justifyContent: "center",
        alignItems: "center",
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: "bold",
        color: "#111827",
    },
    placeholder: {
        width: 40,
    },
    scrollView: {
        flex: 1,
    },
    mainCard: {
        backgroundColor: "#FFFFFF",
        borderRadius: 16,
        padding: 24,
        margin: 16,
        marginBottom: 12,
        alignItems: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
        elevation: 2,
    },
    deviceIconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: "#EEF2FF",
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 16,
    },
    mainTitle: {
        fontSize: 24,
        fontWeight: "bold",
        color: "#111827",
        marginBottom: 4,
    },
    mainSubtitle: {
        fontSize: 14,
        color: "#6B7280",
    },
    section: {
        paddingHorizontal: 16,
        marginBottom: 12,
    },
    sectionHeader: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 12,
        gap: 8,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: "bold",
        color: "#111827",
    },
    infoCard: {
        backgroundColor: "#FFFFFF",
        borderRadius: 12,
        padding: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    infoRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: "#F3F4F6",
    },
    infoLabel: {
        fontSize: 14,
        color: "#6B7280",
        flex: 1,
    },
    infoValue: {
        fontSize: 14,
        fontWeight: "600",
        color: "#111827",
        textAlign: "right",
        flex: 1.5,
    },
    warrantyBadge: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#D1FAE5",
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 6,
        gap: 4,
    },
    warrantyText: {
        fontSize: 13,
        fontWeight: "600",
        color: "#10B981",
    },
    licenseBadge: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#DBEAFE",
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 6,
        gap: 4,
    },
    licenseText: {
        fontSize: 12,
        fontWeight: "600",
        color: "#3B82F6",
    },
    featuresCard: {
        backgroundColor: "#FFFFFF",
        borderRadius: 12,
        padding: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    featureItem: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 12,
    },
    featureItemBorder: {
        borderBottomWidth: 1,
        borderBottomColor: "#F3F4F6",
    },
    featureIconContainer: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: "#EEF2FF",
        justifyContent: "center",
        alignItems: "center",
        marginRight: 12,
    },
    featureText: {
        fontSize: 14,
        color: "#374151",
        flex: 1,
    },
    supportCard: {
        backgroundColor: "#6366F1",
        borderRadius: 12,
        padding: 20,
        marginHorizontal: 16,
        marginBottom: 12,
        alignItems: "center",
        shadowColor: "#6366F1",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 6,
        elevation: 4,
    },
    supportTitle: {
        fontSize: 18,
        fontWeight: "bold",
        color: "#FFFFFF",
        marginBottom: 8,
    },
    supportText: {
        fontSize: 14,
        color: "rgba(255,255,255,0.9)",
        textAlign: "center",
        marginBottom: 16,
    },
    supportButton: {
        backgroundColor: "#FFFFFF",
        paddingHorizontal: 24,
        paddingVertical: 10,
        borderRadius: 8,
    },
    supportButtonText: {
        fontSize: 14,
        fontWeight: "600",
        color: "#6366F1",
    },
    copyrightContainer: {
        alignItems: "center",
        paddingVertical: 20,
        paddingHorizontal: 16,
    },
    copyrightText: {
        fontSize: 12,
        color: "#6B7280",
        marginBottom: 4,
    },
    copyrightSubtext: {
        fontSize: 11,
        color: "#9CA3AF",
    },
});