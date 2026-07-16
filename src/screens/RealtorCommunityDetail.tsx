import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { BackBar } from '../components/BackBar';
import { Card } from '../components/Card';
import { ScoreRing } from '../components/ScoreRing';
import { SectionLabel } from '../components/SectionLabel';
import { CommunityBreakdown } from '../data/types';
import { RealtorStackParamList } from '../navigation/types';
import { useAppState } from '../state/AppStateContext';
import { theme } from '../theme';

type Props = NativeStackScreenProps<RealtorStackParamList, 'RealtorCommunityDetail'>;

function formatMinutes(mins: number | null): string {
  if (mins == null) return 'No asks answered yet';
  if (mins < 60) return `${Math.round(mins)} min average`;
  return `${(mins / 60).toFixed(1)} hr average`;
}

function formatRate(rate: number | null): string {
  return rate == null ? 'Not enough data yet' : `${Math.round(rate * 100)}%`;
}

export function RealtorCommunityDetailScreen({ route, navigation }: Props) {
  const { communityId, name } = route.params;
  const { fetchCommunityInsights } = useAppState();
  const [breakdown, setBreakdown] = useState<CommunityBreakdown | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchCommunityInsights(communityId).then((data) => {
      if (!cancelled) {
        setBreakdown(data);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [communityId, fetchCommunityInsights]);

  const rows = breakdown
    ? [
        {
          label: 'Households',
          value: `${breakdown.householdCount} of ${breakdown.housesTotal}`,
          note: breakdown.housesTotal > 0 ? `${Math.round((breakdown.householdCount / breakdown.housesTotal) * 100)}% of homes occupied on OneBlock` : 'No addresses on file yet',
        },
        { label: 'Families with kids', value: String(breakdown.kidsCount), note: 'households with kids in this community' },
        { label: 'Events', value: String(breakdown.eventsLast90d), note: 'in the last 90 days' },
        { label: 'Help-request response time', value: formatMinutes(breakdown.avgResponseMinutes), note: 'average time neighbors take to reply to an ask' },
        { label: 'Neighbor connection rate', value: formatRate(breakdown.connectedRate), note: 'residents who have waved at or been waved at by another neighbor' },
        { label: 'Club participation', value: formatRate(breakdown.clubParticipationRate), note: 'residents who belong to at least one club' },
        { label: 'New-neighbor welcome rate', value: formatRate(breakdown.welcomeRate), note: 'new neighbors (last 30 days) who got a wave' },
      ]
    : [];

  return (
    <View style={styles.screen}>
      <BackBar title={name} onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.content}>
        {loading ? (
          <ActivityIndicator color={theme.colors.grass} style={{ marginTop: 40 }} />
        ) : (
          <>
            <Card style={{ marginBottom: 20, alignItems: 'center', paddingVertical: 28 }}>
              {breakdown?.score != null ? (
                <ScoreRing score={breakdown.score} size={96} />
              ) : (
                <View style={styles.scorePlaceholder}>
                  <Text style={styles.scorePlaceholderText}>–</Text>
                </View>
              )}
              <Text style={styles.scoreName}>{name}</Text>
              <Text style={styles.scoreNote}>
                {breakdown?.score != null ? 'Anonymous, community-level data only' : 'Not enough data yet — this community is still filling in'}
              </Text>
            </Card>

            <SectionLabel>Score breakdown</SectionLabel>
            <Card>
              {rows.map((r, i) => (
                <View key={r.label} style={[styles.row, i > 0 && styles.rowBorder]}>
                  <View style={styles.rowHead}>
                    <Text style={styles.rowLabel}>{r.label}</Text>
                    <Text style={styles.rowValue}>{r.value}</Text>
                  </View>
                  <Text style={styles.rowNote}>{r.note}</Text>
                </View>
              ))}
            </Card>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.colors.paper },
  content: { padding: 20 },
  scorePlaceholder: { width: 96, height: 96, borderRadius: 48, borderWidth: 2, borderColor: theme.colors.line, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center' },
  scorePlaceholderText: { fontFamily: theme.font.displaySemibold, fontSize: 26, color: theme.colors.inkSoft },
  scoreName: { fontFamily: theme.font.displaySemibold, fontSize: 20, color: theme.colors.ink, marginTop: 14 },
  scoreNote: { fontSize: 12.5, color: theme.colors.inkSoft, fontFamily: theme.font.bodyRegular, marginTop: 4, textAlign: 'center' },
  row: { paddingVertical: 12 },
  rowBorder: { borderTopWidth: theme.border.width, borderTopColor: theme.colors.line },
  rowHead: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  rowLabel: { fontSize: 13.5, fontFamily: theme.font.bodyBold, color: theme.colors.ink, flex: 1 },
  rowValue: { fontSize: 13.5, fontFamily: theme.font.bodyBold, color: theme.colors.grassDeep, textAlign: 'right' },
  rowNote: { fontSize: 11.5, color: theme.colors.inkSoft, fontFamily: theme.font.bodyRegular, marginTop: 2 },
});
