import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { LoginScreen } from '../screens/Login';
import { OnboardingScreen } from '../screens/Onboarding';
import { RealtorSignupScreen } from '../screens/RealtorSignup';
import { AuthStackParamList } from './types';

const Stack = createNativeStackNavigator<AuthStackParamList>();

export function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Onboarding" component={OnboardingScreen} />
      <Stack.Screen name="RealtorSignup" component={RealtorSignupScreen} />
    </Stack.Navigator>
  );
}
