import { Calendar as CalIcon, Check, ChevronRight, Plus } from 'lucide-react-native';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Chip } from '../components/Chip';
import { DateTimeField } from '../components/DateTimeField';
import { Input } from '../components/Input';
import { buildEmptyStates } from '../data/emptyStates';
import { formatISODate, formatTime12h } from '../lib/dateTimeFormat';
import { useAppNavigation } from '../navigation/useAppNavigation';
import { EmptyTab } from './empty';
import { useAppState } from '../state/AppStateContext';
import { theme } from '../theme';

function DateChip({ mon, day, size = 52 }: { mon: string; day: string; size?: number }) {
  return (
    <View style={[styles.dateChip, { width: size }, theme.hardShadow('sm')]}>
      <View style={styles.dateChipMon}>
        <Text style={styles.dateChipMonText}>{mon}</Text>
      </View>
      <View style={styles.dateChipDay}>
        <Text style={[styles.dateChipDayText, { fontSize: size * 0.42 }]}>{day}</Text>
      </View>
    </View>
  );
}

const FILTERS = ["RSVP'd", 'All events'] as const;

const EMPTY_DRAFT = { title: '', eventDate: null as Date | null, eventTime: null as Date | null, where: '', description: '', clubId: null as string | null };

export function EventsScreen() {
  const navigation = useAppNavigation();
  const { events, eventRsvps, addEvent, communityName, clubs } = useAppState();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("RSVP'd");
  const [composing, setComposing] = useState(false);
  const [draft, setDraft] = useState(EMPTY_DRAFT);
  const [error, setError] = useState('');

  if (events.length === 0 && !composing)
    return (
      <EmptyTab
        config={buildEmptyStates(communityName).events}
        communityName={communityName}
        onCta={() => setComposing(true)}
      />
    );

  const rsvpCount = events.filter((e) => eventRsvps[e.id]).length;
  const list = filter === "RSVP'd" ? events.filter((e) => eventRsvps[e.id]) : events;

  const submit = async () => {
    if (!draft.title.trim() || !draft.eventDate || !draft.eventTime) {
      setError('Add a title, date, and time.');
      return;
    }
    setError('');
    const club = clubs.find((c) => c.id === draft.clubId);
    await addEvent({
      emoji: club?.emoji || '🎉',
      title: draft.title.trim(),
      eventDate: formatISODate(draft.eventDate),
      eventTime: formatTime12h(draft.eventTime),
      where: draft.where.trim(),
      description: draft.description.trim(),
      clubId: draft.clubId,
    });
    setDraft(EMPTY_DRAFT);
    setComposing(false);
  };

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.headerBlock}>
        <Text style={styles.h1}>Your calendar</Text>
        <Text style={styles.lead}>
          You're on the list for <Text style={styles.bold}>{rsvpCount} events</Text> — plus everything else happening
          in {communityName || 'your neighborhood'}.
        </Text>
      </View>

      {!composing ? (
        <Button onPress={() => setComposing(true)} leading={<Plus size={17} color="#fff" />} style={{ marginBottom: 16 }}>
          Create an event
        </Button>
      ) : (
        <Card style={{ marginBottom: 16 }}>
          <Input label="Title" value={draft.title} onChangeText={(t) => setDraft({ ...draft, title: t })} placeholder="e.g. Cul-de-sac BBQ" />
          <DateTimeField label="Date" mode="date" value={draft.eventDate} onChange={(d) => setDraft({ ...draft, eventDate: d })} />
          <DateTimeField label="Time" mode="time" value={draft.eventTime} onChange={(d) => setDraft({ ...draft, eventTime: d })} />
          <Input label="Where" value={draft.where} onChangeText={(t) => setDraft({ ...draft, where: t })} placeholder="e.g. the cul-de-sac" />
          {clubs.length > 0 && (
            <View style={{ marginBottom: 12 }}>
              <Text style={styles.composeLabel}>For</Text>
              <View style={styles.chipWrap}>
                <Chip active={!draft.clubId} onPress={() => setDraft({ ...draft, clubId: null })}>
                  Everyone
                </Chip>
                {clubs.map((c) => (
                  <Chip key={c.id} active={draft.clubId === c.id} onPress={() => setDraft({ ...draft, clubId: c.id })}>
                    {c.emoji} {c.name}
                  </Chip>
                ))}
              </View>
            </View>
          )}
          <Text style={styles.composeLabel}>Details</Text>
          <TextInput
            value={draft.description}
            onChangeText={(t) => setDraft({ ...draft, description: t })}
            placeholder="What should neighbors know?"
            placeholderTextColor={theme.colors.inkSoft}
            multiline
            style={styles.composeInput}
          />
          {!!error && <Text style={styles.errorText}>{error}</Text>}
          <View style={styles.rowGap}>
            <View style={{ flex: 1 }}>
              <Button variant="dark" size="md" onPress={submit}>
                Post to {communityName || 'your neighborhood'}
              </Button>
            </View>
            <Button
              variant="outline"
              size="md"
              block={false}
              onPress={() => {
                setComposing(false);
                setDraft(EMPTY_DRAFT);
                setError('');
              }}
              style={{ paddingHorizontal: 16 }}
            >
              Cancel
            </Button>
          </View>
        </Card>
      )}

      <View style={styles.tabRow}>
        {FILTERS.map((t) => (
          <Chip key={t} active={filter === t} onPress={() => setFilter(t)}>
            {t}
          </Chip>
        ))}
      </View>

      {list.map((e) => {
        const rsvp = eventRsvps[e.id];
        return (
          <Card key={e.id} onPress={() => navigation.navigate('EventDetail', { eventId: e.id })} style={{ marginBottom: 12 }}>
            <View style={styles.row}>
              <DateChip mon={e.mon} day={e.day} />
              <View style={{ flex: 1 }}>
                <View style={styles.titleRow}>
                  <Text style={{ fontSize: 16 }}>{e.emoji}</Text>
                  <Text style={styles.eventTitle}>{e.title}</Text>
                  {!!e.club && (
                    <View style={styles.clubBadge}>
                      <Text style={styles.clubBadgeText}>{e.club.name}</Text>
                    </View>
                  )}
                </View>
                <View style={styles.timeRow}>
                  <CalIcon size={12} color={theme.colors.inkSoft} />
                  <Text style={styles.eventTime}>{e.time}</Text>
                </View>
                <View style={styles.statusRow}>
                  {rsvp ? (
                    <View style={styles.goingBadge}>
                      <Check size={11} color={theme.colors.grassDeep} />
                      <Text style={styles.goingText}>Going</Text>
                    </View>
                  ) : (
                    <View style={styles.notYetBadge}>
                      <Text style={styles.notYetText}>Not yet</Text>
                    </View>
                  )}
                  <Text style={styles.goingCount}>{e.going} going</Text>
                </View>
              </View>
              <ChevronRight size={16} color={theme.colors.inkSoft} />
            </View>
          </Card>
        );
      })}

      {list.length === 0 &&
        (filter === "RSVP'd" ? (
          <Text style={styles.empty}>No RSVPs yet — tap "All events" to find something for the weekend.</Text>
        ) : (
          <Text style={styles.empty}>Nothing on the calendar yet — tap "Create an event" above to start one.</Text>
        ))}
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
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  composeLabel: { fontSize: 11, fontFamily: theme.font.bodyBold, color: theme.colors.inkSoft, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 4 },
  composeInput: {
    backgroundColor: theme.colors.paper,
    borderWidth: theme.border.width,
    borderColor: theme.colors.line,
    borderRadius: theme.radius.md,
    fontSize: 14,
    color: theme.colors.ink,
    padding: 12,
    height: 70,
    textAlignVertical: 'top',
    fontFamily: theme.font.bodyRegular,
    marginBottom: 12,
  },
  errorText: { fontSize: 12, color: theme.colors.red, fontFamily: theme.font.bodySemibold, marginBottom: 8 },
  rowGap: { flexDirection: 'row', gap: 8 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  dateChip: { borderWidth: theme.border.width, borderColor: theme.colors.ink, borderRadius: 12, overflow: 'hidden' },
  dateChipMon: { backgroundColor: theme.colors.grass, paddingVertical: 3 },
  dateChipMonText: { color: '#fff', fontSize: 10, fontFamily: theme.font.bodyBold, textAlign: 'center', letterSpacing: 1 },
  dateChipDay: { backgroundColor: theme.colors.card, paddingVertical: 3, paddingBottom: 4 },
  dateChipDayText: { fontFamily: theme.font.displayBold, color: theme.colors.ink, textAlign: 'center' },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  eventTitle: { fontFamily: theme.font.displaySemibold, fontSize: 16, color: theme.colors.ink },
  clubBadge: { backgroundColor: theme.colors.grassPale, borderRadius: theme.radius.pill, paddingVertical: 2, paddingHorizontal: 8 },
  clubBadgeText: { fontSize: 10.5, fontFamily: theme.font.bodyBold, color: theme.colors.grassDeep },
  timeRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 2 },
  eventTime: { fontSize: 12.5, color: theme.colors.inkSoft, fontFamily: theme.font.bodyRegular },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
  goingBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: theme.colors.grassPale, borderRadius: theme.radius.pill, paddingVertical: 3, paddingHorizontal: 9 },
  goingText: { fontSize: 10.5, fontFamily: theme.font.bodyBold, color: theme.colors.grassDeep },
  notYetBadge: { borderWidth: theme.border.width, borderColor: theme.colors.line, borderRadius: theme.radius.pill, paddingVertical: 3, paddingHorizontal: 9 },
  notYetText: { fontSize: 10.5, fontFamily: theme.font.bodyBold, color: theme.colors.inkSoft },
  goingCount: { fontSize: 12, color: theme.colors.inkSoft, fontFamily: theme.font.bodySemibold },
  empty: { fontSize: 13.5, color: theme.colors.inkSoft, fontFamily: theme.font.bodySemibold, textAlign: 'center', paddingVertical: 32 },
});
