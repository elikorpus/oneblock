import { RouteProp, useRoute } from '@react-navigation/native';
import { MapPin, Plus, Search, Trash2, X } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, Share, StyleSheet, Text, TextInput, View } from 'react-native';
import { Avatar } from '../components/Avatar';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Chip } from '../components/Chip';
import { Input } from '../components/Input';
import { PillTag } from '../components/PillTag';
import { PopIn } from '../components/PopIn';
import { SectionLabel } from '../components/SectionLabel';
import { buildEmptyStates } from '../data/emptyStates';
import { useAppNavigation } from '../navigation/useAppNavigation';
import { TabParamList } from '../navigation/types';
import { useAppState } from '../state/AppStateContext';
import { theme } from '../theme';
import { EmptyTab } from './empty';
import { HoodMap } from './HoodMap';

const VIEWS = ['map', 'pages'] as const;
const EMPTY_SPOT_DRAFT = { emoji: '📍', name: '', detail: '' };

async function inviteNeighbors(communityName: string, signupKey: string) {
  const place = communityName || 'my neighborhood';
  const codeLine = signupKey ? `\n\nUse code ${signupKey} to sign up.` : '';
  await Share.share({
    message: `Join me on Neighborly in ${place} — it's the private app just for our street.${codeLine}\n\nhttps://elikorpus.github.io/neighborly/`,
  });
}

export function DiscoverScreen() {
  const navigation = useAppNavigation();
  const route = useRoute<RouteProp<TabParamList, 'Discover'>>();
  const { directory, houses, spots, addSpot, communityName, signupKey, isBoardMember, deleteSpot } = useAppState();
  const [view, setView] = useState<(typeof VIEWS)[number]>('map');
  const [highlightHouse, setHighlightHouse] = useState<string | null>(route.params?.focusHouse ?? null);
  const [query, setQuery] = useState('');
  const [addingSpot, setAddingSpot] = useState(false);
  const [spotDraft, setSpotDraft] = useState(EMPTY_SPOT_DRAFT);

  useEffect(() => {
    if (route.params?.focusHouse) {
      setHighlightHouse(route.params.focusHouse);
      setView('map');
    }
  }, [route.params?.focusHouse]);

  if (directory.length === 0 && houses.length === 0)
    return (
      <EmptyTab
        config={buildEmptyStates(communityName).discover}
        communityName={communityName}
        isDiscover
        onCta={() => inviteNeighbors(communityName, signupKey)}
      />
    );

  const handleHousePress = (id: string) => {
    const house = houses.find((h) => h.id === id);
    if (house?.you) {
      navigation.navigate('Profile');
      return;
    }
    const person = directory.find((p) => p.house === id);
    if (person) navigation.navigate('PersonProfile', { personId: person.id });
    else navigation.navigate('HouseDetail', { houseId: id });
  };

  const selected = directory.find((d) => d.house === highlightHouse);
  const q = query.trim().toLowerCase();
  const filtered = q
    ? directory.filter((n) => [n.name, n.job, n.street, n.relation].join(' ').toLowerCase().includes(q))
    : directory;

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.headerBlock}>
        <Text style={styles.h1}>Your community</Text>
        <Text style={styles.lead}>{directory.length + 1} households · mapped by your neighbors.</Text>
      </View>

      <View style={styles.tabRow}>
        <Chip active={view === 'map'} onPress={() => setView('map')}>
          🗺️ Map
        </Chip>
        <Chip active={view === 'pages'} onPress={() => setView('pages')}>
          📒 Yellow Pages
        </Chip>
      </View>

      {view === 'map' ? (
        <>
          <View style={styles.mapWrap}>
            <HoodMap highlightHouse={highlightHouse} onHousePress={handleHousePress} />
          </View>

          {selected && (
            <PopIn style={{ marginTop: 16 }}>
              <Card style={{ borderColor: theme.colors.marigold, borderWidth: 2 }}>
                <View style={styles.selectedRow}>
                  <Avatar initials={selected.initials} bg={selected.bg} size={44} tilt={-3} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.selectedName}>{selected.name}</Text>
                    <Text style={styles.selectedStreet}>{selected.street}</Text>
                    <Text style={styles.selectedJob}>{selected.job}</Text>
                  </View>
                  <Pressable onPress={() => setHighlightHouse(null)} hitSlop={8}>
                    <X size={16} color={theme.colors.inkSoft} />
                  </Pressable>
                </View>
                <Pressable
                  style={styles.viewPageBtn}
                  onPress={() => navigation.navigate('PersonProfile', { personId: selected.id })}
                >
                  <Text style={styles.viewPageText}>View {selected.name.split(' ')[0]}'s page</Text>
                </Pressable>
              </Card>
            </PopIn>
          )}

          <View style={{ marginTop: 20 }}>
            <SectionLabel>Spots your neighbors added</SectionLabel>
            {spots.length === 0 && !addingSpot && (
              <Text style={styles.noSpots}>No spots yet — know a good taco truck or a great little library?</Text>
            )}
            {spots.map((s) => (
              <View key={s.id} style={styles.spotRow}>
                <Text style={{ fontSize: 18 }}>{s.emoji}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.spotName}>{s.name}</Text>
                  <Text style={styles.spotSub}>{s.detail}</Text>
                </View>
                {isBoardMember && (
                  <Pressable
                    hitSlop={8}
                    onPress={() =>
                      Alert.alert('Remove this spot?', 'This removes it for everyone in the community.', [
                        { text: 'Cancel', style: 'cancel' },
                        { text: 'Remove', style: 'destructive', onPress: () => deleteSpot(s.id) },
                      ])
                    }
                  >
                    <Trash2 size={15} color={theme.colors.inkSoft} />
                  </Pressable>
                )}
              </View>
            ))}
            {addingSpot ? (
              <Card style={{ marginTop: 12 }}>
                <View style={styles.rowGap}>
                  <View style={{ width: 64 }}>
                    <Input label="Emoji" value={spotDraft.emoji} onChangeText={(t) => setSpotDraft({ ...spotDraft, emoji: t })} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Input label="Name" value={spotDraft.name} onChangeText={(t) => setSpotDraft({ ...spotDraft, name: t })} placeholder="e.g. Taco truck" />
                  </View>
                </View>
                <Input
                  label="Detail"
                  value={spotDraft.detail}
                  onChangeText={(t) => setSpotDraft({ ...spotDraft, detail: t })}
                  placeholder="Where + when"
                />
                <View style={styles.rowGap}>
                  <View style={{ flex: 1 }}>
                    <Button
                      variant="dark"
                      size="md"
                      onPress={async () => {
                        if (!spotDraft.name.trim()) return;
                        await addSpot({ emoji: spotDraft.emoji.trim() || '📍', name: spotDraft.name.trim(), detail: spotDraft.detail.trim() });
                        setSpotDraft(EMPTY_SPOT_DRAFT);
                        setAddingSpot(false);
                      }}
                    >
                      Add spot
                    </Button>
                  </View>
                  <Button variant="outline" size="md" block={false} onPress={() => setAddingSpot(false)} style={{ paddingHorizontal: 16 }}>
                    Cancel
                  </Button>
                </View>
              </Card>
            ) : (
              <Pressable onPress={() => setAddingSpot(true)} style={styles.addSpotBtn}>
                <Plus size={14} color={theme.colors.grass} />
                <Text style={styles.addSpotText}>Add a spot</Text>
              </Pressable>
            )}
          </View>
        </>
      ) : (
        <>
          <View style={styles.searchRow}>
            <Search size={14} color={theme.colors.inkSoft} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search neighbors, professions, streets…"
              placeholderTextColor={theme.colors.inkSoft}
              style={styles.searchInput}
            />
          </View>
          <Card style={{ marginBottom: 16, backgroundColor: theme.colors.marigoldSoft, borderColor: '#EFD79A' }}>
            <Text style={styles.pagesNote}>
              📒 The Yellow Pages only show neighbors who opted in. Tap anyone to open their page — or the 📍 to find
              their house on the map.
            </Text>
          </Card>
          {filtered.map((n, i) => (
            <Card key={n.id} style={{ marginBottom: 12 }} onPress={() => navigation.navigate('PersonProfile', { personId: n.id })}>
              <View style={styles.dirRow}>
                <Avatar initials={n.initials} bg={n.bg} size={44} tilt={i % 2 ? 3 : -3} />
                <View style={{ flex: 1 }}>
                  <View style={styles.dirNameRow}>
                    <Text style={styles.dirName}>{n.name}</Text>
                    {n.isBoardMember && <PillTag tone="marigold">🏛 HOA</PillTag>}
                  </View>
                  <Text style={styles.dirJob}>{n.job}</Text>
                  <Text style={styles.dirRelation}>↳ {n.relation}</Text>
                </View>
                <Pressable
                  onPress={(e) => {
                    e.stopPropagation();
                    setHighlightHouse(n.house);
                    setView('map');
                  }}
                  style={styles.onMapBtn}
                >
                  <MapPin size={15} color={theme.colors.marigold} />
                  <Text style={styles.onMapText}>On map</Text>
                </Pressable>
              </View>
            </Card>
          ))}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 20, paddingBottom: 24 },
  headerBlock: { paddingTop: 24, paddingBottom: 12 },
  h1: { fontFamily: theme.font.displaySemibold, fontSize: 28, color: theme.colors.ink },
  lead: { fontSize: 14, color: theme.colors.inkSoft, marginTop: 4, fontFamily: theme.font.bodyRegular },
  tabRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  rowGap: { flexDirection: 'row', gap: 8 },
  noSpots: { fontSize: 12.5, color: theme.colors.inkSoft, fontFamily: theme.font.bodyRegular, paddingVertical: 8 },
  addSpotBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingTop: 12 },
  addSpotText: { color: theme.colors.grass, fontFamily: theme.font.bodyBold, fontSize: 13.5 },
  mapWrap: { borderRadius: 22, borderWidth: theme.border.width, borderColor: theme.colors.line, overflow: 'hidden' },
  selectedRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  selectedName: { fontFamily: theme.font.displaySemibold, fontSize: 17, color: theme.colors.ink },
  selectedStreet: { fontSize: 13, color: theme.colors.inkSoft, fontFamily: theme.font.bodyRegular },
  selectedJob: { fontSize: 12, color: theme.colors.grassDeep, fontFamily: theme.font.bodyBold, marginTop: 2 },
  viewPageBtn: { width: '100%', marginTop: 12, paddingVertical: 10, borderRadius: theme.radius.md, backgroundColor: theme.colors.grass, alignItems: 'center' },
  viewPageText: { color: '#fff', fontFamily: theme.font.bodyBold, fontSize: 13.5 },
  spotRow: { borderBottomWidth: theme.border.width, borderBottomColor: theme.colors.line, flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  spotName: { fontSize: 14, fontFamily: theme.font.bodyBold, color: theme.colors.ink },
  spotSub: { fontSize: 12, color: theme.colors.inkSoft, fontFamily: theme.font.bodyRegular },
  searchRow: {
    backgroundColor: theme.colors.card,
    borderWidth: theme.border.width,
    borderColor: theme.colors.line,
    borderRadius: theme.radius.pill,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  searchInput: { flex: 1, fontSize: 14, color: theme.colors.ink, fontFamily: theme.font.bodyRegular },
  pagesNote: { fontSize: 12.5, color: theme.colors.marigoldInk, fontFamily: theme.font.bodySemibold },
  dirRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  dirNameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  dirName: { fontFamily: theme.font.displaySemibold, fontSize: 16, color: theme.colors.ink },
  dirJob: { fontSize: 12.5, color: theme.colors.inkSoft, fontFamily: theme.font.bodyRegular },
  dirRelation: { fontSize: 12, color: theme.colors.grassDeep, fontFamily: theme.font.bodyBold, marginTop: 4 },
  onMapBtn: { alignItems: 'center', gap: 4 },
  onMapText: { fontSize: 9, fontFamily: theme.font.bodyBold, color: theme.colors.inkSoft, textTransform: 'uppercase' },
});
