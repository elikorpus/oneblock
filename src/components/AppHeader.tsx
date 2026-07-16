import { Bell } from 'lucide-react-native';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useAppState } from '../state/AppStateContext';
import { theme } from '../theme';
import { Avatar } from './Avatar';

export type AppHeaderProps = {
  onOpenNotifications: () => void;
  onOpenProfile: () => void;
};

/** Persistent app-shell header: wordmark, notifications bell, profile avatar. */
export function AppHeader({ onOpenNotifications, onOpenProfile }: AppHeaderProps) {
  const { unreadNotificationCount, profile } = useAppState();

  return (
    <View style={styles.row}>
      <View style={styles.left}>
        <Text style={styles.wordmark}>
          oneblock<Text style={{ color: theme.colors.grass }}>.</Text>
        </Text>
      </View>
      <View style={styles.right}>
        <Pressable onPress={onOpenNotifications} hitSlop={8} style={styles.bellBtn}>
          <Bell size={19} color={theme.colors.ink} />
          {unreadNotificationCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{unreadNotificationCount}</Text>
            </View>
          )}
        </Pressable>
        <Pressable onPress={onOpenProfile}>
          <Avatar initials={(profile.firstName[0] ?? '?') + (profile.lastName[0] ?? '')} bg={theme.colors.sky} size={30} tilt={-3} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    borderBottomWidth: theme.border.width,
    borderBottomColor: theme.colors.line,
    paddingHorizontal: 20,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.paper,
  },
  left: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  wordmark: { fontFamily: theme.font.displayBold, fontSize: 18, color: theme.colors.ink },
  right: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  bellBtn: { padding: 4 },
  badge: {
    position: 'absolute',
    top: -2,
    right: -4,
    backgroundColor: theme.colors.red,
    borderRadius: theme.radius.pill,
    minWidth: 15,
    height: 15,
    borderWidth: 1.5,
    borderColor: theme.colors.paper,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: { color: '#fff', fontSize: 9, fontFamily: theme.font.bodyBold },
});
