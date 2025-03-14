import React from 'react';
import { StyleSheet, ImageBackground, View } from 'react-native';
import { ActivityIndicator, Text } from 'react-native-paper';
import { Image } from 'react-native';

export default function SplashScreen() {
  return (
    <ImageBackground 
      source={{ uri: 'https://api.a0.dev/assets/image?text=tech%20digital%20connections%20network%20blue&aspect=9:16&seed=321' }} 
      style={styles.background}
    >
      <View style={styles.container}>
        <View style={styles.content}>
          <Image 
            source={{ uri: 'https://api.a0.dev/assets/image?text=DevGnan%20logo%20tech%20educational%20professional&aspect=1:1&seed=123' }} 
            style={styles.logo}
          />
          <Text variant="headlineLarge" style={styles.heading}>DevGnan</Text>
          <Text variant="titleMedium" style={styles.subHeading}>Connect. Refer. Succeed.</Text>
          <ActivityIndicator size="large" color="#ffffff" style={styles.spinner} />
        </View>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
  },
  logo: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 16,
  },
  heading: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
  subHeading: {
    color: '#ffffff',
    marginTop: 8,
  },
  spinner: {
    marginTop: 32,
  }
});