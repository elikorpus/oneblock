import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ChevronRight } from 'lucide-react-native';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { BackBar } from '../components/BackBar';
import { SectionLabel } from '../components/SectionLabel';
import { NotificationItem } from '../data/types';
import { AppStackParamList, TabParamList } from '../navigation/types';
import { useAppState } from '../state/AppStateContext';
import { theme } from '../theme';
import { EmptyNotifications } from './empty';

type Props = NativeStackScreenProps<AppStackParamList, 'Notifications'>;

export function NotificationsScreen({ navigation }: Props) {
  const { notifications, readNotificationIds, markNotificationRead, markAllNotificationsRead } = useAppState();

  if (notifications.length === 0) return <EmptyNotifications onBack={() => navigation.goBack()} />;

  const isRead = (id: string) => readNotificationIds.includes(id);
  const unread = notifications.filter((n) => !isRead(n.id));
  const earlier = notifications.filter((n) => isRead(n.id));

  const open = (n: NotificationItem) => {
    markNotificationRead(n.id);
    if (n.go.type === 'tab') {
      navigation.navigate('Tabs', { screen: n.go.id as keyof TabParamList });
    } else if (n.go.type === 'event') {
      navigation.navigate('EventDetail', { eventId: n.go.id });
    } else if (n.go.type === 'person') {
      navigation.navigate('PersonProfile', { personId: n.go.id });
    } else if (n.go.type === 'ask') {
      navigation.navigate('ChatThread', { askId: n.go.id });
    }
  };

  const Row = (n: NotificationItem) => {
    const read = isRead(n.id);
    return (
      <Pressable
        key={n.id}
        onPress={() => open(n)}
        style={[styles.row, { backgroundColor: read ? 'transparent' : theme.colors.card, borderColor: read ? 'transparent' : theme.colors.line }]}
      >
        <View style={[styles.iconChip, { backgroundColor: n.tint }, theme.hardShadow('sm')]}>
          <Text style={{ fontSize: 19 }}>{n.emoji}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>{n.title}</Text>
          <Text style={styles.sub}>{n.sub}</Text>
        </View>
        <View style={styles.rightCol}>
          <Text style={styles.time}>{n.time}</Text>
          {read ? <ChevronRight size={14} color={theme.colors.line} /> : <View style={styles.dot} />}
        </View>
      </Pressable>
    );
  };

  return (
    <View style={styles.screen}>
      <View style={styles.headerRow}>
        <BackBar
          title="Notifications"
          onBack={() => navigation.goBack()}
          right={
            unread.length > 0 ? (
              <Pressable onPress={markAllNotificationsRead}>
                <Text style={styles.markAll}>Mark all read</Text>
              </Pressable>
            ) : undefined
          }
        />
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        {unread.length > 0 && (
          <>
            <SectionLabel>New</SectionLabel>
            {unread.map(Row)}
          </>
        )}
        {earlier.length > 0 && (
          <View style={{ marginTop: unread.length ? 12 : 0 }}>
            <SectionLabel>Earlier</SectionLabel>
            {earlier.map(Row)}
          </View>
        )}
        <Text style={styles.footnote}>That's everything. Neighborly keeps it under ~5 pushes a week.</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.colors.paper },
  headerRow: {},
  markAll: { fontSize: 12, fontFamily: theme.font.bodyBold, color: theme.colors.grass },
  content: { padding: 16 },
  row: { borderWidth: theme.border.width, borderRadius: 16, flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, marginBottom: 8 },
  iconChip: { borderWidth: theme.border.strong, borderColor: theme.colors.ink, borderRadius: 13, width: 40, height: 40, alignItems: 'center', justifyContent: 'center', transform: [{ rotate: '-3deg' }] },
  title: { fontSize: 14, fontFamily: theme.font.bodyBold, color: theme.colors.ink },
  sub: { fontSize: 12.5, color: theme.colors.inkSoft, fontFamily: theme.font.bodyRegular },
  rightCol: { alignItems: 'flex-end', gap: 5 },
  time: { fontSize: 11, color: theme.colors.inkSoft, fontFamily: theme.font.bodySemibold },
  dot: { width: 8, height: 8, backgroundColor: theme.colors.grass, borderRadius: 999 },
  footnote: { fontSize: 12, color: theme.colors.inkSoft, fontFamily: theme.font.bodySemibold, textAlign: 'center', marginTop: 16 },
});
