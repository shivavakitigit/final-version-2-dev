import React, { useState } from 'react';
import { StyleSheet, ImageBackground, View, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { TextInput, Button, Text, Surface, Title, useTheme, SegmentedButtons } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';

import { NativeStackNavigationProp } from '@react-navigation/native-stack';

type SignupScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Signup'>;

type Props = {
  navigation: SignupScreenNavigationProp;
};

export default function SignupScreen({ navigation }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [userType, setUserType] = useState('professional');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const theme = useTheme();
  
  const { signUp } = useAuth();  
  
  const handleSignup = async () => {
    if (!email || !password || password !== confirmPassword) {
      return;
    }
    
    setLoading(true);
    try {
      await signUp(email, password, userType);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ImageBackground 
      source={{ uri: 'https://api.a0.dev/assets/image?text=blue%20tech%20background%20abstract%20gradient&aspect=9:16&seed=456' }} 
      style={styles.background}
    >
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardAvoid}
        >
          <View style={styles.centerContainer}>
            <Surface style={styles.card}>
              <View style={styles.header}>
                <Title style={styles.title}>Create Account</Title>
                <Text style={styles.subtitle}>Join DevGnan's referral network</Text>
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
                
                <TextInput
                  label="Confirm Password"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showConfirmPassword}
                  mode="outlined"
                  autoCapitalize="none"
                  style={styles.input}
                  right={
                    <TextInput.Icon 
                      icon={showConfirmPassword ? "eye-off" : "eye"} 
                      onPress={() => setShowConfirmPassword(!showConfirmPassword)} 
                    />
                  }
                />
                
                <Text style={styles.roleLabel}>I am a</Text>
                <SegmentedButtons
                  value={userType}
                  onValueChange={setUserType}
                  buttons={[
                    {
                      value: 'professional',
                      label: 'Professional',
                    },
                    {
                      value: 'student',
                      label: 'Student',
                    },
                  ]}
                  style={styles.segmentedButtons}
                />
                  
                <Button 
                  mode="contained" 
                  onPress={handleSignup} 
                  loading={loading}
                  disabled={loading}
                  style={styles.button}
                >
                  {loading ? 'Creating Account...' : 'Sign Up'}
                </Button>
                
                <View style={styles.signInContainer}>
                  <Text style={styles.signInText}>
                    Already have an account?
                  </Text>
                  <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                    <Text style={[styles.signInLink, { color: theme.colors.primary }]}>
                      Sign In
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
    marginTop: 4,
  },
  form: {
    width: '100%',
  },
  input: {
    marginBottom: 16,
  },
  roleLabel: {
    fontSize: 14,
    color: '#627d98',
    marginBottom: 8,
  },
  segmentedButtons: {
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