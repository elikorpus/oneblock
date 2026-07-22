import { ChevronRight, Plus } from 'lucide-react-native';
import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Avatar } from '../components/Avatar';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Input } from '../components/Input';
import { PillTag } from '../components/PillTag';
import { SectionLabel } from '../components/SectionLabel';
import { buildEmptyStates } from '../data/emptyStates';
import { useAppNavigation } from '../navigation/useAppNavigation';
import { EmptyTab } from './empty';
import { useAppState } from '../state/AppStateContext';
import { theme } from '../theme';

const EMPTY_CLUB_DRAFT = { name: '', emoji: '🎉', tagline: '', meets: '', about: '' };

export function MeetScreen() {
  const navigation = useAppNavigation();
  const { wavedIds, sendWave, matches, clubs, communityName, createClub } = useAppState();
  const [composingClub, setComposingClub] = useState(false);
  const [clubDraft, setClubDraft] = useState(EMPTY_CLUB_DRAFT);
  const [clubError, setClubError] = useState('');

  if (matches.length === 0 && clubs.length === 0)
    return <EmptyTab config={buildEmptyStates(communityName).meet} communityName={communityName} onCta={() => navigation.navigate('Profile')} />;

  const submitClub = async () => {
    if (!clubDraft.name.trim()) {
      setClubError('Give your club a name.');
      return;
    }
    setClubError('');
    await createClub({
      name: clubDraft.name.trim(),
      emoji: clubDraft.emoji.trim() || '🎉',
      tagline: clubDraft.tagline.trim(),
      meets: clubDraft.meets.trim(),
      about: clubDraft.about.trim(),
    });
    setClubDraft(EMPTY_CLUB_DRAFT);
    setComposingClub(false);
  };

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
              <Avatar initials={n.initials} bg={n.bg} photoUrl={n.avatarUrl} size={48} tilt={i % 2 ? 4 : -4} />
              <View style={{ flex: 1 }}>
                <View style={styles.matchHead}>
                  <Text style={styles.matchName}>{n.name}</Text>
                  {!n.isPrivate && <Text style={styles.matchStreet}>{n.street}</Text>}
                </View>
                {n.isPrivate ? (
                  <Text style={styles.matchNote}>🔒 Private profile</Text>
                ) : (
                  <Text style={styles.matchNote}>{n.note}</Text>
                )}
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

        {composingClub ? (
          <Card style={{ marginTop: 12 }}>
            <View style={styles.clubDraftRow}>
              <View style={{ width: 72 }}>
                <Input label="Emoji" value={clubDraft.emoji} onChangeText={(t) => setClubDraft({ ...clubDraft, emoji: t })} placeholder="🎉" />
              </View>
              <View style={{ flex: 1 }}>
                <Input label="Club name" value={clubDraft.name} onChangeText={(t) => setClubDraft({ ...clubDraft, name: t })} placeholder="e.g. Sunrise Runners" />
              </View>
            </View>
            <Input label="Tagline" value={clubDraft.tagline} onChangeText={(t) => setClubDraft({ ...clubDraft, tagline: t })} placeholder="e.g. Easy 5Ks before work" />
            <Input label="Meets" value={clubDraft.meets} onChangeText={(t) => setClubDraft({ ...clubDraft, meets: t })} placeholder="e.g. Saturdays 8am" />
            <Input label="About" value={clubDraft.about} onChangeText={(t) => setClubDraft({ ...clubDraft, about: t })} placeholder="What should neighbors know?" />
            {!!clubError && <Text style={styles.errorText}>{clubError}</Text>}
            <View style={styles.rowGap}>
              <View style={{ flex: 1 }}>
                <Button variant="dark" size="md" onPress={submitClub}>
                  Start this club
                </Button>
              </View>
              <Button
                variant="outline"
                size="md"
                block={false}
                onPress={() => {
                  setComposingClub(false);
                  setClubDraft(EMPTY_CLUB_DRAFT);
                  setClubError('');
                }}
                style={{ paddingHorizontal: 16 }}
              >
                Cancel
              </Button>
            </View>
          </Card>
        ) : (
          <Button
            onPress={() => setComposingClub(true)}
            variant="outline"
            leading={<Plus size={16} color={theme.colors.ink} />}
            style={{ marginTop: 12 }}
          >
            Start a club
          </Button>
        )}
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
  clubDraftRow: { flexDirection: 'row', gap: 8 },
  rowGap: { flexDirection: 'row', gap: 8, marginTop: 8 },
  errorText: { fontSize: 12, color: theme.colors.red, fontFamily: theme.font.bodySemibold, marginBottom: 8 },
});
