import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import LoginScreen from '../screens/LoginScreen';
import RegistrationScreen from "../screens/RegistrationForm";
import ForgotPasswordScreen from "../screens/ForgotPasswordScreen";
import HomeScreen from '../screens/HomeScreen';
import ProfessionalListScreen from '../screens/ProfessionalListScreen';
import ProfessionalDetailScreen from '../screens/ProfessionalDetailScreen';
import RequestsTrackerScreen from '../screens/RequestsTrackerScreen';
import ProfessionalRequestsScreen from '../screens/ProfessionalRequestsScreen';
import PaymentScreen from '../screens/PaymentScreen';
import ProfileScreen from '../screens/ProfileScreen';
import RequestDetailScreen from '../screens/RequestDetailScreen';
import ReferralsScreen from '../screens/ReferralsScreen';
import StudentListScreen from '../screens/StudentListScreen';
import ReferralOffersScreen from '../screens/ReferralOffersScreen';
import SentReferralOffersScreen from '../screens/SentReferralOffersScreen';

const Stack = createNativeStackNavigator();

export default function AppNavigation() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    // You might want to show a splash screen here
    return null;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false
        }}
      >
        {!user ? (
          // Authentication Flow
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Registration" component={RegistrationScreen} />
            <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
          </>
        ) : (
          // Main App Flow
          <>
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen name="Profile" component={ProfileScreen} />
            <Stack.Screen name="Referrals" component={ReferralsScreen} />
            
            {/* Student-Initiated Referral Flow */}
            <Stack.Screen name="ProfessionalList" component={ProfessionalListScreen} />
            <Stack.Screen name="ProfessionalDetail" component={ProfessionalDetailScreen} />
            <Stack.Screen name="RequestsTracker" component={RequestsTrackerScreen} />
            <Stack.Screen name="ProfessionalRequests" component={ProfessionalRequestsScreen} />
            <Stack.Screen name="RequestDetail" component={RequestDetailScreen} />
            <Stack.Screen name="PaymentScreen" component={PaymentScreen} />
            
            {/* Professional-Initiated Referral Flow */}
            <Stack.Screen name="StudentList" component={StudentListScreen} />
            <Stack.Screen name="ReferralOffers" component={ReferralOffersScreen} />
            <Stack.Screen name="SentReferralOffers" component={SentReferralOffersScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}