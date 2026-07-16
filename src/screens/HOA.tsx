import { ArrowLeft, Bot, Landmark, Plus, Send } from 'lucide-react-native';
import React, { useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Avatar } from '../components/Avatar';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Chip } from '../components/Chip';
import { Input } from '../components/Input';
import { PersonLink } from '../components/PersonLink';
import { SectionLabel } from '../components/SectionLabel';
import { buildEmptyStates } from '../data/emptyStates';
import { useAppState } from '../state/AppStateContext';
import { theme } from '../theme';
import { EmptyTab } from './empty';

type DisplayMessage = { from: 'you' | 'them'; text: string };
type Mode = 'board' | 'ai' | 'announcements' | 'tools';

const AI_PLACEHOLDER =
  "The AI rules assistant will be live once OneBlock's backend is connected — for now, message the board directly.";

const ENTITY_LABEL: Record<string, string> = {
  club_post: '💬 Club post',
  event: '📅 Event',
  community_spot: '📍 Spot',
  ask: '🤝 Ask',
};

export function HOAScreen() {
  const { boardThreads, sendBoardMessage, announcements, addAnnouncement, communityName, isBoardMember, moderationLog } = useAppState();
  const [mode, setMode] = useState<Mode>('board');
  const [ai, setAi] = useState<DisplayMessage[]>([
    {
      from: 'them',
      text: 'Hi! I know your covenants inside out. Ask me anything — fences, paint colors, RV parking, pool hours, fine appeals…',
    },
  ]);
  const [text, setText] = useState('');
  const scrollRef = useRef<ScrollView>(null);
  const [showEmpty, setShowEmpty] = useState(true);
  const [composingAnnouncement, setComposingAnnouncement] = useState(false);
  const [announcementDraft, setAnnouncementDraft] = useState({ title: '', body: '' });
  const [openThreadId, setOpenThreadId] = useState<string | null>(null);

  if (boardThreads.length === 0 && announcements.length === 0 && showEmpty)
    return (
      <EmptyTab config={buildEmptyStates(communityName).hoa} communityName={communityName} onCta={() => setShowEmpty(false)} />
    );

  const myThread = !isBoardMember ? (boardThreads[0] ?? null) : null;
  const openThread = isBoardMember ? (boardThreads.find((t) => t.residentId === openThreadId) ?? null) : null;
  const showInbox = mode === 'board' && isBoardMember && !openThread;

  let msgs: DisplayMessage[] = [];
  let onSend: (value: string) => void = () => {};
  let placeholder = 'Share a concern with the board…';

  if (mode === 'ai') {
    msgs = ai;
    placeholder = 'Can I park an RV overnight?';
    onSend = (value) => {
      setAi((m) => [...m, { from: 'you', text: value }]);
      setTimeout(() => setAi((m) => [...m, { from: 'them', text: AI_PLACEHOLDER }]), 500);
    };
  } else if (mode === 'board' && openThread) {
    msgs = openThread.messages.map((m) => ({ from: m.fromBoard ? 'you' : 'them', text: m.text }));
    placeholder = `Reply to ${openThread.residentName.split(' ')[0]}…`;
    onSend = (value) => sendBoardMessage(value, openThread.residentId);
  } else if (mode === 'board' && myThread) {
    msgs = myThread.messages.map((m) => ({ from: m.fromBoard ? 'them' : 'you', text: m.text }));
    onSend = (value) => sendBoardMessage(value);
  } else if (mode === 'board') {
    onSend = (value) => sendBoardMessage(value);
  }

  const send = () => {
    const value = text.trim();
    if (!value) return;
    setText('');
    onSend(value);
  };

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={90}>
      <View style={styles.headerBlock}>
        <Text style={styles.h1}>Your HOA</Text>
        <Text style={styles.lead}>Your community association</Text>
        <View style={styles.tabRow}>
          <Chip active={mode === 'announcements'} onPress={() => setMode('announcements')}>
            📣 Announcements
          </Chip>
          <Chip
            active={mode === 'board'}
            onPress={() => {
              setMode('board');
              setOpenThreadId(null);
            }}
          >
            💬 {isBoardMember ? 'Messages from residents' : 'Message the board'}
          </Chip>
          <Chip active={mode === 'ai'} onPress={() => setMode('ai')}>
            🤖 Rules assistant
          </Chip>
          {isBoardMember && (
            <Chip active={mode === 'tools'} onPress={() => setMode('tools')}>
              🛠 Board tools
            </Chip>
          )}
        </View>
      </View>

      {mode === 'tools' ? (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.messages}>
          <SectionLabel>Moderation log</SectionLabel>
          <Text style={styles.toolsNote}>Only board members can see this. Every delete made by a board member — anywhere in the app — shows up here.</Text>
          {moderationLog.length === 0 && <Text style={styles.emptyAnnouncements}>Nothing's been removed yet.</Text>}
          {moderationLog.map((m) => (
            <Card key={m.id} style={{ marginBottom: 12 }}>
              <View style={styles.logHead}>
                <Text style={styles.logType}>{ENTITY_LABEL[m.entityType] ?? m.entityType}</Text>
                <Text style={styles.logWhen}>{m.when}</Text>
              </View>
              <Text style={styles.logSummary} numberOfLines={2}>
                “{m.summary}”
              </Text>
              <Text style={styles.logWho}>Removed by {m.who}</Text>
            </Card>
          ))}
        </ScrollView>
      ) : mode === 'announcements' ? (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.messages}>
          <SectionLabel>Board announcements</SectionLabel>
          {isBoardMember &&
            (composingAnnouncement ? (
              <Card style={{ marginBottom: 12 }}>
                <Input label="Title" value={announcementDraft.title} onChangeText={(t) => setAnnouncementDraft({ ...announcementDraft, title: t })} />
                <Text style={styles.composeLabel}>Message</Text>
                <TextInput
                  value={announcementDraft.body}
                  onChangeText={(t) => setAnnouncementDraft({ ...announcementDraft, body: t })}
                  placeholder="What should the neighborhood know?"
                  placeholderTextColor={theme.colors.inkSoft}
                  multiline
                  style={styles.announcementInput}
                />
                <View style={styles.rowGap}>
                  <View style={{ flex: 1 }}>
                    <Button
                      variant="dark"
                      size="md"
                      onPress={async () => {
                        if (!announcementDraft.title.trim() || !announcementDraft.body.trim()) return;
                        await addAnnouncement(announcementDraft.title.trim(), announcementDraft.body.trim());
                        setAnnouncementDraft({ title: '', body: '' });
                        setComposingAnnouncement(false);
                      }}
                    >
                      Post announcement
                    </Button>
                  </View>
                  <Button variant="outline" size="md" block={false} onPress={() => setComposingAnnouncement(false)} style={{ paddingHorizontal: 16 }}>
                    Cancel
                  </Button>
                </View>
              </Card>
            ) : (
              <Button
                onPress={() => setComposingAnnouncement(true)}
                variant="outline"
                leading={<Plus size={16} color={theme.colors.ink} />}
                style={{ marginBottom: 12 }}
              >
                New announcement
              </Button>
            ))}
          {announcements.length === 0 && <Text style={styles.emptyAnnouncements}>No announcements yet.</Text>}
          {announcements.map((a) => (
            <Card key={a.id} style={{ marginBottom: 12 }}>
              <Text style={styles.announcementTitle}>{a.title}</Text>
              <Text style={styles.announcementBody}>{a.body}</Text>
              <Text style={styles.announcementMeta}>
                {a.authorName} · {a.createdAt}
              </Text>
            </Card>
          ))}
        </ScrollView>
      ) : showInbox ? (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.messages}>
          <SectionLabel>Messages from residents</SectionLabel>
          {boardThreads.length === 0 && <Text style={styles.emptyAnnouncements}>No one has messaged the board yet.</Text>}
          {boardThreads.map((t) => {
            const last = t.messages[t.messages.length - 1];
            return (
              <Pressable key={t.residentId} onPress={() => setOpenThreadId(t.residentId)} style={styles.threadRow}>
                <PersonLink personId={t.residentId}>
                  <Avatar initials={t.initials} bg={t.bg} size={40} tilt={-3} />
                </PersonLink>
                <View style={{ flex: 1 }}>
                  <Text style={styles.threadName}>{t.residentName}</Text>
                  {!!last && (
                    <Text style={styles.threadPreview} numberOfLines={1}>
                      {last.fromBoard ? 'You: ' : ''}
                      {last.text}
                    </Text>
                  )}
                </View>
              </Pressable>
            );
          })}
        </ScrollView>
      ) : (
        <>
          <ScrollView
            ref={scrollRef}
            style={{ flex: 1 }}
            contentContainerStyle={styles.messages}
            onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
          >
            {mode === 'board' && openThread && (
              <Pressable onPress={() => setOpenThreadId(null)} style={styles.backRow}>
                <ArrowLeft size={14} color={theme.colors.inkSoft} />
                <Text style={styles.backText}>Back to inbox · {openThread.residentName}</Text>
              </Pressable>
            )}
            {mode === 'ai' && (
              <View style={styles.aiNote}>
                <Bot size={13} color={theme.colors.grassDeep} />
                <Text style={styles.aiNoteText}>AI answers from your covenants — not official rulings. For appeals, message the board.</Text>
              </View>
            )}
            {msgs.map((m, i) => (
              <View key={i} style={[styles.msgRow, { justifyContent: m.from === 'you' ? 'flex-end' : 'flex-start' }]}>
                {m.from === 'them' && (
                  <View style={[styles.avatarChip, { backgroundColor: mode === 'ai' ? theme.colors.ink : theme.colors.lilac }]}>
                    {mode === 'ai' ? <Bot size={14} color={theme.colors.paper} /> : <Landmark size={13} color={theme.colors.ink} />}
                  </View>
                )}
                <View
                  style={[
                    styles.bubble,
                    {
                      backgroundColor: m.from === 'you' ? theme.colors.grass : theme.colors.card,
                      borderWidth: m.from === 'you' ? 0 : theme.border.width,
                    },
                  ]}
                >
                  <Text style={{ color: m.from === 'you' ? '#fff' : theme.colors.ink, fontSize: 14, lineHeight: 14 * 1.45 }}>{m.text}</Text>
                </View>
              </View>
            ))}
          </ScrollView>

          <View style={styles.inputRow}>
            <TextInput
              value={text}
              onChangeText={setText}
              onSubmitEditing={send}
              placeholder={placeholder}
              placeholderTextColor={theme.colors.inkSoft}
              style={styles.input}
            />
            <Pressable onPress={send} style={styles.sendBtn}>
              <Send size={17} color="#fff" />
            </Pressable>
          </View>
        </>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.colors.paper },
  rowGap: { flexDirection: 'row', gap: 8 },
  composeLabel: { fontSize: 11, fontFamily: theme.font.bodyBold, color: theme.colors.inkSoft, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 4 },
  announcementInput: {
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
    marginBottom: 12,
  },
  headerBlock: { paddingHorizontal: 20, paddingTop: 24, paddingBottom: 12 },
  h1: { fontFamily: theme.font.displaySemibold, fontSize: 28, color: theme.colors.ink },
  lead: { fontSize: 13.5, color: theme.colors.inkSoft, marginTop: 4, fontFamily: theme.font.bodyRegular },
  tabRow: { flexDirection: 'row', gap: 8, marginTop: 12, flexWrap: 'wrap' },
  messages: { paddingHorizontal: 20, paddingBottom: 12 },
  emptyAnnouncements: { fontSize: 13.5, color: theme.colors.inkSoft, fontFamily: theme.font.bodySemibold, textAlign: 'center', paddingVertical: 24 },
  toolsNote: { fontSize: 12.5, color: theme.colors.inkSoft, fontFamily: theme.font.bodyRegular, marginBottom: 16, lineHeight: 12.5 * 1.4 },
  logHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  logType: { fontSize: 12.5, fontFamily: theme.font.bodyBold, color: theme.colors.ink },
  logWhen: { fontSize: 11, color: theme.colors.inkSoft, fontFamily: theme.font.bodySemibold },
  logSummary: { fontSize: 13.5, color: theme.colors.ink, marginTop: 6, fontFamily: theme.font.bodyRegular, fontStyle: 'italic' },
  logWho: { fontSize: 11.5, color: theme.colors.grassDeep, fontFamily: theme.font.bodyBold, marginTop: 8 },
  announcementTitle: { fontSize: 15, fontFamily: theme.font.bodyBold, color: theme.colors.ink },
  announcementBody: { fontSize: 13.5, color: theme.colors.ink, marginTop: 4, fontFamily: theme.font.bodyRegular, lineHeight: 13.5 * 1.4 },
  announcementMeta: { fontSize: 11.5, color: theme.colors.inkSoft, fontFamily: theme.font.bodySemibold, marginTop: 8 },
  threadRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: theme.border.width,
    borderBottomColor: theme.colors.line,
  },
  threadName: { fontSize: 14.5, fontFamily: theme.font.bodyBold, color: theme.colors.ink },
  threadPreview: { fontSize: 12.5, color: theme.colors.inkSoft, fontFamily: theme.font.bodyRegular, marginTop: 2 },
  backRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 14 },
  backText: { fontSize: 12.5, fontFamily: theme.font.bodyBold, color: theme.colors.inkSoft },
  aiNote: {
    backgroundColor: theme.colors.grassPale,
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  aiNoteText: { fontSize: 11.5, color: theme.colors.grassDeep, fontFamily: theme.font.bodySemibold, flex: 1 },
  msgRow: { flexDirection: 'row', marginBottom: 10 },
  avatarChip: {
    width: 28,
    height: 28,
    borderRadius: 10,
    borderWidth: theme.border.strong,
    borderColor: theme.colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  bubble: { borderColor: theme.colors.line, borderRadius: 16, maxWidth: '82%', paddingVertical: 10, paddingHorizontal: 14 },
  inputRow: {
    borderTopWidth: theme.border.width,
    borderTopColor: theme.colors.line,
    backgroundColor: theme.colors.card,
    padding: 12,
    flexDirection: 'row',
    gap: 8,
  },
  input: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderWidth: theme.border.width,
    borderColor: theme.colors.line,
    borderRadius: theme.radius.pill,
    fontSize: 14,
    color: theme.colors.ink,
    backgroundColor: theme.colors.paper,
    fontFamily: theme.font.bodyRegular,
  },
  sendBtn: {
    backgroundColor: theme.colors.grass,
    borderRadius: theme.radius.pill,
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
