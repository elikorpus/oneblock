import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { TrendingUp } from 'lucide-react-native';
import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Avatar } from '../components/Avatar';
import { BackBar } from '../components/BackBar';
import { Card } from '../components/Card';
import { ScoreRing } from '../components/ScoreRing';
import { SectionLabel } from '../components/SectionLabel';
import { AppStackParamList } from '../navigation/types';
import { useAppState } from '../state/AppStateContext';
import { theme } from '../theme';

type Props = NativeStackScreenProps<AppStackParamList, 'Sell'>;

const REALTOR_PALETTE = [theme.colors.marigoldSoft, theme.colors.sky, theme.colors.mint, theme.colors.blush, theme.colors.lilac];

function realtorAvatar(id: string, name: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  const parts = name.trim().split(/\s+/);
  const initials = ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase() || '?';
  return { initials, bg: REALTOR_PALETTE[hash % REALTOR_PALETTE.length] };
}

export function SellScreen({ navigation }: Props) {
  const { communityName, houses, profile, neighborhoodScore, neighborhoodTrends, neighborhoods, realtors, submitHomeLead } = useAppState();
  const [sentLeads, setSentLeads] = useState<Record<string, boolean>>({});

  const myHouse = houses.find((h) => h.you);
  const myAddress = myHouse?.address || profile.street || 'your address';

  const sendLead = async (key: string, kind: 'list' | 'valuation' | 'realtor_contact', realtorId?: string) => {
    if (sentLeads[key]) return;
    setSentLeads((s) => ({ ...s, [key]: true }));
    await submitHomeLead(kind, realtorId);
  };

  return (
    <View style={styles.screen}>
      <BackBar title="Sell & explore" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.content}>
        <Card style={{ marginBottom: 20, backgroundColor: theme.colors.ink, borderWidth: 0 }}>
          <Text style={styles.homeLabel}>Your home · {myAddress}</Text>
          <Text style={styles.homeSub}>
            OneBlock doesn't guess a number — a certified realtor gives you a real walkthrough valuation.
          </Text>
          <View style={styles.homeActions}>
            <Pressable style={styles.listBtn} onPress={() => sendLead('list', 'list')}>
              <Text style={styles.listBtnText}>{sentLeads.list ? 'Request sent ✓' : 'List my home'}</Text>
            </Pressable>
            <Pressable style={styles.valuationBtn} onPress={() => sendLead('valuation', 'valuation')}>
              <Text style={styles.valuationBtnText}>{sentLeads.valuation ? 'Request sent ✓' : 'Get a valuation'}</Text>
            </Pressable>
          </View>
        </Card>

        <SectionLabel>Your neighborhood score</SectionLabel>
        <Card style={{ marginBottom: 20 }}>
          <View style={styles.scoreRow}>
            {neighborhoodScore != null ? (
              <ScoreRing score={neighborhoodScore} size={72} />
            ) : (
              <View style={styles.scorePlaceholder}>
                <Text style={styles.scorePlaceholderText}>–</Text>
              </View>
            )}
            <View style={{ flex: 1 }}>
              <Text style={styles.scoreName}>{communityName || 'Your community'}</Text>
              {neighborhoodScore != null ? (
                <View style={styles.trendRow}>
                  <TrendingUp size={13} color={theme.colors.grassDeep} />
                  <Text style={styles.trendText}>Computed from real activity in your community</Text>
                </View>
              ) : (
                <Text style={styles.scoreNote}>Not enough data yet — a score appears once neighbors join in.</Text>
              )}
              <Text style={styles.scoreNote}>Anonymous, community-level data only</Text>
            </View>
          </View>
          {neighborhoodTrends.length > 0 && (
            <View style={{ marginTop: 16 }}>
              {neighborhoodTrends.map((t, i) => (
                <View key={t.label} style={[styles.trendItemRow, i > 0 && styles.trendItemBorder]}>
                  <TrendingUp size={14} color={theme.colors.grass} style={{ marginTop: 2 }} />
                  <View style={{ flex: 1 }}>
                    <View style={styles.trendItemHead}>
                      <Text style={styles.trendItemLabel}>{t.label}</Text>
                      <Text style={styles.trendItemValue}>{t.value}</Text>
                    </View>
                    <Text style={styles.trendItemNote}>{t.note}</Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </Card>

        <SectionLabel>Certified realtors</SectionLabel>
        {realtors.length === 0 ? (
          <Card style={{ marginBottom: 20 }}>
            <Text style={styles.emptyNote}>No certified realtors in {communityName || 'your community'} yet.</Text>
          </Card>
        ) : (
          realtors.map((r) => {
            const av = realtorAvatar(r.id, r.name);
            const key = `realtor-${r.id}`;
            return (
              <Card key={r.id} style={{ marginBottom: 12 }}>
                <View style={styles.realtorRow}>
                  <Avatar initials={av.initials} bg={av.bg} size={44} tilt={-3} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.realtorName}>{r.name}</Text>
                    <Text style={styles.realtorTag}>{r.tag}</Text>
                    <Text style={styles.realtorDeals}>{r.dealsNote}</Text>
                  </View>
                  <Pressable style={styles.contactBtn} onPress={() => sendLead(key, 'realtor_contact', r.id)}>
                    <Text style={styles.contactBtnText}>{sentLeads[key] ? 'Sent ✓' : 'Contact'}</Text>
                  </Pressable>
                </View>
              </Card>
            );
          })
        )}

        <SectionLabel>Explore neighborhoods</SectionLabel>
        {neighborhoods.length === 0 ? (
          <Text style={styles.footnote}>Neighborhood comparisons will show up here as more communities join OneBlock.</Text>
        ) : (
          neighborhoods.map((n) => (
            <Card key={n.id} style={[{ marginBottom: 12 }, n.you && { borderColor: theme.colors.grass, borderWidth: 2 }]}>
              <View style={styles.nRow}>
                {n.score != null ? (
                  <ScoreRing score={n.score} size={56} color={n.you ? theme.colors.grass : n.score > 75 ? theme.colors.skyDeep : theme.colors.marigold} />
                ) : (
                  <View style={styles.nScorePlaceholder}>
                    <Text style={styles.scorePlaceholderText}>–</Text>
                  </View>
                )}
                <View style={{ flex: 1 }}>
                  <View style={styles.nHead}>
                    <Text style={styles.nName}>{n.name}</Text>
                    {n.you && (
                      <View style={styles.youBadge}>
                        <Text style={styles.youBadgeText}>You</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.nMeta}>
                    {n.householdCount} household{n.householdCount === 1 ? '' : 's'} · {n.eventsPerMonth} events/mo
                    {n.kidsCount > 0 ? ` · ${n.kidsCount} with kids` : ''}
                  </Text>
                </View>
              </View>
            </Card>
          ))
        )}
        <Text style={styles.footnote}>Scores come from anonymous community activity — never individual neighbors.</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.colors.paper },
  content: { padding: 20 },
  homeLabel: { fontSize: 11, fontFamily: theme.font.bodyBold, color: theme.colors.onInkSoft, textTransform: 'uppercase', letterSpacing: 0.6 },
  homeSub: { fontSize: 13, color: theme.colors.onInkSoft, fontFamily: theme.font.bodySemibold, marginTop: 6, lineHeight: 13 * 1.4 },
  homeActions: { flexDirection: 'row', gap: 8, marginTop: 16 },
  listBtn: { flex: 1, paddingVertical: 10, borderRadius: 12, backgroundColor: theme.colors.marigold, alignItems: 'center' },
  listBtnText: { color: theme.colors.ink, fontFamily: theme.font.bodyBold, fontSize: 13 },
  valuationBtn: { flex: 1, paddingVertical: 10, borderRadius: 12, borderWidth: theme.border.width, borderColor: '#4A443A', alignItems: 'center' },
  valuationBtnText: { color: theme.colors.paper, fontFamily: theme.font.bodyBold, fontSize: 13 },
  scoreRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  scorePlaceholder: { width: 72, height: 72, borderRadius: 36, borderWidth: 2, borderColor: theme.colors.line, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center' },
  nScorePlaceholder: { width: 56, height: 56, borderRadius: 28, borderWidth: 2, borderColor: theme.colors.line, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center' },
  scorePlaceholderText: { fontFamily: theme.font.displaySemibold, fontSize: 20, color: theme.colors.inkSoft },
  scoreName: { fontFamily: theme.font.displaySemibold, fontSize: 18, color: theme.colors.ink },
  trendRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  trendText: { fontSize: 12.5, color: theme.colors.grassDeep, fontFamily: theme.font.bodyBold, flexShrink: 1 },
  scoreNote: { fontSize: 12, color: theme.colors.inkSoft, marginTop: 2, fontFamily: theme.font.bodyRegular },
  trendItemRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, paddingVertical: 10 },
  trendItemBorder: { borderTopWidth: theme.border.width, borderTopColor: theme.colors.line },
  trendItemHead: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  trendItemLabel: { fontSize: 13, fontFamily: theme.font.bodyBold, color: theme.colors.ink, flex: 1 },
  trendItemValue: { fontSize: 13, fontFamily: theme.font.bodyBold, color: theme.colors.grassDeep },
  trendItemNote: { fontSize: 11.5, color: theme.colors.inkSoft, fontFamily: theme.font.bodyRegular },
  emptyNote: { fontSize: 13, color: theme.colors.inkSoft, fontFamily: theme.font.bodySemibold, textAlign: 'center' },
  realtorRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  realtorName: { fontSize: 15, fontFamily: theme.font.bodyBold, color: theme.colors.ink },
  realtorTag: { fontSize: 12, color: theme.colors.inkSoft, fontFamily: theme.font.bodyRegular },
  realtorDeals: { fontSize: 12, color: theme.colors.grassDeep, fontFamily: theme.font.bodyBold },
  contactBtn: { backgroundColor: theme.colors.grass, borderRadius: 999, paddingVertical: 8, paddingHorizontal: 16 },
  contactBtnText: { color: '#fff', fontFamily: theme.font.bodyBold, fontSize: 12.5 },
  nRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  nHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  nName: { fontFamily: theme.font.displaySemibold, fontSize: 16, color: theme.colors.ink },
  youBadge: { backgroundColor: theme.colors.grassPale, borderRadius: 999, paddingVertical: 2, paddingHorizontal: 8 },
  youBadgeText: { color: theme.colors.grassDeep, fontSize: 10, fontFamily: theme.font.bodyBold, textTransform: 'uppercase' },
  nMeta: { fontSize: 11.5, color: theme.colors.grassDeep, fontFamily: theme.font.bodyBold, marginTop: 4 },
  footnote: { fontSize: 11.5, color: theme.colors.inkSoft, fontFamily: theme.font.bodySemibold, textAlign: 'center', marginTop: 8 },
});
