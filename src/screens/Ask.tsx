import { EyeOff, MessageCircle, Plus, RotateCcw, Scale, Trash2 } from 'lucide-react-native';
import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Avatar } from '../components/Avatar';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Chip } from '../components/Chip';
import { Input } from '../components/Input';
import { PersonLink } from '../components/PersonLink';
import { PillTag } from '../components/PillTag';
import { buildEmptyStates } from '../data/emptyStates';
import { confirmAndRun } from '../lib/alert';
import { useAppNavigation } from '../navigation/useAppNavigation';
import { EmptyTab } from './empty';
import { useAppState } from '../state/AppStateContext';
import { theme } from '../theme';

const TABS = ['Open asks', 'Trusted pros', 'Vote', 'Hidden'] as const;
type TabName = (typeof TABS)[number];

const ASK_PLACEHOLDER = 'e.g. Anyone have a folding table for Saturday?';
const RECOMMEND_PLACEHOLDER = 'e.g. I need an electrician who can come out this week.';

export function AskScreen() {
  const navigation = useAppNavigation();
  const { asks, addAsk, polls, votes, vote, addPoll, pros, communityName, isBoardMember, deleteAsk, hiddenAskIds, hideAsk, unhideAsk } = useAppState();
  const [tab, setTab] = useState<TabName>('Open asks');
  const [showEmpty, setShowEmpty] = useState(true);

  const [composing, setComposing] = useState(false);
  const [composeKind, setComposeKind] = useState<'Ask' | 'Recommend'>('Ask');
  const [draft, setDraft] = useState('');

  const [composingPoll, setComposingPoll] = useState(false);
  const [pollDraft, setPollDraft] = useState({ title: '', description: '', optionA: '', optionB: '' });
  const [pollError, setPollError] = useState('');

  if (asks.length === 0 && polls.length === 0 && pros.length === 0 && showEmpty)
    return (
      <EmptyTab
        config={buildEmptyStates(communityName).ask}
        communityName={communityName}
        onCta={() => {
          setShowEmpty(false);
          setComposing(true);
        }}
      />
    );

  const submitAsk = () => {
    if (!draft.trim()) return;
    addAsk(draft.trim(), composeKind);
    setDraft('');
    setComposing(false);
  };

  const submitPoll = async () => {
    if (!pollDraft.title.trim() || !pollDraft.optionA.trim() || !pollDraft.optionB.trim()) {
      setPollError('Add a title and both options.');
      return;
    }
    setPollError('');
    await addPoll({
      title: pollDraft.title.trim(),
      description: pollDraft.description.trim(),
      optionA: pollDraft.optionA.trim(),
      optionB: pollDraft.optionB.trim(),
    });
    setPollDraft({ title: '', description: '', optionA: '', optionB: '' });
    setComposingPoll(false);
  };

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.headerBlock}>
        <Text style={styles.h1}>Ask the neighborhood</Text>
        <Text style={styles.lead}>Borrow it, get a hand, get a recommendation — or weigh in.</Text>
      </View>

      <View style={styles.tabRow}>
        {TABS.map((t) => (
          <Chip key={t} active={tab === t} onPress={() => setTab(t)}>
            {t === 'Vote' ? '🗳️ Vote' : t}
          </Chip>
        ))}
      </View>

      {(tab === 'Open asks' || tab === 'Trusted pros') &&
        (!composing ? (
          <Button
            onPress={() => {
              setComposeKind(tab === 'Trusted pros' ? 'Recommend' : 'Ask');
              setComposing(true);
            }}
            leading={<Plus size={17} color="#fff" />}
            style={{ marginBottom: 16 }}
          >
            New ask
          </Button>
        ) : (
          <Card style={{ marginBottom: 16 }}>
            <Text style={styles.composeLabel}>What do you need?</Text>
            <TextInput
              value={draft}
              onChangeText={setDraft}
              placeholder={composeKind === 'Recommend' ? RECOMMEND_PLACEHOLDER : ASK_PLACEHOLDER}
              placeholderTextColor={theme.colors.inkSoft}
              multiline
              style={styles.composeInput}
            />
            <View style={styles.rowGap}>
              <View style={{ flex: 1 }}>
                <Button variant="dark" size="md" onPress={submitAsk}>
                  Post to {communityName || 'your neighborhood'}
                </Button>
              </View>
              <Button
                variant="outline"
                size="md"
                block={false}
                onPress={() => {
                  setComposing(false);
                  setShowEmpty(true);
                }}
                style={{ paddingHorizontal: 16 }}
              >
                Cancel
              </Button>
            </View>
          </Card>
        ))}

      {tab === 'Open asks' &&
        asks
          .filter((p) => !hiddenAskIds.includes(p.id))
          .map((p, i) => (
            <Card key={p.id} onPress={() => navigation.navigate('ChatThread', { askId: p.id })} style={{ marginBottom: 12 }}>
              <View style={styles.askRow}>
                <PersonLink personId={p.authorId}>
                  <Avatar initials={p.initials} bg={p.bg} size={38} tilt={i % 2 ? 3 : -3} />
                </PersonLink>
                <View style={{ flex: 1 }}>
                  <View style={styles.askHead}>
                    <PersonLink personId={p.authorId}>
                      <Text style={styles.askWho}>{p.who}</Text>
                    </PersonLink>
                    <PillTag uppercase>{p.kind}</PillTag>
                  </View>
                  <Text style={styles.askText}>{p.text}</Text>
                  <View style={styles.askMetaRow}>
                    <MessageCircle size={12} color={theme.colors.grassDeep} />
                    <Text style={styles.askMeta}>{p.messages.length} messages · Open chat</Text>
                  </View>
                </View>
                <View style={styles.askActions}>
                  <Pressable
                    hitSlop={8}
                    onPress={(e) => {
                      e.stopPropagation();
                      hideAsk(p.id);
                    }}
                  >
                    <EyeOff size={16} color={theme.colors.inkSoft} />
                  </Pressable>
                  {isBoardMember && (
                    <Pressable
                      hitSlop={8}
                      onPress={(e) => {
                        e.stopPropagation();
                        confirmAndRun('Delete this ask?', 'This removes it and its chat for everyone.', 'Delete', () => deleteAsk(p.id));
                      }}
                    >
                      <Trash2 size={16} color={theme.colors.inkSoft} />
                    </Pressable>
                  )}
                </View>
              </View>
            </Card>
          ))}

      {tab === 'Hidden' &&
        (asks.filter((p) => hiddenAskIds.includes(p.id)).length === 0 ? (
          <Text style={styles.emptyNote}>Nothing hidden — tap the eye icon on an ask to move it here.</Text>
        ) : (
          asks
            .filter((p) => hiddenAskIds.includes(p.id))
            .map((p, i) => (
              <Card key={p.id} onPress={() => navigation.navigate('ChatThread', { askId: p.id })} style={{ marginBottom: 12 }}>
                <View style={styles.askRow}>
                  <Avatar initials={p.initials} bg={p.bg} size={38} tilt={i % 2 ? 3 : -3} />
                  <View style={{ flex: 1 }}>
                    <View style={styles.askHead}>
                      <Text style={styles.askWho}>{p.who}</Text>
                      <PillTag uppercase>{p.kind}</PillTag>
                    </View>
                    <Text style={styles.askText}>{p.text}</Text>
                  </View>
                  <Pressable
                    hitSlop={8}
                    onPress={(e) => {
                      e.stopPropagation();
                      unhideAsk(p.id);
                    }}
                  >
                    <RotateCcw size={16} color={theme.colors.inkSoft} />
                  </Pressable>
                </View>
              </Card>
            ))
        ))}

      {tab === 'Trusted pros' &&
        (pros.length === 0 ? (
          <Text style={styles.emptyNote}>No trusted pros yet — post an ask for a recommendation and it'll show up here once neighbors chime in.</Text>
        ) : (
          pros.map((p) => (
            <Card key={p.name} style={{ marginBottom: 12 }}>
              <View style={styles.proRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.proName}>{p.name}</Text>
                  <Text style={styles.proTag}>{p.tag}</Text>
                </View>
                <View style={styles.proBadge}>
                  <Text style={styles.proBadgeText}>{p.used} neighbors hired them</Text>
                </View>
              </View>
            </Card>
          ))
        ))}

      {tab === 'Vote' && (
        <>
          <Card style={{ marginBottom: 16, backgroundColor: theme.colors.grassPale, borderColor: '#CBDFC4' }}>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <Scale size={16} color={theme.colors.grassDeep} />
              <Text style={styles.voteIntro}>
                Votes are anonymous and advisory. HOA members post a question with two options for residents to weigh
                in on.
              </Text>
            </View>
          </Card>

          {isBoardMember &&
            (composingPoll ? (
              <Card style={{ marginBottom: 16 }}>
                <Input label="Title" value={pollDraft.title} onChangeText={(t) => setPollDraft({ ...pollDraft, title: t })} placeholder="e.g. New playground equipment?" />
                <Input
                  label="Description"
                  value={pollDraft.description}
                  onChangeText={(t) => setPollDraft({ ...pollDraft, description: t })}
                  placeholder="Any context residents should know"
                />
                <Input label="Option 1" value={pollDraft.optionA} onChangeText={(t) => setPollDraft({ ...pollDraft, optionA: t })} placeholder="e.g. Yes, replace it" />
                <Input label="Option 2" value={pollDraft.optionB} onChangeText={(t) => setPollDraft({ ...pollDraft, optionB: t })} placeholder="e.g. No, keep as is" />
                {!!pollError && <Text style={styles.errorText}>{pollError}</Text>}
                <View style={styles.rowGap}>
                  <View style={{ flex: 1 }}>
                    <Button variant="dark" size="md" onPress={submitPoll}>
                      Post for a vote
                    </Button>
                  </View>
                  <Button
                    variant="outline"
                    size="md"
                    block={false}
                    onPress={() => {
                      setComposingPoll(false);
                      setPollError('');
                    }}
                    style={{ paddingHorizontal: 16 }}
                  >
                    Cancel
                  </Button>
                </View>
              </Card>
            ) : (
              <Button
                onPress={() => setComposingPoll(true)}
                variant="outline"
                leading={<Plus size={16} color={theme.colors.ink} />}
                style={{ marginBottom: 16 }}
              >
                New vote
              </Button>
            ))}

          {polls.length === 0 && !composingPoll && (
            <Text style={styles.emptyNote}>No votes yet — check back once the board posts one.</Text>
          )}

          {polls.map((p) => {
            const total = p.votesA + p.votesB;
            const pctA = total > 0 ? Math.round((p.votesA / total) * 100) : 0;
            const voted = votes[p.id];
            return (
              <Card key={p.id} style={{ marginBottom: 12 }}>
                <Text style={styles.pollTitle}>{p.title}</Text>
                {!!p.description && <Text style={styles.pollDesc}>{p.description}</Text>}
                {!voted ? (
                  <View style={styles.rowGap}>
                    <Pressable style={styles.voteBtn} onPress={() => vote(p.id, 'a')}>
                      <Text style={styles.voteBtnText}>{p.optionA}</Text>
                    </Pressable>
                    <Pressable style={styles.voteBtn} onPress={() => vote(p.id, 'b')}>
                      <Text style={styles.voteBtnText}>{p.optionB}</Text>
                    </Pressable>
                  </View>
                ) : (
                  <View style={{ marginTop: 12 }}>
                    <View style={styles.voteBar}>
                      <View style={{ width: `${pctA}%`, backgroundColor: theme.colors.grass }} />
                      <View style={{ flex: 1, backgroundColor: theme.colors.red }} />
                    </View>
                    <View style={styles.rowBetween}>
                      <Text style={[styles.votePct, { color: theme.colors.grassDeep }]}>
                        {pctA}% {p.optionA} ({p.votesA})
                      </Text>
                      <Text style={[styles.votePct, { color: theme.colors.red }]}>
                        {100 - pctA}% {p.optionB} ({p.votesB})
                      </Text>
                    </View>
                    <Text style={styles.voteNote}>You voted {voted === 'a' ? p.optionA : p.optionB}.</Text>
                  </View>
                )}
              </Card>
            );
          })}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 20, paddingBottom: 24 },
  headerBlock: { paddingTop: 24, paddingBottom: 16 },
  h1: { fontFamily: theme.font.displaySemibold, fontSize: 28, color: theme.colors.ink },
  lead: { fontSize: 14, color: theme.colors.inkSoft, marginTop: 4, fontFamily: theme.font.bodyRegular },
  bold: { color: theme.colors.grass, fontFamily: theme.font.bodyBold },
  tabRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  composeLabel: { fontSize: 13, fontFamily: theme.font.bodyBold, color: theme.colors.ink, marginBottom: 8 },
  composeInput: {
    backgroundColor: theme.colors.paper,
    borderWidth: theme.border.width,
    borderColor: theme.colors.line,
    borderRadius: theme.radius.md,
    fontSize: 14,
    color: theme.colors.ink,
    padding: 12,
    height: 80,
    textAlignVertical: 'top',
    fontFamily: theme.font.bodyRegular,
  },
  errorText: { fontSize: 12, color: theme.colors.red, fontFamily: theme.font.bodySemibold, marginBottom: 8 },
  rowGap: { flexDirection: 'row', gap: 8, marginTop: 8 },
  askRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  askActions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  askHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  askWho: { fontSize: 13, fontFamily: theme.font.bodyBold, color: theme.colors.ink },
  askText: { fontSize: 14, color: theme.colors.ink, marginTop: 4, fontFamily: theme.font.bodyRegular },
  askMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8 },
  askMeta: { fontSize: 12, color: theme.colors.grassDeep, fontFamily: theme.font.bodyBold },
  emptyNote: { fontSize: 13.5, color: theme.colors.inkSoft, fontFamily: theme.font.bodyRegular, textAlign: 'center', paddingVertical: 24, lineHeight: 13.5 * 1.4 },
  proRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  proName: { fontSize: 15, fontFamily: theme.font.bodyBold, color: theme.colors.ink },
  proTag: { fontSize: 12, color: theme.colors.inkSoft, marginTop: 2, fontFamily: theme.font.bodyRegular },
  proBadge: { backgroundColor: theme.colors.marigoldSoft, borderRadius: theme.radius.md, paddingVertical: 8, paddingHorizontal: 12 },
  proBadgeText: { fontSize: 12, fontFamily: theme.font.bodyBold, color: theme.colors.marigoldInk, textAlign: 'center' },
  voteIntro: { fontSize: 13, color: theme.colors.grassDeep, fontFamily: theme.font.bodySemibold, flex: 1 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 },
  pollTitle: { fontSize: 15, fontFamily: theme.font.bodyBold, color: theme.colors.ink },
  pollDesc: { fontSize: 12.5, color: theme.colors.inkSoft, marginTop: 4, fontFamily: theme.font.bodyRegular },
  voteBtn: { flex: 1, paddingVertical: 10, borderRadius: theme.radius.md, backgroundColor: theme.colors.paper, borderWidth: theme.border.width, borderColor: theme.colors.line, alignItems: 'center' },
  voteBtnText: { fontFamily: theme.font.bodyBold, fontSize: 13, color: theme.colors.ink },
  voteBar: { backgroundColor: theme.colors.paper, borderRadius: theme.radius.pill, height: 22, borderWidth: theme.border.width, borderColor: theme.colors.line, overflow: 'hidden', flexDirection: 'row' },
  votePct: { fontSize: 12, fontFamily: theme.font.bodyBold, marginTop: 6 },
  voteNote: { fontSize: 11, color: theme.colors.inkSoft, fontFamily: theme.font.bodySemibold, marginTop: 4 },
});
