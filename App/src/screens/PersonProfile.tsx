import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Lock, Mail, MapPin, Phone } from 'lucide-react-native';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Avatar } from '../components/Avatar';
import { BackBar } from '../components/BackBar';
import { Card } from '../components/Card';
import { PillTag } from '../components/PillTag';
import { SectionLabel } from '../components/SectionLabel';
import { AppStackParamList } from '../navigation/types';
import { useAppState } from '../state/AppStateContext';
import { theme } from '../theme';

type Props = NativeStackScreenProps<AppStackParamList, 'PersonProfile'>;

export function PersonProfileScreen({ route, navigation }: Props) {
  const { personId } = route.params;
  const { directory, clubs: allClubs, wavedIds, sendWave, myProfileId } = useAppState();
  const p = directory.find((d) => d.id === personId);

  if (!p) {
    return (
      <View style={styles.screen}>
        <BackBar title="Neighbor" onBack={() => navigation.goBack()} />
      </View>
    );
  }

  if (p.isPrivate && p.id !== myProfileId) {
    return (
      <View style={styles.screen}>
        <BackBar title="Neighbor" onBack={() => navigation.goBack()} />
        <View style={styles.privateHero}>
          <Avatar initials={p.initials} bg={p.bg} photoUrl={p.avatarUrl} size={72} tilt={-4} />
          <Text style={styles.name}>{p.name}</Text>
        </View>
        <View style={styles.body}>
          <View style={styles.privateNotice}>
            <Lock size={16} color={theme.colors.inkSoft} />
            <Text style={styles.privateNoticeText}>This neighbor keeps their profile private — you can only see their name and shared interests.</Text>
          </View>
          {p.shared.length > 0 && (
            <>
              <SectionLabel>What you have in common</SectionLabel>
              <View style={styles.sharedWrap}>
                {p.shared.map((s) => (
                  <PillTag key={s}>{s} · you too</PillTag>
                ))}
              </View>
            </>
          )}
        </View>
      </View>
    );
  }

  const hi = wavedIds.includes(p.id) || p.connected;
  const clubs = p.clubs.map((id) => allClubs.find((c) => c.id === id)).filter((c): c is NonNullable<typeof c> => !!c);

  return (
    <View style={styles.screen}>
      <BackBar title="Neighbor" onBack={() => navigation.goBack()} />
      <ScrollView>
        <View style={styles.hero}>
          <Avatar initials={p.initials} bg={p.bg} photoUrl={p.avatarUrl} size={72} tilt={-4} />
          <View style={{ flex: 1 }}>
            <View style={styles.nameRow}>
              <Text style={styles.name}>{p.name}</Text>
              {p.isBoardMember && <PillTag tone="marigold">🏛 HOA Board</PillTag>}
            </View>
            <Text style={styles.meta}>
              {p.street} · here {p.tenure.toLowerCase()}
            </Text>
            <Text style={styles.job}>{p.job}</Text>
            {Number(p.helped) > 0 && <Text style={styles.helped}>Helped {p.helped} neighbors 🌟</Text>}
          </View>
        </View>

        <View style={styles.body}>
          <View style={styles.actionRow}>
            <Pressable onPress={() => sendWave(p.id)} style={[styles.hiBtn, { backgroundColor: hi ? theme.colors.paper : theme.colors.grass }]}>
              <Text style={[styles.hiText, { color: hi ? theme.colors.grassDeep : '#fff' }]}>
                {hi ? (p.connected ? 'Connected 🎉' : 'Wave sent 👋') : 'Say hi 👋'}
              </Text>
            </Pressable>
            <Pressable
              onPress={() => navigation.navigate('Tabs', { screen: 'Discover', params: { focusHouse: p.house } })}
              style={styles.mapBtn}
            >
              <MapPin size={15} color={theme.colors.marigold} />
              <Text style={styles.mapBtnText}>Map</Text>
            </Pressable>
          </View>

          {!!p.relation && <Text style={styles.relation}>↳ {p.relation}</Text>}

          {p.shared.length > 0 && (
            <>
              <SectionLabel>What you have in common</SectionLabel>
              <View style={styles.sharedWrap}>
                {p.shared.map((s) => (
                  <PillTag key={s}>{s} · you too</PillTag>
                ))}
              </View>
            </>
          )}

          <SectionLabel>About</SectionLabel>
          <Text style={styles.bio}>{p.bio}</Text>

          {p.family.length > 0 && (
            <>
              <SectionLabel>Their household</SectionLabel>
              <Card style={{ marginBottom: 20 }}>
                {p.family.map((f, i) => (
                  <View key={i} style={[styles.famRow, i < p.family.length - 1 && styles.rowBorder]}>
                    <Avatar
                      initials={f.name[0]}
                      bg={f.relation === 'Kid' ? theme.colors.marigoldSoft : f.relation === 'Pet' ? theme.colors.peach : theme.colors.sky}
                      size={34}
                      tilt={3}
                    />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.famName}>{f.name}</Text>
                      <Text style={styles.famMeta}>
                        {f.relation}
                        {f.petType ? ` · ${f.petType}` : ''}
                        {f.age ? ` · ${f.age}` : ''}
                      </Text>
                    </View>
                  </View>
                ))}
              </Card>
            </>
          )}

          {clubs.length > 0 && (
            <>
              <SectionLabel>In these clubs</SectionLabel>
              <View style={styles.clubsWrap}>
                {clubs.map((c) => (
                  <Pressable key={c.id} onPress={() => navigation.navigate('ClubProfile', { clubId: c.id })} style={styles.clubChip}>
                    <View style={[styles.clubIcon, { backgroundColor: c.accent }]}>
                      <Text style={{ fontSize: 14 }}>{c.emoji}</Text>
                    </View>
                    <Text style={styles.clubChipText}>{c.name}</Text>
                  </Pressable>
                ))}
              </View>
            </>
          )}

          {(!!p.phone || !!p.email) && (
            <>
              <SectionLabel>Contact</SectionLabel>
              <Card style={{ marginBottom: 16 }}>
                {!!p.phone && (
                  <View style={styles.contactRow}>
                    <Phone size={14} color={theme.colors.inkSoft} />
                    <Text style={styles.contactText}>{p.phone}</Text>
                  </View>
                )}
                {!!p.email && (
                  <View style={[styles.contactRow, !!p.phone && styles.rowBorder]}>
                    <Mail size={14} color={theme.colors.inkSoft} />
                    <Text style={styles.contactText}>{p.email}</Text>
                  </View>
                )}
              </Card>
              <Text style={styles.footnote}>Contact details are shared by neighbors who opted into the directory.</Text>
            </>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.colors.paper },
  hero: { backgroundColor: '#F1EBDD', borderBottomWidth: theme.border.strong, borderBottomColor: theme.colors.ink, padding: 20, paddingTop: 24, flexDirection: 'row', alignItems: 'center', gap: 16 },
  privateHero: {
    backgroundColor: '#F1EBDD',
    borderBottomWidth: theme.border.strong,
    borderBottomColor: theme.colors.ink,
    padding: 24,
    paddingTop: 32,
    alignItems: 'center',
    gap: 12,
  },
  privateNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: theme.colors.card,
    borderWidth: theme.border.width,
    borderColor: theme.colors.line,
    borderRadius: 14,
    padding: 14,
    marginBottom: 20,
  },
  privateNoticeText: { flex: 1, fontSize: 13, color: theme.colors.inkSoft, fontFamily: theme.font.bodyRegular, lineHeight: 13 * 1.4 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  name: { fontFamily: theme.font.displayBold, fontSize: 23, color: theme.colors.ink },
  meta: { fontSize: 13, color: theme.colors.inkSoft, fontFamily: theme.font.bodySemibold, marginTop: 2 },
  job: { fontSize: 12.5, color: theme.colors.ink, fontFamily: theme.font.bodySemibold },
  helped: { fontSize: 12, color: theme.colors.grassDeep, fontFamily: theme.font.bodyBold, marginTop: 2 },
  body: { padding: 20 },
  actionRow: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  hiBtn: { flex: 1, paddingVertical: 12, borderRadius: 14, borderWidth: theme.border.width, borderColor: theme.colors.grass, alignItems: 'center' },
  hiText: { fontFamily: theme.font.bodyBold, fontSize: 14 },
  mapBtn: { paddingVertical: 12, paddingHorizontal: 16, borderRadius: 14, backgroundColor: theme.colors.paper, borderWidth: theme.border.width, borderColor: theme.colors.line, flexDirection: 'row', alignItems: 'center', gap: 6 },
  mapBtnText: { fontFamily: theme.font.bodyBold, fontSize: 14, color: theme.colors.ink },
  relation: { fontSize: 12.5, color: theme.colors.grassDeep, fontFamily: theme.font.bodyBold, marginBottom: 18 },
  sharedWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 20 },
  bio: { fontSize: 14, color: theme.colors.ink, lineHeight: 14 * 1.55, marginBottom: 20, fontFamily: theme.font.bodyRegular },
  famRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 },
  rowBorder: { borderTopWidth: theme.border.width, borderTopColor: theme.colors.line },
  famName: { fontSize: 14, fontFamily: theme.font.bodyBold, color: theme.colors.ink },
  famMeta: { fontSize: 12, color: theme.colors.inkSoft, fontFamily: theme.font.bodyRegular },
  clubsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  clubChip: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: theme.colors.card, borderWidth: theme.border.width, borderColor: theme.colors.line, borderRadius: 999, paddingVertical: 6, paddingHorizontal: 12, paddingLeft: 6 },
  clubIcon: { borderWidth: 1.5, borderColor: theme.colors.ink, borderRadius: 10, width: 26, height: 26, alignItems: 'center', justifyContent: 'center' },
  clubChipText: { fontSize: 13, fontFamily: theme.font.bodyBold, color: theme.colors.ink },
  contactRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 6 },
  contactText: { fontSize: 13.5, color: theme.colors.ink, fontFamily: theme.font.bodySemibold },
  footnote: { fontSize: 11.5, color: theme.colors.inkSoft, fontFamily: theme.font.bodySemibold, textAlign: 'center' },
});
