import { MessageCircle, Plus, Scale, Trash2 } from 'lucide-react-native';
import React, { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Avatar } from '../components/Avatar';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Chip } from '../components/Chip';
import { Input } from '../components/Input';
import { PillTag } from '../components/PillTag';
import { buildEmptyStates } from '../data/emptyStates';
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
  const { asks, addAsk, fines, votes, vote, addFine, pros, communityName, isBoardMember, deleteAsk } = useAppState();
  const [tab, setTab] = useState<TabName>('Open asks');
  const [showEmpty, setShowEmpty] = useState(true);

  const [composing, setComposing] = useState(false);
  const [composeKind, setComposeKind] = useState<'Ask' | 'Recommend'>('Ask');
  const [draft, setDraft] = useState('');

  const [composingFine, setComposingFine] = useState(false);
  const [fineDraft, setFineDraft] = useState({ desc: '', addr: '', amount: '', comment: '' });
  const [fineError, setFineError] = useState('');

  if (asks.length === 0 && fines.length === 0 && pros.length === 0 && showEmpty)
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

  const submitFine = async () => {
    const amount = Number(fineDraft.amount);
    if (!fineDraft.desc.trim() || !fineDraft.addr.trim() || !Number.isFinite(amount) || amount <= 0) {
      setFineError('Add a description, address, and a valid amount.');
      return;
    }
    setFineError('');
    await addFine({ desc: fineDraft.desc.trim(), addr: fineDraft.addr.trim(), amount, comment: fineDraft.comment.trim() });
    setFineDraft({ desc: '', addr: '', amount: '', comment: '' });
    setComposingFine(false);
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
              <Button variant="outline" size="md" block={false} onPress={() => setComposing(false)} style={{ paddingHorizontal: 16 }}>
                Cancel
              </Button>
            </View>
          </Card>
        ))}

      {tab === 'Open asks' &&
        asks.map((p, i) => (
          <Card key={p.id} onPress={() => navigation.navigate('ChatThread', { askId: p.id })} style={{ marginBottom: 12 }}>
            <View style={styles.askRow}>
              <Avatar initials={p.initials} bg={p.bg} size={38} tilt={i % 2 ? 3 : -3} />
              <View style={{ flex: 1 }}>
                <View style={styles.askHead}>
                  <Text style={styles.askWho}>{p.who}</Text>
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
                    Alert.alert('Delete this ask?', 'This removes it and its chat for everyone.', [
                      { text: 'Cancel', style: 'cancel' },
                      { text: 'Delete', style: 'destructive', onPress: () => deleteAsk(p.id) },
                    ]);
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
                Was this fine fair? Votes are anonymous and advisory — the board reviews the community's read before
                appeals. HOA members need to post votes for residents to weigh in on.
              </Text>
            </View>
          </Card>

          {isBoardMember &&
            (composingFine ? (
              <Card style={{ marginBottom: 16 }}>
                <Input label="Description" value={fineDraft.desc} onChangeText={(t) => setFineDraft({ ...fineDraft, desc: t })} placeholder="e.g. Trash cans left out overnight" />
                <Input label="Address" value={fineDraft.addr} onChangeText={(t) => setFineDraft({ ...fineDraft, addr: t })} placeholder="e.g. 21203 Kings River Point" />
                <Input label="Amount" value={fineDraft.amount} onChangeText={(t) => setFineDraft({ ...fineDraft, amount: t })} placeholder="e.g. 50" keyboardType="decimal-pad" />
                <Input label="Board's comment" value={fineDraft.comment} onChangeText={(t) => setFineDraft({ ...fineDraft, comment: t })} placeholder="Note on the violation" />
                {!!fineError && <Text style={styles.errorText}>{fineError}</Text>}
                <View style={styles.rowGap}>
                  <View style={{ flex: 1 }}>
                    <Button variant="dark" size="md" onPress={submitFine}>
                      Post for a vote
                    </Button>
                  </View>
                  <Button
                    variant="outline"
                    size="md"
                    block={false}
                    onPress={() => {
                      setComposingFine(false);
                      setFineError('');
                    }}
                    style={{ paddingHorizontal: 16 }}
                  >
                    Cancel
                  </Button>
                </View>
              </Card>
            ) : (
              <Button
                onPress={() => setComposingFine(true)}
                variant="outline"
                leading={<Plus size={16} color={theme.colors.ink} />}
                style={{ marginBottom: 16 }}
              >
                New vote
              </Button>
            ))}

          {fines.map((f) => {
            const total = f.fair + f.unfair;
            const fairPct = Math.round((f.fair / total) * 100);
            const voted = votes[f.id];
            return (
              <Card key={f.id} style={{ marginBottom: 12 }}>
                <View style={styles.rowBetween}>
                  <Text style={styles.fineDesc}>{f.desc}</Text>
                  <Text style={styles.fineAmount}>${f.amount}</Text>
                </View>
                <Text style={styles.fineMeta}>
                  {f.addr} · {f.comment}
                </Text>
                {!voted ? (
                  <View style={styles.rowGap}>
                    <Pressable style={styles.voteBtn} onPress={() => vote(f.id, 'fair')}>
                      <Text style={styles.voteBtnText}>Fair ⚖️</Text>
                    </Pressable>
                    <Pressable style={styles.voteBtn} onPress={() => vote(f.id, 'unfair')}>
                      <Text style={styles.voteBtnText}>Unfair 🙅</Text>
                    </Pressable>
                  </View>
                ) : (
                  <View style={{ marginTop: 12 }}>
                    <View style={styles.voteBar}>
                      <View style={{ width: `${fairPct}%`, backgroundColor: theme.colors.grass }} />
                      <View style={{ flex: 1, backgroundColor: theme.colors.red }} />
                    </View>
                    <View style={styles.rowBetween}>
                      <Text style={[styles.votePct, { color: theme.colors.grassDeep }]}>{fairPct}% fair ({f.fair})</Text>
                      <Text style={[styles.votePct, { color: theme.colors.red }]}>{100 - fairPct}% unfair ({f.unfair})</Text>
                    </View>
                    <Text style={styles.voteNote}>You voted {voted}. Sent to the board.</Text>
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
  fineDesc: { fontSize: 15, fontFamily: theme.font.bodyBold, color: theme.colors.ink, flex: 1 },
  fineAmount: { fontFamily: theme.font.displayBold, fontSize: 18, color: theme.colors.red },
  fineMeta: { fontSize: 12, color: theme.colors.inkSoft, marginTop: 4, fontFamily: theme.font.bodyRegular },
  voteBtn: { flex: 1, paddingVertical: 10, borderRadius: theme.radius.md, backgroundColor: theme.colors.paper, borderWidth: theme.border.width, borderColor: theme.colors.line, alignItems: 'center' },
  voteBtnText: { fontFamily: theme.font.bodyBold, fontSize: 13, color: theme.colors.ink },
  voteBar: { backgroundColor: theme.colors.paper, borderRadius: theme.radius.pill, height: 22, borderWidth: theme.border.width, borderColor: theme.colors.line, overflow: 'hidden', flexDirection: 'row' },
  votePct: { fontSize: 12, fontFamily: theme.font.bodyBold, marginTop: 6 },
  voteNote: { fontSize: 11, color: theme.colors.inkSoft, fontFamily: theme.font.bodySemibold, marginTop: 4 },
});
