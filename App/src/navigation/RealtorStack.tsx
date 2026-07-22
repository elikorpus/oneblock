import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { RealtorCommunitiesScreen } from '../screens/RealtorCommunities';
import { RealtorCommunityDetailScreen } from '../screens/RealtorCommunityDetail';
import { RealtorStackParamList } from './types';

const Stack = createNativeStackNavigator<RealtorStackParamList>();

/** Realtors are a distinct account type from residents — no tabs, no community
 * membership, just the one job: browse every community's OneBlock score. */
export function RealtorStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="RealtorCommunities" component={RealtorCommunitiesScreen} />
      <Stack.Screen name="RealtorCommunityDetail" component={RealtorCommunityDetailScreen} />
    </Stack.Navigator>
  );
}
