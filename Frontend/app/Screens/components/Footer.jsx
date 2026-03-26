import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useRouter, usePathname } from 'expo-router';
import { Home, Activity, FileBarChart, User, Brain } from "lucide-react-native"; 

export default function Footer() {
  const router = useRouter();
  const pathname = usePathname();

  const tabs = [
    {
      id: "home",
      icon: Home,
      label: "Home",
      route: "/Screens/HomeScreen/HomeScreen"
    },
    {
      id: "vitals",
      icon: Activity,
      label: "Vitals",
      route: "/Screens/VitalsScreen/VitalsScreen"
    },

    // ✅ NEW AI TAB
    {
      id: "aihealth",
      icon: Brain,
      label: "AI Health",
      route: "/Screens/AIHealthScreen/AIHealthScreen"
    },

    {
      id: "report",
      icon: FileBarChart,
      label: "Report",
      route: "/Screens/HealthReport/HealthReport"
    },
    {
      id: "profile",
      icon: User,
      label: "Profile",
      route: "/Screens/MyProfile/MyProfile"
    },
  ];

  const isActive = (route) => pathname === route;

  return (
    <View style={styles.footer}>
      {tabs.map((t) => {
        const Icon = t.icon;
        const active = isActive(t.route);

        return (
          <TouchableOpacity
            key={t.id}
            onPress={() => router.push(t.route)}
            style={styles.tab}
          >
            <Icon color={active ? "#2563EB" : "#6B7280"} size={22} />
            <Text style={[styles.label, { color: active ? "#2563EB" : "#6B7280" }]}>
              {t.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "white",
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 10,
    borderTopWidth: 1,
    borderColor: "#E5E7EB",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  tab: { alignItems: "center" },
  label: { fontSize: 12, fontWeight: "600", marginTop: 3 },
});
