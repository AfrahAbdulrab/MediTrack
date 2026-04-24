import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import { AppProvider } from './context/AppContext';

import LoginScreen from './Screens/LoginScreen/LoginScreen';
import Dashboard from './Screens/Dashboard/Dashboard';
import AlertsScreen from './Screens/AlertsScreen/AlertsScreen';
import ReportsScreen from './Screens/ReportsScreen/ReportsScreen';
import ProfileScreen from './Screens/ProfileScreen/ProfileScreen';
import VitalDetailScreen from './Screens/VitalDetailScreen/VitalDetailScreen';
import GuardianWelcomeScreen from './Screens/GuardianWelcomeScreen/GuardianWelcomeScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: '#2979ff',
        tabBarInactiveTintColor: '#999',
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopWidth: 0.5,
          borderTopColor: '#e0e0e0',
          height: 60,
          paddingBottom: 8,
          paddingTop: 6,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '500',
        },
        tabBarIcon: ({ color, size }) => {
          const icons = {
            Dashboard: 'grid',
            Alerts: 'notifications',
            Reports: 'document-text',
            Profile: 'person',
          };
          return <Ionicons name={icons[route.name]} size={22} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Dashboard" component={Dashboard} />
      <Tab.Screen name="Alerts" component={AlertsScreen} />
      <Tab.Screen name="Reports" component={ReportsScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

function RootStack() {
  return (
    <Stack.Navigator
      initialRouteName="GuardianWelcomeScreen"  // ✅ ye add karo
      screenOptions={{ headerShown: false }}
    >
      <Stack.Screen name="GuardianWelcome" component={GuardianWelcomeScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Main" component={MainTabs} />
      <Stack.Screen name="VitalDetail" component={VitalDetailScreen} />
    </Stack.Navigator>
  );
}
export default function App() {
  return (
    <AppProvider>
      <NavigationContainer>
        <RootStack />
      </NavigationContainer>
    </AppProvider>
  );
}