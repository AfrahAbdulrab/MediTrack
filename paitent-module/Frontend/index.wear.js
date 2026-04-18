import React, { useState, useEffect } from 'react';
import { AppRegistry, StyleSheet, Text, View } from 'react-native';
import { sendMessage } from 'react-native-wear-connectivity';

const WatchApp = () => {
  const [heartRate, setHeartRate] = useState(0);

  // Farz karein humne sensor se data liya, ab usey phone ko bhejna hai
  useEffect(() => {
    if (heartRate > 0) {
      sendMessage({ hr: heartRate }); // Yeh phone app ko chala jayega
    }
  }, [heartRate]);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Medi9Track Watch</Text>
      <Text style={styles.hrValue}>{heartRate} BPM</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'black', justifyContent: 'center', alignItems: 'center' },
  label: { color: 'white', fontSize: 10 },
  hrValue: { color: '#ff4757', fontSize: 24, fontWeight: 'bold' },
});

// Yaad rahe: Yeh naam wahi hona chahiye jo Android Studio mein MainActivity mein rakha hai
AppRegistry.registerComponent('Medi9TrackWatch', () => WatchApp);