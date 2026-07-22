import React from 'react';
import { GestureResponderEvent, Pressable, StyleProp, ViewStyle } from 'react-native';
import { useAppNavigation } from '../navigation/useAppNavigation';
import { useAppState } from '../state/AppStateContext';

export type PersonLinkProps = {
  personId?: string;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
};

/** Wraps a name/avatar with navigation to that person's profile — or your own
 * Profile tab if it's you, since PersonProfile only knows about other residents. */
export function PersonLink({ personId, style, children }: PersonLinkProps) {
  const navigation = useAppNavigation();
  const { myProfileId } = useAppState();

  if (!personId) return <>{children}</>;

  const onPress = (e: GestureResponderEvent) => {
    e.stopPropagation();
    if (personId === myProfileId) navigation.navigate('Profile');
    else navigation.navigate('PersonProfile', { personId });
  };

  return (
    <Pressable onPress={onPress} style={style} hitSlop={4}>
      {children}
    </Pressable>
  );
}
