import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { BackBar } from '../../components/BackBar';
import { theme } from '../../theme';
import { Blob } from './Blob';

export function EmptyNotifications({ onBack }: { onBack: () => void }) {
  return (
    <View style={styles.screen}>
      <BackBar title="Notifications" onBack={onBack} />
      <View style={styles.center}>
        <Blob emoji="🔔" tint={theme.colors.mint} />
        <Text style={styles.title}>You're all{'\n'}caught up.</Text>
        <Text style={styles.body}>
          When neighbors wave, RSVP, or your board posts, you'll hear about it here — OneBlock keeps it under ~5
          pushes a week.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.colors.paper },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  title: {
    fontFamily: theme.font.displaySemibold,
    fontSize: 26,
    color: theme.colors.ink,
    lineHeight: 26 * theme.lineHeightMultiplier.snug,
    textAlign: 'center',
  },
  body: { fontSize: 14.5, color: theme.colors.inkSoft, lineHeight: 14.5 * theme.lineHeightMultiplier.relaxed, marginTop: 12, maxWidth: 270, textAlign: 'center', fontFamily: theme.font.bodyRegular },
});
