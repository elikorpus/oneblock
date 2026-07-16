import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MapPin } from 'lucide-react-native';
import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Avatar } from '../components/Avatar';
import { BackBar } from '../components/BackBar';
import { Card } from '../components/Card';
import { PillTag } from '../components/PillTag';
import { AppStackParamList } from '../navigation/types';
import { useAppState } from '../state/AppStateContext';
import { theme } from '../theme';

type Props = NativeStackScreenProps<AppStackParamList, 'HouseDetail'>;

/** Reached by tapping an unclaimed house pin on the map. Claimed houses skip this and go
 * straight to PersonProfile — this screen still handles that case too, defensively. */
export function HouseDetailScreen({ route, navigation }: Props) {
  const { houseId } = route.params;
  const { houses, directory } = useAppState();
  const house = houses.find((h) => h.id === houseId);
  const resident = directory.find((p) => p.house === houseId);

  if (!house) {
    return (
      <View style={styles.screen}>
        <BackBar title="House" onBack={() => navigation.goBack()} />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <BackBar title="House" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.addressRow}>
          <MapPin size={18} color={theme.colors.grass} />
          <Text style={styles.address}>{house.address}</Text>
        </View>

        {resident ? (
          <Card style={{ marginTop: 20 }} onPress={() => navigation.navigate('PersonProfile', { personId: resident.id })}>
            <View style={styles.residentRow}>
              <Avatar initials={resident.initials} bg={resident.bg} size={48} tilt={-3} />
              <View style={{ flex: 1 }}>
                <View style={styles.nameRow}>
                  <Text style={styles.residentName}>{resident.name}</Text>
                  {resident.isBoardMember && <PillTag tone="marigold">🏛 HOA</PillTag>}
                </View>
                <Text style={styles.residentJob}>{resident.job}</Text>
              </View>
            </View>
            <Text style={styles.viewProfile}>View full profile →</Text>
          </Card>
        ) : (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyEmoji}>🏡</Text>
            <Text style={styles.emptyTitle}>No one has claimed this property yet.</Text>
            <Text style={styles.emptyBody}>When a neighbor moves in and joins OneBlock, their page will show up here.</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.colors.paper },
  content: { padding: 20 },
  addressRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  address: { fontFamily: theme.font.displaySemibold, fontSize: 22, color: theme.colors.ink, flexShrink: 1 },
  residentRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  residentName: { fontFamily: theme.font.displaySemibold, fontSize: 17, color: theme.colors.ink },
  residentJob: { fontSize: 13, color: theme.colors.inkSoft, fontFamily: theme.font.bodyRegular, marginTop: 2 },
  viewProfile: { fontSize: 12.5, fontFamily: theme.font.bodyBold, color: theme.colors.grassDeep, marginTop: 12 },
  emptyCard: {
    marginTop: 32,
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 20,
    backgroundColor: theme.colors.card,
    borderWidth: theme.border.width,
    borderColor: theme.colors.line,
    borderRadius: 20,
  },
  emptyEmoji: { fontSize: 36, marginBottom: 12 },
  emptyTitle: { fontFamily: theme.font.displaySemibold, fontSize: 17, color: theme.colors.ink, textAlign: 'center' },
  emptyBody: { fontSize: 13, color: theme.colors.inkSoft, fontFamily: theme.font.bodyRegular, textAlign: 'center', marginTop: 8, lineHeight: 13 * 1.4 },
});
