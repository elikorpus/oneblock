import { Plus } from 'lucide-react-native';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { EmptyStateConfig } from '../../data/emptyStates';
import { theme } from '../../theme';
import { Blob } from './Blob';
import { EmptyMap } from './EmptyMap';

export function EmptyTab({
  config,
  isDiscover = false,
  communityName = '',
  onCta,
}: {
  config: EmptyStateConfig;
  isDiscover?: boolean;
  communityName?: string;
  onCta: () => void;
}) {
  return (
    <ScrollView contentContainerStyle={styles.screen}>
      <Text style={styles.eyebrow}>{config.eyebrow}</Text>
      <View style={styles.center}>
        <Blob emoji={config.emoji} tint={config.tint} />
        <Text style={styles.title}>{config.title}</Text>
        <Text style={styles.body}>{config.body}</Text>
        {isDiscover && (
          <View style={{ width: '100%', marginTop: 20 }}>
            <EmptyMap />
          </View>
        )}
      </View>
      <Pressable onPress={onCta} style={[styles.cta, { backgroundColor: theme.colors.grass, borderColor: theme.colors.grass }]}>
        <View style={styles.ctaRow}>
          <Plus size={16} color="#fff" />
          <Text style={[styles.ctaText, { color: '#fff' }]}>{config.cta}</Text>
        </View>
      </Pressable>
      <Text style={styles.footnote}>{communityName || 'Your community'} is brand new on OneBlock. It fills up fast.</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flexGrow: 1, padding: 20, paddingTop: 24 },
  eyebrow: {
    fontSize: 11,
    fontFamily: theme.font.bodyBold,
    color: theme.colors.inkSoft,
    textTransform: 'uppercase',
    letterSpacing: theme.label.tracking,
    marginBottom: 4,
  },
  center: { flexGrow: 1, alignItems: 'center', paddingTop: 56 },
  title: {
    fontFamily: theme.font.displaySemibold,
    fontSize: 28,
    color: theme.colors.ink,
    lineHeight: 28 * theme.lineHeightMultiplier.snug,
    textAlign: 'center',
  },
  body: { fontSize: 14.5, color: theme.colors.inkSoft, lineHeight: 14.5 * theme.lineHeightMultiplier.relaxed, marginTop: 12, maxWidth: 280, textAlign: 'center', fontFamily: theme.font.bodyRegular },
  cta: { width: '100%', paddingVertical: 15, borderRadius: theme.radius.xl, borderWidth: theme.border.width, alignItems: 'center', justifyContent: 'center', marginTop: 20 },
  ctaRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  ctaText: { fontFamily: theme.font.bodyBold, fontSize: 15 },
  footnote: { fontSize: 11.5, color: theme.colors.inkSoft, fontFamily: theme.font.bodySemibold, textAlign: 'center', marginTop: 12 },
});
