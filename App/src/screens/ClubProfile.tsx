import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Calendar, Camera, Check, ChevronRight, MapPin, Send, Trash2 } from 'lucide-react-native';
import React, { useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Avatar } from '../components/Avatar';
import { BackBar } from '../components/BackBar';
import { Card } from '../components/Card';
import { ImageCropper } from '../components/ImageCropper';
import { PersonLink } from '../components/PersonLink';
import { SectionLabel } from '../components/SectionLabel';
import { confirmAndRun, notify } from '../lib/alert';
import { pickImage, uploadClubHeaderImage } from '../lib/uploadImage';
import { AppStackParamList } from '../navigation/types';
import { useAppState } from '../state/AppStateContext';
import { theme } from '../theme';

type Props = NativeStackScreenProps<AppStackParamList, 'ClubProfile'>;

export function ClubProfileScreen({ route, navigation }: Props) {
  const { clubId } = route.params;
  const { clubs, joinedClubIds, toggleClubJoined, clubEventRsvps, toggleClubEventRsvp, addClubPost, isBoardMember, deleteClubPost, events, myProfileId, updateClubHeaderImage } = useAppState();
  const club = clubs.find((c) => c.id === clubId);
  const joined = club ? joinedClubIds.includes(club.id) : false;
  const rsvp = club ? !!clubEventRsvps[club.id] : false;
  const clubEvents = club ? events.filter((e) => e.club?.id === club.id) : [];
  const [postDraft, setPostDraft] = useState('');
  const [uploadingHeader, setUploadingHeader] = useState(false);
  const [cropperUri, setCropperUri] = useState<string | null>(null);
  const canEditHeader = !!club && (isBoardMember || club.lead.id === myProfileId);

  const changeHeaderImage = async () => {
    if (!club) return;
    const uri = await pickImage();
    if (!uri) return;
    setCropperUri(uri);
  };

  const finishHeaderCrop = async (croppedUri: string) => {
    setCropperUri(null);
    if (!club) return;
    setUploadingHeader(true);
    const url = await uploadClubHeaderImage(club.id, croppedUri);
    setUploadingHeader(false);
    if (!url) {
      notify("Couldn't upload photo", 'Something went wrong uploading this photo. Try again.');
      return;
    }
    await updateClubHeaderImage(club.id, url);
  };

  if (!club) {
    return (
      <View style={styles.screen}>
        <BackBar title="Club" onBack={() => navigation.goBack()} />
      </View>
    );
  }

  const count = club.members + (joined ? 1 : 0);

  return (
    <View style={styles.screen}>
      <BackBar title="Club" onBack={() => navigation.goBack()} />
      <ImageCropper uri={cropperUri} aspect={[2, 1]} onCancel={() => setCropperUri(null)} onDone={finishHeaderCrop} />
      <ScrollView>
        <View style={[styles.hero, canEditHeader && styles.heroWithEditBtn, { backgroundColor: club.accent }]}>
          {!!club.headerUrl && <Image source={{ uri: club.headerUrl }} style={StyleSheet.absoluteFill} />}
          {!!club.headerUrl && <View style={[StyleSheet.absoluteFill, styles.heroScrim]} />}
          {canEditHeader && (
            <Pressable onPress={changeHeaderImage} disabled={uploadingHeader} style={styles.editHeaderBtn}>
              <Camera size={14} color="#fff" />
              <Text style={styles.editHeaderText}>{uploadingHeader ? 'Uploading…' : club.headerUrl ? 'Change photo' : 'Add photo'}</Text>
            </Pressable>
          )}
          <View style={styles.heroRow}>
            <View style={[styles.emojiBadge, theme.hardShadow('lg')]}>
              <Text style={{ fontSize: 32 }}>{club.emoji}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.clubName, club.headerUrl && { color: '#fff' }]}>{club.name}</Text>
              <Text style={[styles.tagline, { color: club.headerUrl ? '#fff' : club.accentDeep }]}>{club.tagline}</Text>
            </View>
          </View>
          <View style={styles.badgeRow}>
            {[`${count} members`, club.meets, club.since].filter(Boolean).map((s) => (
              <View key={s} style={styles.badge}>
                <Text style={styles.badgeText}>{s}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.body}>
          <Pressable
            onPress={() => toggleClubJoined(club.id)}
            style={[styles.joinBtn, { backgroundColor: joined ? theme.colors.paper : theme.colors.grass }]}
          >
            {joined ? (
              <View style={styles.rowCenter}>
                <Check size={16} color={theme.colors.grassDeep} />
                <Text style={[styles.joinBtnText, { color: theme.colors.grassDeep }]}>You're a member — welcome in</Text>
              </View>
            ) : (
              <Text style={[styles.joinBtnText, { color: '#fff' }]}>Join {club.name}</Text>
            )}
          </Pressable>

          {!!club.about && (
            <>
              <SectionLabel>About</SectionLabel>
              <Text style={styles.about}>{club.about}</Text>
            </>
          )}

          {!!club.next.title && (
            <>
              <SectionLabel>Next up</SectionLabel>
              <Card style={{ marginBottom: 20, borderColor: club.accentDeep, borderWidth: 2 }}>
                <Text style={styles.nextTitle}>{club.next.title}</Text>
                <View style={styles.nextMetaRow}>
                  <Calendar size={13} color={theme.colors.inkSoft} />
                  <Text style={styles.nextMeta}>{club.next.when} · </Text>
                  <MapPin size={13} color={theme.colors.inkSoft} />
                  <Text style={styles.nextMeta}>{club.next.where}</Text>
                </View>
                <Pressable
                  onPress={() => toggleClubEventRsvp(club.id)}
                  style={[styles.rsvpBtn, { backgroundColor: rsvp ? club.accentDeep : theme.colors.paper, borderColor: rsvp ? club.accentDeep : theme.colors.line }]}
                >
                  <Text style={[styles.rsvpText, { color: rsvp ? '#fff' : theme.colors.ink }]}>
                    {rsvp ? `✓ You're in — ${club.next.going} going` : `RSVP · ${club.next.going} going`}
                  </Text>
                </Pressable>
              </Card>
            </>
          )}

          {clubEvents.length > 0 && (
            <>
              <SectionLabel>Upcoming events</SectionLabel>
              {clubEvents.map((e) => (
                <Card key={e.id} onPress={() => navigation.navigate('EventDetail', { eventId: e.id })} style={{ marginBottom: 12 }}>
                  <View style={styles.rowCenter}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.leadName}>
                        {e.emoji} {e.title}
                      </Text>
                      <Text style={styles.leadJob}>
                        {e.mon} {e.day} · {e.time} · {e.going} going
                      </Text>
                    </View>
                    <ChevronRight size={16} color={theme.colors.inkSoft} />
                  </View>
                </Card>
              ))}
            </>
          )}

          <SectionLabel>Run by</SectionLabel>
          <Card style={{ marginBottom: 20 }}>
            <PersonLink personId={club.lead.id} style={styles.rowCenter}>
              <Avatar initials={club.lead.initials} bg={club.lead.bg} photoUrl={club.lead.avatarUrl} size={44} tilt={-3} />
              <View style={{ flex: 1 }}>
                <Text style={styles.leadName}>{club.lead.name}</Text>
                <Text style={styles.leadJob}>{club.lead.job}</Text>
                {!!club.spot && <Text style={styles.leadSpot}>Meets at {club.spot}</Text>}
              </View>
            </PersonLink>
          </Card>

          <SectionLabel>Members you know</SectionLabel>
          <View style={styles.membersRow}>
            <View style={{ flexDirection: 'row' }}>
              {club.roster.map((m, k) => (
                <View key={k} style={{ marginLeft: k ? -8 : 0 }}>
                  <Avatar initials={m.initials} bg={m.bg} photoUrl={m.photoUrl} size={36} />
                </View>
              ))}
            </View>
            <Text style={styles.moreMembers}>+{count - club.roster.length} more neighbors</Text>
          </View>

          {club.rules.length > 0 && (
            <>
              <SectionLabel>House rules</SectionLabel>
              <Card style={{ marginBottom: 20, backgroundColor: club.accent, borderColor: theme.colors.ink }}>
                {club.rules.map((r, i) => (
                  <View key={i} style={styles.ruleRow}>
                    <Text style={[styles.ruleIndex, { color: club.accentDeep }]}>{i + 1}.</Text>
                    <Text style={styles.ruleText}>{r}</Text>
                  </View>
                ))}
              </Card>
            </>
          )}

          <SectionLabel>Recent activity</SectionLabel>
          {joined && (
            <Card style={{ marginBottom: 12, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <TextInput
                value={postDraft}
                onChangeText={setPostDraft}
                placeholder={`Share something with ${club.name}…`}
                placeholderTextColor={theme.colors.inkSoft}
                style={styles.postInput}
              />
              <Pressable
                onPress={async () => {
                  const text = postDraft.trim();
                  if (!text) return;
                  setPostDraft('');
                  await addClubPost(club.id, text);
                }}
                style={styles.postSendBtn}
              >
                <Send size={16} color="#fff" />
              </Pressable>
            </Card>
          )}
          {club.posts.map((p) => (
            <Card key={p.id} style={{ marginBottom: 12 }}>
              <View style={styles.rowCenter}>
                <PersonLink personId={p.authorId} style={styles.rowCenter}>
                  <Avatar initials={p.initials} bg={p.bg} photoUrl={p.avatarUrl} size={36} tilt={3} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.postWho}>{p.who}</Text>
                    <Text style={styles.postText}>{p.text}</Text>
                  </View>
                </PersonLink>
                {isBoardMember && (
                  <Pressable
                    hitSlop={8}
                    onPress={() => confirmAndRun('Delete post?', 'This removes it for everyone in the club.', 'Delete', () => deleteClubPost(p.id))}
                  >
                    <Trash2 size={16} color={theme.colors.inkSoft} />
                  </Pressable>
                )}
              </View>
            </Card>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.colors.paper },
  hero: { borderBottomWidth: theme.border.strong, borderBottomColor: theme.colors.ink, paddingHorizontal: 20, paddingTop: 24, paddingBottom: 20, overflow: 'hidden' },
  // the "Change photo" button floats at the top-right of the hero — leave room
  // for it so a long club name never runs underneath it
  heroWithEditBtn: { paddingTop: 50 },
  heroScrim: { backgroundColor: 'rgba(0,0,0,.32)' },
  editHeaderBtn: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0,0,0,.55)',
    borderRadius: theme.radius.pill,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  editHeaderText: { color: '#fff', fontFamily: theme.font.bodyBold, fontSize: 11.5 },
  heroRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 16 },
  emojiBadge: { backgroundColor: theme.colors.card, borderWidth: theme.border.avatar, borderColor: theme.colors.ink, borderRadius: 20, width: 64, height: 64, alignItems: 'center', justifyContent: 'center', transform: [{ rotate: '-4deg' }] },
  clubName: { fontFamily: theme.font.displayBold, fontSize: 24, color: theme.colors.ink, lineHeight: 24 * 1.1 },
  tagline: { fontSize: 13.5, fontFamily: theme.font.bodyBold, marginTop: 4 },
  badgeRow: { flexDirection: 'row', gap: 8, marginTop: 16, flexWrap: 'wrap' },
  badge: { backgroundColor: 'rgba(255,255,255,.75)', borderWidth: theme.border.width, borderColor: theme.colors.ink, borderRadius: 999, paddingVertical: 4, paddingHorizontal: 10 },
  badgeText: { fontSize: 11, fontFamily: theme.font.bodyBold, color: theme.colors.ink },
  body: { padding: 20 },
  joinBtn: { width: '100%', paddingVertical: 14, marginBottom: 20, borderRadius: 14, borderWidth: 2, borderColor: theme.colors.grass, alignItems: 'center', justifyContent: 'center' },
  rowCenter: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  joinBtnText: { fontFamily: theme.font.bodyBold, fontSize: 15 },
  about: { fontSize: 14, color: theme.colors.ink, lineHeight: 14 * 1.55, marginBottom: 20, fontFamily: theme.font.bodyRegular },
  nextTitle: { fontFamily: theme.font.displaySemibold, fontSize: 17, color: theme.colors.ink },
  nextMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4, flexWrap: 'wrap' },
  nextMeta: { fontSize: 13, color: theme.colors.inkSoft, fontFamily: theme.font.bodySemibold },
  rsvpBtn: { width: '100%', marginTop: 12, paddingVertical: 10, borderRadius: 12, borderWidth: theme.border.width, alignItems: 'center' },
  rsvpText: { fontFamily: theme.font.bodyBold, fontSize: 13.5 },
  leadName: { fontSize: 15, fontFamily: theme.font.bodyBold, color: theme.colors.ink },
  leadJob: { fontSize: 12, color: theme.colors.inkSoft, fontFamily: theme.font.bodyRegular },
  leadSpot: { fontSize: 12, color: theme.colors.grassDeep, fontFamily: theme.font.bodyBold },
  membersRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  moreMembers: { fontSize: 12.5, color: theme.colors.inkSoft, fontFamily: theme.font.bodySemibold, paddingLeft: 16 },
  ruleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, paddingVertical: 4 },
  ruleIndex: { fontFamily: theme.font.displaySemibold, fontSize: 13 },
  ruleText: { fontSize: 13, fontFamily: theme.font.bodySemibold, color: theme.colors.ink, flex: 1 },
  postWho: { fontSize: 13, fontFamily: theme.font.bodyBold, color: theme.colors.ink },
  postText: { fontSize: 13.5, color: theme.colors.ink, marginTop: 2, fontFamily: theme.font.bodyRegular },
  postInput: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: theme.border.width,
    borderColor: theme.colors.line,
    borderRadius: theme.radius.pill,
    fontSize: 13.5,
    color: theme.colors.ink,
    backgroundColor: theme.colors.paper,
    fontFamily: theme.font.bodyRegular,
  },
  postSendBtn: { backgroundColor: theme.colors.grass, borderRadius: 999, width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
});
