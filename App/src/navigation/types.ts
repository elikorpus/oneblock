import { NavigatorScreenParams } from '@react-navigation/native';

export type TabParamList = {
  Today: undefined;
  Meet: undefined;
  Ask: undefined;
  Events: undefined;
  Discover: { focusHouse?: string } | undefined;
  HOA: undefined;
};

export type AppStackParamList = {
  Tabs: NavigatorScreenParams<TabParamList> | undefined;
  Notifications: undefined;
  Profile: undefined;
  Sell: undefined;
  PersonProfile: { personId: string };
  HouseDetail: { houseId: string };
  ClubProfile: { clubId: string };
  ChatThread: { askId: string };
  EventDetail: { eventId: string };
  BusinessProfile: { businessId: string };
};

export type AuthStackParamList = {
  Login: undefined;
  Onboarding: undefined;
  RealtorSignup: undefined;
};

export type RealtorStackParamList = {
  RealtorCommunities: undefined;
  RealtorCommunityDetail: { communityId: string; name: string };
};
