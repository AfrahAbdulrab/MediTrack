import { Stack } from "expo-router";
import { useEffect } from "react";
import { configureBackgroundFetch, testBackgroundSync } from '../hooks/useBackgroundSync';

export default function RootLayout() {
  useEffect(() => {
    configureBackgroundFetch();
    testBackgroundSync();
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