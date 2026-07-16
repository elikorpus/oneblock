import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { ChatThreadScreen } from '../screens/ChatThread';
import { ClubProfileScreen } from '../screens/ClubProfile';
import { EventDetailScreen } from '../screens/EventDetail';
import { HouseDetailScreen } from '../screens/HouseDetail';
import { NotificationsScreen } from '../screens/Notifications';
import { PersonProfileScreen } from '../screens/PersonProfile';
import { ProfileScreen } from '../screens/Profile';
import { SellScreen } from '../screens/Sell';
import { MainTabs } from './MainTabs';
import { AppStackParamList } from './types';

const Stack = createNativeStackNavigator<AppStackParamList>();

/** Hosts the tab bar as its first screen, plus every pushed detail screen — pushed
 * screens cover the header + tab bar entirely, matching the prototype's `screen` overlay. */
export function AppStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Tabs" component={MainTabs} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} />
      <Stack.Screen name="Profile" component={ProfileScreen} />
      <Stack.Screen name="Sell" component={SellScreen} />
      <Stack.Screen name="PersonProfile" component={PersonProfileScreen} />
      <Stack.Screen name="HouseDetail" component={HouseDetailScreen} />
      <Stack.Screen name="ClubProfile" component={ClubProfileScreen} />
      <Stack.Screen name="ChatThread" component={ChatThreadScreen} />
      <Stack.Screen name="EventDetail" component={EventDetailScreen} />
    </Stack.Navigator>
  );
}
