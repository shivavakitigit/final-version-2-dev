import React, { useState } from 'react';
import { StyleSheet, ImageBackground, View, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { TextInput, Button, Text, Surface, Title, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { Feather } from '@expo/vector-icons';
import { Image } from 'react-native';

import { NativeStackNavigationProp } from '@react-navigation/native-stack';

type LoginScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Login'>;

type Props = {
  navigation: LoginScreenNavigationProp;
};

export default function LoginScreen({ navigation }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const theme = useTheme();
  
  const { signIn } = useAuth();

  const handleLogin = async () => {
    if (!email || !password) {
      return;
    }
    
    setLoading(true);
    try {
      await signIn(email, password);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ImageBackground 
      source={{ uri: 'https://api.a0.dev/assets/image?text=blue%20tech%20background%20abstract%20gradient&aspect=9:16' }} 
      style={styles.background}
    >
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardAvoid}
        >
          <View style={styles.centerContainer}>
            <Surface style={styles.card}>
              <View style={styles.logoContainer}>
                <Image 
                  source={{ uri: 'https://api.a0.dev/assets/image?text=DevGnan%20logo%20tech%20educational%20professional&aspect=1:1&seed=123' }} 
                  style={styles.logo}
                />
                <Title style={styles.title}>DevGnan</Title>
                <Text style={styles.subtitle}>Connect. Refer. Succeed.</Text>
              </View>
              
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
                
                <TextInput
                  label="Password"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  mode="outlined"
                  autoCapitalize="none"
                  style={styles.input}
                  right={
                    <TextInput.Icon 
                      icon={showPassword ? "eye-off" : "eye"} 
                      onPress={() => setShowPassword(!showPassword)} 
                    />
                  }
                />
                
                <TouchableOpacity 
                  onPress={() => navigation.navigate('ForgotPassword')}
                  style={styles.forgotPasswordContainer}
                >
                  <Text style={[styles.forgotPassword, { color: theme.colors.primary }]}>
                    Forgot Password?
                  </Text>
                </TouchableOpacity>
              
                <Button 
                  mode="contained" 
                  onPress={handleLogin} 
                  loading={loading}
                  disabled={loading}
                  style={styles.button}
                >
                  {loading ? 'Signing in...' : 'Sign In'}
                </Button>
                
                <View style={styles.signupContainer}>
                  <Text style={styles.signupText}>
                    Don't have an account?
                  </Text>
                  <TouchableOpacity onPress={() => navigation.navigate('Registration')}>
                    <Text style={[styles.signupLink, { color: theme.colors.primary }]}>
                      Sign Up
                    </Text>
                  </TouchableOpacity>
                </View>
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
  logoContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0967d2',
  },
  subtitle: {
    fontSize: 14,
    color: '#627d98',
    marginTop: 4,
  },
  form: {
    width: '100%',
  },
  input: {
    marginBottom: 16,
  },
  forgotPasswordContainer: {
    alignItems: 'flex-end',
    marginBottom: 24,
  },
  forgotPassword: {
    fontSize: 14,
  },
  button: {
    padding: 4,
    borderRadius: 8,
  },
  signupContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  signupText: {
    color: '#627d98',
    fontSize: 14,
    marginRight: 4,
  },
  signupLink: {
    fontSize: 14,
    fontWeight: 'bold',
  },
});