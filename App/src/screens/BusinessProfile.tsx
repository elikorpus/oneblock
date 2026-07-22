import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Globe, MapPin, Phone, Trash2 } from 'lucide-react-native';
import React from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { BackBar } from '../components/BackBar';
import { Card } from '../components/Card';
import { PillTag } from '../components/PillTag';
import { SectionLabel } from '../components/SectionLabel';
import { StarRating } from '../components/StarRating';
import { confirmAndRun } from '../lib/alert';
import { AppStackParamList } from '../navigation/types';
import { useAppState } from '../state/AppStateContext';
import { theme } from '../theme';

type Props = NativeStackScreenProps<AppStackParamList, 'BusinessProfile'>;

export function BusinessProfileScreen({ route, navigation }: Props) {
  const { businessId } = route.params;
  const { businesses, isBoardMember, deleteBusiness, rateBusiness } = useAppState();
  const business = businesses.find((b) => b.id === businessId);

  if (!business) {
    return (
      <View style={styles.screen}>
        <BackBar title="Business" onBack={() => navigation.goBack()} />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <BackBar title="Business" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.body}>
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.name}>{business.name}</Text>
            {!!business.category && <Text style={styles.category}>{business.category}</Text>}
          </View>
          {business.isSponsored && <PillTag tone="marigold">✨ Sponsored</PillTag>}
        </View>

        <View style={styles.ratingRow}>
          <StarRating value={business.avgRating ?? 0} size={18} />
          <Text style={styles.ratingCount}>
            {business.avgRating ? `${business.avgRating.toFixed(1)} · ${business.ratingCount} rating${business.ratingCount === 1 ? '' : 's'}` : 'No ratings yet'}
          </Text>
        </View>

        {!!business.description && (
          <>
            <SectionLabel>About</SectionLabel>
            <Text style={styles.description}>{business.description}</Text>
          </>
        )}

        {(!!business.phone || !!business.website || !!business.address) && (
          <>
            <SectionLabel>Contact</SectionLabel>
            <Card style={{ marginBottom: 20 }}>
              {!!business.phone && (
                <Pressable style={styles.contactRow} onPress={() => Linking.openURL(`tel:${business.phone}`)}>
                  <Phone size={16} color={theme.colors.grassDeep} />
                  <Text style={styles.contactText}>{business.phone}</Text>
                </Pressable>
              )}
              {!!business.website && (
                <Pressable
                  style={styles.contactRow}
                  onPress={() => Linking.openURL(/^https?:\/\//.test(business.website) ? business.website : `https://${business.website}`)}
                >
                  <Globe size={16} color={theme.colors.grassDeep} />
                  <Text style={styles.contactText}>{business.website}</Text>
                </Pressable>
              )}
              {!!business.address && (
                <View style={styles.contactRow}>
                  <MapPin size={16} color={theme.colors.grassDeep} />
                  <Text style={styles.contactText}>{business.address}</Text>
                </View>
              )}
            </Card>
          </>
        )}

        <SectionLabel>Rate this business</SectionLabel>
        <Card style={{ marginBottom: 20, alignItems: 'center' }}>
          <StarRating value={business.myRating ?? 0} onRate={(n) => rateBusiness(business.id, n)} size={32} />
          <Text style={styles.rateHint}>{business.myRating ? `You rated this ${business.myRating} star${business.myRating === 1 ? '' : 's'}` : 'Tap a star to rate'}</Text>
        </Card>

        {isBoardMember && (
          <Pressable
            style={styles.deleteBtn}
            onPress={() =>
              confirmAndRun('Remove this listing?', 'This removes it for everyone in the community.', 'Remove', () => {
                deleteBusiness(business.id);
                navigation.goBack();
              })
            }
          >
            <Trash2 size={15} color={theme.colors.red} />
            <Text style={styles.deleteText}>Remove listing</Text>
          </Pressable>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.colors.paper },
  body: { padding: 20, paddingBottom: 40 },
  headerRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  name: { fontFamily: theme.font.displayBold, fontSize: 24, color: theme.colors.ink },
  category: { fontSize: 13, color: theme.colors.inkSoft, fontFamily: theme.font.bodySemibold, marginTop: 2 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 12, marginBottom: 16 },
  ratingCount: { fontSize: 12.5, color: theme.colors.inkSoft, fontFamily: theme.font.bodySemibold },
  description: { fontSize: 14, color: theme.colors.ink, lineHeight: 14 * 1.55, marginBottom: 20, fontFamily: theme.font.bodyRegular },
  contactRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8 },
  contactText: { fontSize: 14, color: theme.colors.ink, fontFamily: theme.font.bodySemibold },
  rateHint: { fontSize: 12.5, color: theme.colors.inkSoft, fontFamily: theme.font.bodySemibold, marginTop: 10 },
  deleteBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 12, marginTop: 8 },
  deleteText: { color: theme.colors.red, fontFamily: theme.font.bodyBold, fontSize: 13.5 },
});
