import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useWearData } from '../../../hooks/useWearData';
const WatchDataScreen = () => {

  const { heartRate, spo2, steps } = useWearData();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Live Watch Data</Text>

      <Text style={styles.data}>Heart Rate: {heartRate} BPM</Text>
      <Text style={styles.data}>SpO2: {spo2} %</Text>
      <Text style={styles.data}>Steps: {steps}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20
  },
  data: {
    fontSize: 18,
    marginVertical: 5
  }
});

export default WatchDataScreen;