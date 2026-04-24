import { Stack } from "expo-router";
import { useEffect } from "react";
import { configureBackgroundFetch, testBackgroundSync } from '../hooks/useBackgroundSync';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { API_BASE_URL } from './constants/constants';
const savePatientLocation = async () => {
  try {
    const token = await AsyncStorage.getItem('userToken');
    if (!token) return;

    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') return;

    const loc = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });
    const { latitude, longitude } = loc.coords;

    const [place] = await Location.reverseGeocodeAsync({ latitude, longitude });
    const city    = place?.city || place?.district || 'Unknown';
    const region  = place?.region || '';
    const address = [place?.name, place?.street, place?.city].filter(Boolean).join(', ');

  await fetch(`${API_BASE_URL}/api/location/save`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ latitude, longitude, city, region, address }),
    });

    console.log('✅ Patient location saved');
  } catch (err) {
    console.log('⚠️ Location error:', err.message);
  }
};

export default function RootLayout() {
  useEffect(() => {
    configureBackgroundFetch();
    testBackgroundSync();
  }, []);

  // ✅ Patient location har 5 min mein save karo
  useEffect(() => {
    savePatientLocation();
    const interval = setInterval(savePatientLocation, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Screens/LOGO/LOGO" />
      <Stack.Screen name="Screens/MediTrack/MediTrack" />
      <Stack.Screen name="Screens/Intro1/Intro1" />
      <Stack.Screen name="Screens/Intro2/Intro2" />
      <Stack.Screen name="Screens/Intro3/Intro3" />
      <Stack.Screen name="Screens/Intro4/Intro4" />
      <Stack.Screen name="Screens/WelcomeScreen/WelcomeScreen" />
      <Stack.Screen name="Screens/SignIn/SignIn" />
      <Stack.Screen name="Screens/SignUp/SignUp" />
    </Stack>
  );
}