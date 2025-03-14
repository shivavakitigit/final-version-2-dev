import React from "react";

import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createStackNavigator } from "@react-navigation/stack";
import AppNavigation from "./screens/AppNavigation";
import { StyleSheet, StatusBar } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import {
  PaperProvider,
  MD3LightTheme,
} from "react-native-paper";
import { AuthProvider, useAuth } from "./context/AuthContext";
// Screens
import HomeScreen from "./screens/HomeScreen";
import LoginScreen from "./screens/LoginScreen";
import RegistrationForm from "./screens/RegistrationForm";
import SignupScreen from "./screens/SignupScreen";
import ForgotPasswordScreen from "./screens/ForgotPasswordScreen";
import SplashScreen from "./screens/SplashScreen";
import { Toaster } from 'sonner-native'; // Import the Toaster component

// Define the type for our stack parameter list
type RootStackParamList = {
  Login: undefined;
  Signup: undefined;
  ForgotPassword: undefined;
  Home: undefined;
};
const theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#0967d2',
    primaryContainer: '#dbeafe',
    secondary: '#0ea5e9',
    secondaryContainer: '#e0f2fe',
    tertiary: '#6366f1',
    tertiaryContainer: '#e0e7ff',
    surface: '#ffffff',
    surfaceVariant: '#f8fafc',
    surfaceDisabled: '#f1f5f9',
    background: '#f5f7fa',
    error: '#e53e3e',
    errorContainer: '#ffccd6',
    onPrimary: '#ffffff',
    onPrimaryContainer: '#0967d2',
    onSecondary: '#ffffff',
    onSecondaryContainer: '#0ea5e9',
    onTertiary: '#ffffff',
    onTertiaryContainer: '#6366f1',
    onSurface: '#334e68',
    onSurfaceVariant: '#627d98',
    onSurfaceDisabled: '#94a3b8',
    onError: '#ffffff',
    onErrorContainer: '#841d29',
    onBackground: '#334e68',
    outline: '#cbd5e1',
    outlineVariant: '#e2e8f0',
    inversePrimary: '#dbeafe',
    inverseSurface: '#334e68',
    inverseOnSurface: '#f8fafc',
    elevation: {
      level0: 'transparent',
      level1: '#f8fafc',
      level2: '#f1f5f9',
      level3: '#e2e8f0',
      level4: '#cbd5e1',
      level5: '#94a3b8',
    },
    // Custom app-specific colors
    success: '#0d5626',
    successContainer: '#d1fadf',
    warning: '#946500',
    warningContainer: '#fff0c2',
    info: '#1e3a8a',
    infoContainer: '#bfdbfe',
    purple: '#5e139e',
    purpleContainer: '#eadeff',
  },
  roundness: 8,
};

const Stack = createNativeStackNavigator<RootStackParamList>();

function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Signup" component={RegistrationForm} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
    </Stack.Navigator>
  );
}

function AppStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Home" component={HomeScreen} />
    </Stack.Navigator>
  );
}

function Navigation() {
  const { user, isLoading } = useAuth();

  // Show splash screen while checking auth
  if (isLoading) {
    return <SplashScreen />;
  }

  return (
    <NavigationContainer>
      {user ? <AppStack /> : <AuthStack />}
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <PaperProvider theme={theme}>
            <Toaster position="top" richColors expand={false} />

      <AuthProvider>
        <AppNavigation />
      </AuthProvider>
    </PaperProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
