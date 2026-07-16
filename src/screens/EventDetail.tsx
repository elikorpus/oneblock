import { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as ExpoCalendar from 'expo-calendar';
import { Calendar, Check, MapPin } from 'lucide-react-native';
import React, { useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Avatar } from '../components/Avatar';
import { BackBar } from '../components/BackBar';
import { Card } from '../components/Card';
import { PersonLink } from '../components/PersonLink';
import { SectionLabel } from '../components/SectionLabel';
import { EventItem } from '../data/types';
import { confirmAndRun, notify } from '../lib/alert';
import { AppStackParamList } from '../navigation/types';
import { useAppState } from '../state/AppStateContext';
import { theme } from '../theme';

type Props = NativeStackScreenProps<AppStackParamList, 'EventDetail'>;

const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

function parseEventStart(ev: EventItem): Date {
  const now = new Date();
  const monthIndex = MONTHS.indexOf(ev.mon.toUpperCase());
  const dayNum = parseInt(ev.day, 10);
  let hours = 12;
  let minutes = 0;
  const m = ev.time.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
  if (m) {
    hours = parseInt(m[1], 10) % 24;
    minutes = parseInt(m[2], 10);
    const ampm = m[3]?.toUpperCase();
    if (ampm === 'PM' && hours < 12) hours += 12;
    if (ampm === 'AM' && hours === 12) hours = 0;
  }
  return new Date(now.getFullYear(), monthIndex >= 0 ? monthIndex : now.getMonth(), isNaN(dayNum) ? now.getDate() : dayNum, hours, minutes);
}

async function addToDeviceCalendar(ev: EventItem) {
  if (Platform.OS === 'web') {
    notify('Not available on web', "You can't add events to the calendar on the web — try this from the OneBlock app on your phone.");
    return;
  }
  const perm = await ExpoCalendar.requestCalendarPermissions();
  if (!perm.granted) {
    notify('Calendar access needed', 'Enable calendar access for OneBlock in Settings to add this event.');
    return;
  }
  const calendars = await ExpoCalendar.getCalendars(ExpoCalendar.EntityTypes.EVENT);
  const target = calendars.find((c) => c.allowsModifications) ?? calendars[0];
  if (!target) {
    notify('No calendar found', "We couldn't find a calendar on this device to add the event to.");
    return;
  }
  const startDate = parseEventStart(ev);
  const endDate = new Date(startDate.getTime() + 60 * 60 * 1000);
  await target.createEvent({ title: ev.title, startDate, endDate, location: ev.where, notes: ev.desc });
  notify('Added', `${ev.title} is now on your calendar.`);
}

export function EventDetailScreen({ route, navigation }: Props) {
  const { eventId } = route.params;
  const { events, eventRsvps, toggleEventRsvp, isBoardMember, deleteEvent } = useAppState();
  const ev = events.find((e) => e.id === eventId);
  const [addingToCalendar, setAddingToCalendar] = useState(false);

  if (!ev) {
    return (
      <View style={styles.screen}>
        <BackBar title="Event" onBack={() => navigation.goBack()} />
      </View>
    );
  }

  const going = eventRsvps[ev.id];
  const count = ev.going + (going === ev.rsvp ? 0 : going ? 1 : -1);

  return (
    <View style={styles.screen}>
      <BackBar
        title="Event"
        onBack={() => navigation.goBack()}
        right={
          going ? (
            <View style={styles.goingBadge}>
              <Text style={styles.goingBadgeText}>Going</Text>
            </View>
          ) : undefined
        }
      />
      <ScrollView>
        <View style={[styles.hero, { backgroundColor: ev.accent }]}>
          <View style={styles.heroRow}>
            <View style={[styles.emojiBadge, theme.hardShadow('lg')]}>
              <Text style={{ fontSize: 30 }}>{ev.emoji}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>{ev.title}</Text>
              <View style={[styles.metaRow, { marginTop: 6 }]}>
                <Calendar size={13} color={ev.accentDeep} />
                <Text style={[styles.metaText, { color: ev.accentDeep }]}>
                  {ev.mon} {ev.day} · {ev.time}
                </Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.body}>
          <Card style={{ marginBottom: 16, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <MapPin size={16} color={theme.colors.grass} />
            <Text style={styles.whereText}>{ev.where}</Text>
          </Card>

          <SectionLabel>Details</SectionLabel>
          <Text style={styles.desc}>{ev.desc}</Text>

          <SectionLabel>Hosted by</SectionLabel>
          <Card style={{ marginBottom: 20 }}>
            <PersonLink personId={'id' in ev.host ? ev.host.id : undefined} style={styles.rowCenter}>
              <Avatar initials={ev.host.initials} bg={ev.host.bg} size={40} tilt={-3} />
              <View style={{ flex: 1 }}>
                <Text style={styles.hostName}>{ev.host.name}</Text>
                <Text style={styles.hostRole}>Organizer</Text>
              </View>
            </PersonLink>
          </Card>

          <SectionLabel>Who's going</SectionLabel>
          <View style={styles.rosterRow}>
            <View style={{ flexDirection: 'row' }}>
              {ev.roster.map((m, k) => (
                <View key={k} style={{ marginLeft: k ? -8 : 0 }}>
                  <Avatar initials={m.initials} bg={m.bg} size={36} />
                </View>
              ))}
            </View>
            <Text style={styles.moreRoster}>+{count - ev.roster.length} more neighbors</Text>
          </View>

          <Pressable
            onPress={() => toggleEventRsvp(ev.id)}
            style={[styles.rsvpBtn, { backgroundColor: going ? theme.colors.paper : theme.colors.grass }]}
          >
            {going ? (
              <View style={styles.rowCenter}>
                <Check size={16} color={theme.colors.grassDeep} />
                <Text style={[styles.rsvpText, { color: theme.colors.grassDeep }]}>You're going — {count} in</Text>
              </View>
            ) : (
              <Text style={[styles.rsvpText, { color: '#fff' }]}>RSVP · {count} going</Text>
            )}
          </Pressable>
          <Pressable
            style={styles.calendarBtn}
            disabled={addingToCalendar}
            onPress={async () => {
              setAddingToCalendar(true);
              try {
                await addToDeviceCalendar(ev);
              } catch {
                notify('Couldn’t add event', 'Something went wrong adding this to your calendar.');
              } finally {
                setAddingToCalendar(false);
              }
            }}
          >
            <Text style={styles.calendarBtnText}>{addingToCalendar ? 'Adding…' : 'Add to my calendar'}</Text>
          </Pressable>
          {isBoardMember && (
            <Pressable
              style={styles.deleteBtn}
              onPress={() =>
                confirmAndRun('Delete this event?', 'This removes it for everyone and cancels all RSVPs.', 'Delete', async () => {
                  await deleteEvent(ev.id);
                  navigation.goBack();
                })
              }
            >
              <Text style={styles.deleteBtnText}>Delete event (board)</Text>
            </Pressable>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.colors.paper },
  goingBadge: { backgroundColor: theme.colors.grassPale, borderRadius: 999, paddingVertical: 4, paddingHorizontal: 10 },
  goingBadgeText: { fontSize: 11, fontFamily: theme.font.bodyBold, color: theme.colors.grassDeep },
  hero: { borderBottomWidth: theme.border.strong, borderBottomColor: theme.colors.ink, paddingHorizontal: 20, paddingVertical: 22 },
  heroRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 14 },
  emojiBadge: { backgroundColor: theme.colors.card, borderWidth: theme.border.avatar, borderColor: theme.colors.ink, borderRadius: 18, width: 60, height: 60, alignItems: 'center', justifyContent: 'center', transform: [{ rotate: '-4deg' }] },
  title: { fontFamily: theme.font.displayBold, fontSize: 23, color: theme.colors.ink, lineHeight: 23 * 1.12 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  metaText: { fontSize: 13, fontFamily: theme.font.bodyBold },
  body: { padding: 20 },
  whereText: { fontSize: 14, fontFamily: theme.font.bodySemibold, color: theme.colors.ink },
  desc: { fontSize: 14, color: theme.colors.ink, lineHeight: 14 * 1.55, marginBottom: 20, fontFamily: theme.font.bodyRegular },
  rowCenter: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  hostName: { fontSize: 14, fontFamily: theme.font.bodyBold, color: theme.colors.ink },
  hostRole: { fontSize: 12, color: theme.colors.inkSoft, fontFamily: theme.font.bodyRegular },
  rosterRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  moreRoster: { fontSize: 12.5, color: theme.colors.inkSoft, fontFamily: theme.font.bodySemibold, paddingLeft: 16 },
  rsvpBtn: { width: '100%', paddingVertical: 14, borderRadius: 16, borderWidth: 2, borderColor: theme.colors.grass, alignItems: 'center', justifyContent: 'center' },
  rsvpText: { fontFamily: theme.font.bodyBold, fontSize: 15 },
  calendarBtn: { width: '100%', marginTop: 10, paddingVertical: 12, borderRadius: 14, borderWidth: theme.border.width, borderColor: theme.colors.line, alignItems: 'center' },
  deleteBtn: { width: '100%', marginTop: 10, paddingVertical: 12, borderRadius: 14, alignItems: 'center' },
  deleteBtnText: { color: theme.colors.red, fontFamily: theme.font.bodyBold, fontSize: 13.5 },
  calendarBtnText: { color: theme.colors.ink, fontFamily: theme.font.bodyBold, fontSize: 14 },
});
