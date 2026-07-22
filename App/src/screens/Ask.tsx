import { MessageCircle, Plus, Scale, Trash2, X } from 'lucide-react-native';
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

const TABS = ['Open asks', 'Trusted pros', 'Vote'] as const;
type TabName = (typeof TABS)[number];

const ASK_PLACEHOLDER = 'e.g. Anyone have a folding table for Saturday?';
const RECOMMEND_PLACEHOLDER = 'e.g. I need an electrician who can come out this week.';

export function AskScreen() {
  const navigation = useAppNavigation();
  const { asks, addAsk, polls, votes, vote, addPoll, deletePoll, pros, communityName, isBoardMember, deleteAsk } = useAppState();
  const [tab, setTab] = useState<TabName>('Open asks');

  const [composing, setComposing] = useState(false);
  const [composeKind, setComposeKind] = useState<'Ask' | 'Recommend'>('Ask');
  const [draft, setDraft] = useState('');

  const [composingPoll, setComposingPoll] = useState(false);
  const [pollDraft, setPollDraft] = useState({ title: '', description: '', options: ['', ''] });
  const [pollError, setPollError] = useState('');

  const MAX_POLL_OPTIONS = 8;
  const setPollOption = (i: number, text: string) =>
    setPollDraft((d) => ({ ...d, options: d.options.map((o, idx) => (idx === i ? text : o)) }));
  const addPollOption = () =>
    setPollDraft((d) => (d.options.length >= MAX_POLL_OPTIONS ? d : { ...d, options: [...d.options, ''] }));
  const removePollOption = (i: number) =>
    setPollDraft((d) => (d.options.length <= 2 ? d : { ...d, options: d.options.filter((_, idx) => idx !== i) }));

  if (asks.length === 0 && polls.length === 0 && pros.length === 0 && !composing && !composingPoll)
    return (
      <EmptyTab
        config={buildEmptyStates(communityName).ask}
        communityName={communityName}
        onCta={() => setComposing(true)}
      />
    );

  const submitAsk = () => {
    if (!draft.trim()) return;
    addAsk(draft.trim(), composeKind);
    setDraft('');
    setComposing(false);
  };

  const submitPoll = async () => {
    const cleanedOptions = pollDraft.options.map((o) => o.trim()).filter(Boolean);
    if (!pollDraft.title.trim() || cleanedOptions.length < 2) {
      setPollError('Add a title and at least two options.');
      return;
    }
    setPollError('');
    await addPoll({
      title: pollDraft.title.trim(),
      description: pollDraft.description.trim(),
      options: cleanedOptions,
    });
    setPollDraft({ title: '', description: '', options: ['', ''] });
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
                onPress={() => setComposing(false)}
                style={{ paddingHorizontal: 16 }}
              >
                Cancel
              </Button>
            </View>
          </Card>
        ))}

      {tab === 'Open asks' &&
        asks.map((p, i) => (
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
          </Card>
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
                {pollDraft.options.map((opt, i) => (
                  <View key={i} style={styles.pollOptionRow}>
                    <View style={{ flex: 1 }}>
                      <Input label={`Option ${i + 1}`} value={opt} onChangeText={(t) => setPollOption(i, t)} placeholder="e.g. Yes, replace it" />
                    </View>
                    {pollDraft.options.length > 2 && (
                      <Pressable onPress={() => removePollOption(i)} hitSlop={8} style={styles.pollOptionRemoveBtn}>
                        <X size={16} color={theme.colors.inkSoft} />
                      </Pressable>
                    )}
                  </View>
                ))}
                {pollDraft.options.length < MAX_POLL_OPTIONS && (
                  <Pressable onPress={addPollOption} style={styles.addOptionBtn}>
                    <Text style={styles.addOptionText}>+ Add another option</Text>
                  </Pressable>
                )}
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
            const votedOptionId = votes[p.id];
            return (
              <Card key={p.id} style={{ marginBottom: 12 }}>
                <View style={styles.pollHeadRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.pollTitle}>{p.title}</Text>
                    {!!p.description && <Text style={styles.pollDesc}>{p.description}</Text>}
                  </View>
                  {isBoardMember && (
                    <Pressable
                      hitSlop={8}
                      onPress={() => confirmAndRun('Delete this vote?', 'This removes it and every vote cast for everyone.', 'Delete', () => deletePoll(p.id))}
                    >
                      <Trash2 size={16} color={theme.colors.inkSoft} />
                    </Pressable>
                  )}
                </View>
                {!votedOptionId ? (
                  <View style={{ gap: 8, marginTop: 8 }}>
                    {p.options.map((o) => (
                      <Pressable key={o.id} style={styles.voteBtn} onPress={() => vote(p.id, o.id)}>
                        <Text style={styles.voteBtnText}>{o.text}</Text>
                      </Pressable>
                    ))}
                  </View>
                ) : (
                  <View style={{ marginTop: 12, gap: 10 }}>
                    {p.options.map((o) => {
                      const pct = p.totalVotes > 0 ? Math.round((o.votes / p.totalVotes) * 100) : 0;
                      const mine = o.id === votedOptionId;
                      return (
                        <View key={o.id}>
                          <View style={styles.optionBarTrack}>
                            <View style={[styles.optionBarFill, { width: `${pct}%`, backgroundColor: mine ? theme.colors.grass : theme.colors.inkSoft }]} />
                          </View>
                          <View style={styles.rowBetween}>
                            <Text style={[styles.votePct, mine && { color: theme.colors.grassDeep }]}>
                              {o.text}
                              {mine ? ' · your vote' : ''}
                            </Text>
                            <Text style={styles.votePct}>
                              {pct}% ({o.votes})
                            </Text>
                          </View>
                        </View>
                      );
                    })}
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
  pollHeadRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  pollTitle: { fontSize: 15, fontFamily: theme.font.bodyBold, color: theme.colors.ink },
  pollDesc: { fontSize: 12.5, color: theme.colors.inkSoft, marginTop: 4, fontFamily: theme.font.bodyRegular },
  pollOptionRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  pollOptionRemoveBtn: { paddingBottom: 12 },
  addOptionBtn: { paddingVertical: 10, alignItems: 'center', marginBottom: 4 },
  addOptionText: { color: theme.colors.grassDeep, fontFamily: theme.font.bodyBold, fontSize: 13 },
  voteBtn: { paddingVertical: 10, borderRadius: theme.radius.md, backgroundColor: theme.colors.paper, borderWidth: theme.border.width, borderColor: theme.colors.line, alignItems: 'center' },
  voteBtnText: { fontFamily: theme.font.bodyBold, fontSize: 13, color: theme.colors.ink },
  optionBarTrack: { backgroundColor: theme.colors.paper, borderRadius: theme.radius.pill, height: 12, borderWidth: theme.border.width, borderColor: theme.colors.line, overflow: 'hidden' },
  optionBarFill: { height: '100%' },
  votePct: { fontSize: 12, fontFamily: theme.font.bodyBold, marginTop: 4 },
});
