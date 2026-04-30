import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native'; 
import { useRouter } from 'expo-router';
import LOGO from '../Screens/LOGO/LOGO';

const Index = () => {
  const router = useRouter();
  const [showButton, setShowButton] = useState(false);
  const [buttonAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowButton(true);
      Animated.spring(buttonAnim, {
        toValue: 1,
        tension: 20,
        friction: 7,
        useNativeDriver: true,
      }).start();
    }, 3000);

    return () => {
      clearTimeout(timer);
    };
  }, []);

  const handleNext = () => {
    router.push('/Screens/Intro1/Intro1');
  };

  const buttonScale = buttonAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 1],
  });

  const buttonOpacity = buttonAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  return (
    <View style={styles.container}>
      <LOGO />

      {showButton && (
        <Animated.View 
          style={[
            styles.buttonContainer,
            {
              transform: [{ scale: buttonScale }],
              opacity: buttonOpacity,
            }
          ]}
        >
          <TouchableOpacity 
            style={styles.nextButton}
            onPress={handleNext}
            activeOpacity={0.8}
          >
            <Text style={styles.buttonText}>Get Started</Text>
            <Text style={styles.arrow}>→</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.skipButton}
            onPress={handleNext}
            activeOpacity={0.7}
          >
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>
        </Animated.View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A1128',
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 50,
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  nextButton: {
    flexDirection: 'row',
    backgroundColor: '#00D9FF',
    paddingVertical: 16,
    paddingHorizontal: 50,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    minWidth: 250,
  },
  buttonText: {
    color: '#0A1128',
    fontSize: 18,
    fontWeight: 'bold',
    marginRight: 10,
  },
  arrow: {
    color: '#0A1128',
    fontSize: 24,
    fontWeight: 'bold',
  },
  skipButton: {
    marginTop: 15,
    paddingVertical: 10,
  },
  skipText: {
    color: '#88C0D0',
    fontSize: 16,
    fontWeight: '400',
  },
});

export default Index;