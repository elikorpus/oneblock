import { ChevronRight } from 'lucide-react-native';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Avatar } from '../components/Avatar';
import { Card } from '../components/Card';
import { PillTag } from '../components/PillTag';
import { SectionLabel } from '../components/SectionLabel';
import { buildEmptyStates } from '../data/emptyStates';
import { useAppNavigation } from '../navigation/useAppNavigation';
import { EmptyTab } from './empty';
import { useAppState } from '../state/AppStateContext';
import { theme } from '../theme';

export function MeetScreen() {
  const navigation = useAppNavigation();
  const { wavedIds, sendWave, matches, clubs, communityName } = useAppState();

  if (matches.length === 0 && clubs.length === 0)
    return <EmptyTab config={buildEmptyStates(communityName).meet} communityName={communityName} onCta={() => navigation.navigate('Profile')} />;

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.headerBlock}>
        <Text style={styles.h1}>
          You have <Text style={{ color: theme.colors.grass }}>{matches.length} neighbors</Text> you'd probably enjoy meeting.
        </Text>
        <Text style={styles.lead}>Matched on shared interests, within a 5-minute walk. They only see you if you both say hi.</Text>
      </View>

      <SectionLabel>Your matches</SectionLabel>
      {matches.map((n, i) => {
        const hi = wavedIds.includes(n.id);
        return (
          <Card key={n.id} onPress={() => navigation.navigate('PersonProfile', { personId: n.id })} style={{ marginBottom: 12 }}>
            <View style={styles.matchRow}>
              <Avatar initials={n.initials} bg={n.bg} size={48} tilt={i % 2 ? 4 : -4} />
              <View style={{ flex: 1 }}>
                <View style={styles.matchHead}>
                  <Text style={styles.matchName}>{n.name}</Text>
                  <Text style={styles.matchStreet}>{n.street}</Text>
                </View>
                <Text style={styles.matchNote}>{n.note}</Text>
                <View style={styles.sharedWrap}>
                  {n.shared.map((s) => (
                    <PillTag key={s} tone="outline">
                      {s} · you too
                    </PillTag>
                  ))}
                </View>
              </View>
            </View>
            <Pressable
              onPress={() => sendWave(n.id)}
              style={[styles.hiBtn, { backgroundColor: hi ? theme.colors.paper : theme.colors.grass }]}
            >
              <Text style={[styles.hiText, { color: hi ? theme.colors.grassDeep : '#fff' }]}>
                {hi ? (n.connected ? `Connected 🎉 — ${n.name.split(' ')[0]} waved back` : 'Hi sent — connect if they wave back') : 'Say hi 👋'}
              </Text>
            </Pressable>
          </Card>
        );
      })}

      <View style={{ marginTop: 24 }}>
        <SectionLabel>Clubs in your community</SectionLabel>
        {clubs.map((c) => (
          <Pressable
            key={c.id}
            onPress={() => navigation.navigate('ClubProfile', { clubId: c.id })}
            style={styles.clubRow}
          >
            <View style={[styles.clubIcon, { backgroundColor: c.accent }]}>
              <Text style={{ fontSize: 20 }}>{c.emoji}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.clubName}>{c.name}</Text>
              <Text style={styles.clubMeta}>
                {c.meets} · {c.members} members
              </Text>
            </View>
            <ChevronRight size={16} color={theme.colors.inkSoft} />
          </Pressable>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 20, paddingBottom: 24 },
  headerBlock: { paddingTop: 24, paddingBottom: 16 },
  h1: { fontFamily: theme.font.displaySemibold, fontSize: 28, color: theme.colors.ink, lineHeight: 28 * theme.lineHeightMultiplier.snug },
  lead: { fontSize: 14, color: theme.colors.inkSoft, marginTop: 8, fontFamily: theme.font.bodyRegular },
  matchRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  matchHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  matchName: { fontFamily: theme.font.displaySemibold, fontSize: 17, color: theme.colors.ink },
  matchStreet: { fontSize: 11, color: theme.colors.inkSoft, fontFamily: theme.font.bodySemibold },
  matchNote: { fontSize: 13, color: theme.colors.inkSoft, marginTop: 2, fontFamily: theme.font.bodyRegular },
  sharedWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
  hiBtn: { width: '100%', marginTop: 12, paddingVertical: 8, borderRadius: theme.radius.md, borderWidth: theme.border.width, borderColor: theme.colors.grass, alignItems: 'center' },
  hiText: { fontFamily: theme.font.bodyBold, fontSize: 13 },
  clubRow: { borderBottomWidth: theme.border.width, borderBottomColor: theme.colors.line, flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  clubIcon: {
    borderWidth: theme.border.strong,
    borderColor: theme.colors.ink,
    borderRadius: 14,
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotate: '-3deg' }],
    ...theme.hardShadow('sm'),
  },
  clubName: { fontSize: 15, fontFamily: theme.font.bodyBold, color: theme.colors.ink },
  clubMeta: { fontSize: 12, color: theme.colors.inkSoft, fontFamily: theme.font.bodyRegular },
});
