import React, { useState } from 'react';
import { StyleSheet, ImageBackground, View, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { TextInput, Button, Text, Surface, Title, IconButton, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';

import { NativeStackNavigationProp } from '@react-navigation/native-stack';

type ForgotPasswordScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'ForgotPassword'>;

type Props = {
  navigation: ForgotPasswordScreenNavigationProp;
};

export default function ForgotPasswordScreen({ navigation }: Props) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const theme = useTheme();
  
  const { resetPassword } = useAuth();

  const handleResetPassword = async () => {
    if (!email) {
      return;
    }
    
    setLoading(true);
    try {
      await resetPassword(email);
      setIsSubmitted(true);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ImageBackground 
      source={{ uri: 'https://api.a0.dev/assets/image?text=blue%20tech%20background%20abstract%20gradient&aspect=9:16&seed=789' }} 
      style={styles.background}
    >
      <SafeAreaView style={styles.container}>
        <IconButton
          icon="arrow-left"
          iconColor="white"
          size={24}
          style={styles.backButton}
          onPress={() => navigation.navigate('Login')}
        />
        
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardAvoid}
        >
          <View style={styles.centerContainer}>
            <Surface style={styles.card}>
              <View style={styles.header}>
                <Title style={styles.title}>Reset Password</Title>
                <Text style={styles.subtitle}>
                  {isSubmitted 
                    ? "Check your email for password reset instructions" 
                    : "Enter your email and we'll send you instructions to reset your password"}
                </Text>
              </View>
              
              {!isSubmitted ? (
                <View style={styles.form}>
                  <TextInput
                    label="Email"
                    value={email}
                    onChangeText={setEmail}
                    mode="outlined"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    style={styles.input}
                  />
                  
                  <Button 
                    mode="contained" 
                    onPress={handleResetPassword} 
                    loading={loading}
                    disabled={loading}
                    style={styles.button}
                  >
                    {loading ? 'Sending...' : 'Send Reset Instructions'}
                  </Button>
                </View>
              ) : (
                <Button 
                  mode="contained" 
                  onPress={() => navigation.navigate('Login')}
                  style={[styles.button, { marginTop: 24 }]}
                >
                  Back to Login
                </Button>
              )}
              
              <View style={styles.signInContainer}>
                <Text style={styles.signInText}>
                  Remember your password?
                </Text>
                <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                  <Text style={[styles.signInLink, { color: theme.colors.primary }]}>
                    Sign In
                  </Text>
                </TouchableOpacity>
              </View>
            </Surface>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
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
    width: '100%',
  },
  backButton: {
    position: 'absolute',
    top: 40,
    left: 10,
    zIndex: 10,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  keyboardAvoid: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  card: {
    width: '90%',
    maxWidth: 400,
    padding: 24,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    elevation: 4,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0967d2',
  },
  subtitle: {
    fontSize: 14,
    color: '#627d98',
    marginTop: 8,
    textAlign: 'center',
  },
  form: {
    width: '100%',
  },
  input: {
    marginBottom: 24,
  },
  button: {
    padding: 4,
    borderRadius: 8,
  },
  signInContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  signInText: {
    color: '#627d98',
    fontSize: 14,
    marginRight: 4,
  },
  signInLink: {
    fontSize: 14,
    fontWeight: 'bold',
  },
});