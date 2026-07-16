import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { LogOut } from 'lucide-react-native';
import React, { useMemo } from 'react';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Card } from '../components/Card';
import { ScoreRing } from '../components/ScoreRing';
import { RealtorStackParamList } from '../navigation/types';
import { useAppState } from '../state/AppStateContext';
import { theme } from '../theme';

type Props = NativeStackScreenProps<RealtorStackParamList, 'RealtorCommunities'>;

export function RealtorCommunitiesScreen({ navigation }: Props) {
  const { realtorProfile, neighborhoods, logout } = useAppState();

  const sorted = useMemo(() => [...neighborhoods].sort((a, b) => (b.score ?? -1) - (a.score ?? -1)), [neighborhoods]);

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <View>
          <Text style={styles.wordmark}>
            oneblock<Text style={{ color: theme.colors.grass }}>.</Text>
          </Text>
          <Text style={styles.subtitle}>{realtorProfile?.name ? `${realtorProfile.name} · Realtor` : 'Realtor'}</Text>
        </View>
        <Pressable onPress={logout} style={styles.logoutBtn} hitSlop={8}>
          <LogOut size={18} color={theme.colors.inkSoft} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.h1}>Every community on OneBlock</Text>
        <Text style={styles.lead}>Scores are computed from anonymous, community-level activity — never individual residents.</Text>

        {sorted.length === 0 && <Text style={styles.empty}>No communities yet.</Text>}

        {sorted.map((n) => (
          <Card key={n.id} style={{ marginBottom: 12 }} onPress={() => navigation.navigate('RealtorCommunityDetail', { communityId: n.id, name: n.name })}>
            <View style={styles.row}>
              {n.score != null ? (
                <ScoreRing score={n.score} size={56} color={n.score > 75 ? theme.colors.skyDeep : n.score > 40 ? theme.colors.grass : theme.colors.marigold} />
              ) : (
                <View style={styles.placeholder}>
                  <Text style={styles.placeholderText}>–</Text>
                </View>
              )}
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{n.name}</Text>
                <Text style={styles.meta}>
                  {n.householdCount} household{n.householdCount === 1 ? '' : 's'} · {n.eventsPerMonth} events/mo
                  {n.kidsCount > 0 ? ` · ${n.kidsCount} with kids` : ''}
                </Text>
              </View>
            </View>
          </Card>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.colors.paper },
  header: {
    borderBottomWidth: theme.border.width,
    borderBottomColor: theme.colors.line,
    paddingHorizontal: 20,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.paper,
  },
  wordmark: { fontFamily: theme.font.displayBold, fontSize: 18, color: theme.colors.ink },
  subtitle: { fontSize: 12, color: theme.colors.inkSoft, fontFamily: theme.font.bodySemibold, marginTop: 2 },
  logoutBtn: { padding: 6 },
  content: { padding: 20 },
  h1: { fontFamily: theme.font.displaySemibold, fontSize: 26, color: theme.colors.ink },
  lead: { fontSize: 13.5, color: theme.colors.inkSoft, marginTop: 6, marginBottom: 20, fontFamily: theme.font.bodyRegular, lineHeight: 13.5 * 1.4 },
  empty: { fontSize: 13.5, color: theme.colors.inkSoft, fontFamily: theme.font.bodySemibold, textAlign: 'center', paddingVertical: 32 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  placeholder: { width: 56, height: 56, borderRadius: 28, borderWidth: 2, borderColor: theme.colors.line, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center' },
  placeholderText: { fontFamily: theme.font.displaySemibold, fontSize: 20, color: theme.colors.inkSoft },
  name: { fontFamily: theme.font.displaySemibold, fontSize: 17, color: theme.colors.ink },
  meta: { fontSize: 12.5, color: theme.colors.inkSoft, fontFamily: theme.font.bodyRegular, marginTop: 2 },
});
