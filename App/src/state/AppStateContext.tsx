import { Session } from '@supabase/supabase-js';
import React, { createContext, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useState } from 'react';
import { ProfileData } from '../data/constants';
import {
  AlertItem,
  Announcement,
  Ask,
  Business,
  BoardThread,
  Club,
  CommunityBreakdown,
  CommunityPost,
  EventItem,
  FamilyMember,
  House,
  MatchNeighbor,
  ModerationLogEntry,
  Neighborhood,
  NeighborhoodTrend,
  NotificationItem,
  Person,
  Poll,
  Pro,
  Realtor,
  RealtorProfile,
  Spot,
} from '../data/types';
import {
  AlertDismissalRow,
  AlertRow,
  AskMessageRow,
  AskRow,
  BoardMessageRow,
  BoardThreadArchiveRow,
  BusinessRatingRow,
  BusinessRow,
  ClubEventRsvpRow,
  ClubMemberRow,
  ClubPostRow,
  ClubRow,
  CommunityInsightsRow,
  CommunityPostRow,
  CommunityScoreRow,
  CommunitySpotRow,
  EventRow,
  EventRsvpRow,
  FamilyMemberRow,
  HouseRow,
  AnnouncementRow,
  ModerationLogRow,
  NotificationRow,
  PollOptionRow,
  PollRow,
  PollVoteRow,
  ProRow,
  ProfileRow,
  RealtorAccountRow,
  RealtorRow,
  WaveRow,
} from '../lib/database.types';
import { notify } from '../lib/alert';
import { supabase } from '../lib/supabase';
import { theme } from '../theme';

export type Profile = ProfileData;

/** Optimistic rows get one of these as their id until the real insert resolves. */
function makeTempId(): string {
  return `temp-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

const EMPTY_PROFILE: Profile = {
  firstName: '',
  lastName: '',
  age: '',
  street: '',
  profession: '',
  yearsIn: '',
  bio: '',
  interests: [],
  family: [],
  birthday: null,
  avatarUrl: null,
  isPrivate: false,
};

const AVATAR_PALETTE = [
  theme.colors.marigold,
  theme.colors.sky,
  theme.colors.peach,
  theme.colors.mint,
  theme.colors.blush,
  theme.colors.lilac,
  theme.colors.grassPale,
  theme.colors.marigoldSoft,
];

function colorForId(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  return AVATAR_PALETTE[hash % AVATAR_PALETTE.length];
}

function initialsFor(first: string, last: string): string {
  const i = ((first[0] ?? '') + (last[0] ?? '')).toUpperCase();
  return i || '?';
}

/** signUp() only returns a session immediately if the project has email
 * confirmation disabled. Belt-and-suspenders: if it didn't come back with one
 * (a stricter project setting, or a transient hiccup), try signing in right
 * away with the same credentials before giving up — so a fresh signup always
 * lands the person straight in the app instead of back at the login screen. */
async function ensureSessionAfterSignUp(email: string, password: string, existing: Session | null): Promise<Session> {
  if (existing) return existing;
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data.session) {
    throw new Error("Your account was created, but this community requires email confirmation before signing in — check your inbox, then sign in from the login screen.");
  }
  return data.session;
}

function monthDay(dateStr: string | null): { mon: string; day: string } {
  if (!dateStr) return { mon: '', day: '' };
  const d = new Date(`${dateStr}T00:00:00`);
  return { mon: d.toLocaleDateString('en-US', { month: 'short' }).toUpperCase(), day: String(d.getDate()).padStart(2, '0') };
}

function timeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const min = Math.floor(ms / 60000);
  if (min < 1) return 'now';
  if (min < 60) return `${min}m`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h`;
  return `${Math.floor(hr / 24)}d`;
}

type AppState = {
  // auth
  session: Session | null;
  sessionLoading: boolean;
  dataLoading: boolean;
  hasProfile: boolean;
  isBoardMember: boolean;
  myProfileId: string | null;
  logout: () => void;
  completeSignup: (args: {
    email: string;
    password: string;
    signupKey: string;
    firstName: string;
    lastName: string;
    age: string;
    houseId: string;
    profession: string;
    yearsIn: string;
    bio: string;
    interests: string[];
    family: FamilyMember[];
    birthday: string;
    isPrivate: boolean;
  }) => Promise<void>;
  listOpenHouses: (signupKey: string) => Promise<House[]>;

  // realtor accounts (a distinct account type from residents) — reuse
  // `neighborhoods` below for the "every community + score" list.
  isRealtorAccount: boolean;
  realtorProfile: RealtorProfile | null;
  realtorSignup: (args: { email: string; password: string; signupKey: string; name: string; tag: string; phone: string }) => Promise<void>;
  fetchCommunityInsights: (communityId: string) => Promise<CommunityBreakdown | null>;

  // profile
  profile: Profile;
  setProfile: (p: Profile) => void;
  updateAvatarUrl: (url: string) => Promise<void>;
  addFamilyMember: (m: FamilyMember) => void;
  removeFamilyMember: (index: number) => void;

  // community data
  communityName: string;
  signupKey: string;
  directory: Person[];
  houses: House[];
  matches: MatchNeighbor[];
  clubs: Club[];
  events: EventItem[];
  addEvent: (args: { emoji: string; title: string; eventDate: string; eventTime: string; where: string; description: string; clubId?: string | null }) => Promise<void>;
  asks: Ask[];
  polls: Poll[];
  pros: Pro[];
  realtors: Realtor[];
  spots: Spot[];
  addSpot: (args: { emoji: string; name: string; detail: string }) => Promise<void>;
  submitHomeLead: (kind: 'list' | 'valuation' | 'realtor_contact', realtorId?: string) => Promise<void>;
  neighborhoodScore: number | null;
  neighborhoodTrends: NeighborhoodTrend[];
  neighborhoods: Neighborhood[];
  notifications: NotificationItem[];
  announcements: Announcement[];
  addAnnouncement: (title: string, body: string) => Promise<void>;
  boardThreads: BoardThread[];
  sendBoardMessage: (text: string, targetProfileId?: string) => void;
  archivedThreadIds: string[];
  archiveThread: (residentId: string) => Promise<void>;
  unarchiveThread: (residentId: string) => Promise<void>;

  // notifications
  readNotificationIds: string[];
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  deleteNotification: (id: string) => Promise<void>;
  unreadNotificationCount: number;

  // asks + votes
  addAsk: (text: string, kind?: 'Borrow' | 'Favor' | 'Recommend' | 'Ask') => void;
  sendChatMessage: (askId: string, text: string) => void;
  votes: Record<string, string>;
  vote: (pollId: string, optionId: string) => void;
  addPoll: (args: { title: string; description: string; options: string[] }) => Promise<void>;

  // event RSVPs
  eventRsvps: Record<string, boolean>;
  toggleEventRsvp: (eventId: string) => void;

  // "say hi" / wave sent, per person id
  wavedIds: string[];
  sendWave: (personId: string) => void;

  // club membership
  joinedClubIds: string[];
  toggleClubJoined: (clubId: string) => void;
  addClubPost: (clubId: string, text: string) => Promise<void>;
  clubEventRsvps: Record<string, boolean>;
  toggleClubEventRsvp: (clubId: string) => void;
  createClub: (args: { name: string; emoji: string; tagline: string; meets: string; about: string }) => Promise<void>;
  updateClubHeaderImage: (clubId: string, url: string) => Promise<void>;

  // community posts (Today feed "share something")
  posts: CommunityPost[];
  addPost: (text: string) => Promise<void>;

  // local businesses (resident shoutouts + admin-curated sponsored spots)
  businesses: Business[];
  addBusiness: (args: { name: string; category: string; description: string; phone: string; website: string; address: string }) => Promise<void>;
  rateBusiness: (businessId: string, rating: number) => Promise<void>;
  deleteBusiness: (businessId: string) => Promise<void>;

  // emergency / crime alerts
  alerts: AlertItem[];
  reportAlert: (title: string, body: string) => Promise<void>;
  dismissAlert: (alertId: string) => Promise<void>;
  deleteAlert: (alertId: string) => Promise<void>;

  // HOA board moderation
  moderationLog: ModerationLogEntry[];
  deleteClubPost: (postId: string) => Promise<void>;
  deleteEvent: (eventId: string) => Promise<void>;
  deleteSpot: (spotId: string) => Promise<void>;
  deleteAsk: (askId: string) => Promise<void>;
  deletePost: (postId: string) => Promise<void>;
  deletePoll: (pollId: string) => Promise<void>;
};

const AppStateContext = createContext<AppState | null>(null);

export function AppStateProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(false);

  const [myRow, setMyRow] = useState<ProfileRow | null>(null);
  const [myFamily, setMyFamily] = useState<FamilyMemberRow[]>([]);
  const [directoryRows, setDirectoryRows] = useState<ProfileRow[]>([]);
  const [familyByProfile, setFamilyByProfile] = useState<Record<string, FamilyMemberRow[]>>({});
  const [houseRows, setHouseRows] = useState<HouseRow[]>([]);
  const [clubRows, setClubRows] = useState<ClubRow[]>([]);
  const [clubPostRows, setClubPostRows] = useState<ClubPostRow[]>([]);
  const [clubMemberRows, setClubMemberRows] = useState<ClubMemberRow[]>([]);
  const [eventRows, setEventRows] = useState<EventRow[]>([]);
  const [eventRsvpRows, setEventRsvpRows] = useState<EventRsvpRow[]>([]);
  const [askRows, setAskRows] = useState<AskRow[]>([]);
  const [askMessageRows, setAskMessageRows] = useState<AskMessageRow[]>([]);
  const [boardThreadArchiveRows, setBoardThreadArchiveRows] = useState<BoardThreadArchiveRow[]>([]);
  const [pollRows, setPollRows] = useState<PollRow[]>([]);
  const [pollOptionRows, setPollOptionRows] = useState<PollOptionRow[]>([]);
  const [pollVoteRows, setPollVoteRows] = useState<PollVoteRow[]>([]);
  const [proRows, setProRows] = useState<ProRow[]>([]);
  const [notificationRows, setNotificationRows] = useState<NotificationRow[]>([]);
  const [announcementRows, setAnnouncementRows] = useState<AnnouncementRow[]>([]);
  const [boardMessageRows, setBoardMessageRows] = useState<BoardMessageRow[]>([]);
  const [waveRows, setWaveRows] = useState<WaveRow[]>([]);
  const [realtorRows, setRealtorRows] = useState<RealtorRow[]>([]);
  const [clubEventRsvpRows, setClubEventRsvpRows] = useState<ClubEventRsvpRow[]>([]);
  const [spotRows, setSpotRows] = useState<CommunitySpotRow[]>([]);
  const [communityDetails, setCommunityDetails] = useState<{ id: string; name: string; signup_key: string } | null>(null);
  const [insightsRow, setInsightsRow] = useState<CommunityInsightsRow | null>(null);
  const [scoreRows, setScoreRows] = useState<CommunityScoreRow[]>([]);
  const [realtorRow, setRealtorRow] = useState<RealtorAccountRow | null>(null);
  const [moderationLogRows, setModerationLogRows] = useState<ModerationLogRow[]>([]);
  const [communityPostRows, setCommunityPostRows] = useState<CommunityPostRow[]>([]);
  const [businessRows, setBusinessRows] = useState<BusinessRow[]>([]);
  const [businessRatingRows, setBusinessRatingRows] = useState<BusinessRatingRow[]>([]);
  const [alertRows, setAlertRows] = useState<AlertRow[]>([]);
  const [alertDismissalRows, setAlertDismissalRows] = useState<AlertDismissalRow[]>([]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setSessionLoading(false);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  const refreshAll = useCallback(async () => {
    const { data: sessionData } = await supabase.auth.getSession();
    const current = sessionData.session;
    if (!current) return;
    setDataLoading(true);
    const uid = current.user.id;

    const { data: mine } = await supabase.from('profiles').select('*').eq('id', uid).maybeSingle();
    setMyRow((mine as ProfileRow | null) ?? null);
    if (!mine) {
      // Not a resident — check whether this is a realtor account instead.
      const { data: realtor } = await supabase.from('realtor_accounts').select('*').eq('id', uid).maybeSingle();
      setRealtorRow((realtor as RealtorAccountRow | null) ?? null);
      if (realtor) {
        const { data: scores } = await supabase.rpc('community_scores');
        setScoreRows((scores ?? []) as CommunityScoreRow[]);
      }
      setDataLoading(false);
      return;
    }
    setRealtorRow(null);

    const [
      familyRes,
      directoryRes,
      houseRes,
      clubRes,
      clubPostRes,
      clubMemberRes,
      eventRes,
      eventRsvpRes,
      askRes,
      askMessageRes,
      pollRes,
      pollOptionRes,
      pollVoteRes,
      proRes,
      notificationRes,
      announcementRes,
      boardMessageRes,
      boardThreadArchiveRes,
      waveRes,
      realtorRes,
      clubEventRsvpRes,
      spotRes,
      communityDetailsRes,
      insightsRes,
      scoreRes,
      moderationLogRes,
      communityPostRes,
      businessRes,
      businessRatingRes,
      alertRes,
      alertDismissalRes,
    ] = await Promise.all([
      supabase.from('family_members').select('*'),
      supabase.from('profiles').select('*').neq('id', uid),
      supabase.from('houses').select('*'),
      supabase.from('clubs').select('*'),
      supabase.from('club_posts').select('*').order('created_at', { ascending: false }),
      supabase.from('club_members').select('*'),
      supabase.from('events').select('*').order('event_date', { ascending: true }),
      supabase.from('event_rsvps').select('*'),
      supabase.from('asks').select('*').order('created_at', { ascending: false }),
      supabase.from('ask_messages').select('*').order('created_at', { ascending: true }),
      supabase.from('polls').select('*').order('created_at', { ascending: false }),
      supabase.from('poll_options').select('*').order('position', { ascending: true }),
      supabase.from('poll_votes').select('*'),
      supabase.from('pros').select('*'),
      supabase.from('notifications').select('*').order('created_at', { ascending: false }),
      supabase.from('announcements').select('*').order('created_at', { ascending: false }),
      supabase.from('board_messages').select('*').order('created_at', { ascending: true }),
      supabase.from('board_thread_archives').select('*'),
      supabase.from('waves').select('*'),
      supabase.from('realtors').select('*'),
      supabase.from('club_event_rsvps').select('*'),
      supabase.from('community_spots').select('*').order('created_at', { ascending: false }),
      supabase.rpc('current_community_details'),
      supabase.rpc('community_insights'),
      supabase.rpc('community_scores'),
      supabase.from('moderation_log').select('*').order('created_at', { ascending: false }),
      supabase.from('community_posts').select('*').order('created_at', { ascending: false }),
      supabase.from('businesses').select('*').order('created_at', { ascending: false }),
      supabase.from('business_ratings').select('*'),
      supabase.from('alerts').select('*').order('created_at', { ascending: false }),
      supabase.from('alert_dismissals').select('*'),
    ]);

    const allFamily = (familyRes.data ?? []) as FamilyMemberRow[];
    setMyFamily(allFamily.filter((f) => f.profile_id === uid));
    const grouped: Record<string, FamilyMemberRow[]> = {};
    for (const f of allFamily) {
      if (f.profile_id === uid) continue;
      (grouped[f.profile_id] ??= []).push(f);
    }
    setFamilyByProfile(grouped);

    setDirectoryRows((directoryRes.data ?? []) as ProfileRow[]);
    setHouseRows((houseRes.data ?? []) as HouseRow[]);
    setClubRows((clubRes.data ?? []) as ClubRow[]);
    setClubPostRows((clubPostRes.data ?? []) as ClubPostRow[]);
    setClubMemberRows((clubMemberRes.data ?? []) as ClubMemberRow[]);
    setEventRows((eventRes.data ?? []) as EventRow[]);
    setEventRsvpRows((eventRsvpRes.data ?? []) as EventRsvpRow[]);
    setAskRows((askRes.data ?? []) as AskRow[]);
    setAskMessageRows((askMessageRes.data ?? []) as AskMessageRow[]);
    setPollRows((pollRes.data ?? []) as PollRow[]);
    setPollOptionRows((pollOptionRes.data ?? []) as PollOptionRow[]);
    setPollVoteRows((pollVoteRes.data ?? []) as PollVoteRow[]);
    setProRows((proRes.data ?? []) as ProRow[]);
    setNotificationRows((notificationRes.data ?? []) as NotificationRow[]);
    setAnnouncementRows((announcementRes.data ?? []) as AnnouncementRow[]);
    setBoardMessageRows((boardMessageRes.data ?? []) as BoardMessageRow[]);
    setBoardThreadArchiveRows((boardThreadArchiveRes.data ?? []) as BoardThreadArchiveRow[]);
    setWaveRows((waveRes.data ?? []) as WaveRow[]);
    setRealtorRows((realtorRes.data ?? []) as RealtorRow[]);
    setClubEventRsvpRows((clubEventRsvpRes.data ?? []) as ClubEventRsvpRow[]);
    setSpotRows((spotRes.data ?? []) as CommunitySpotRow[]);
    const details = (communityDetailsRes.data as { id: string; name: string; signup_key: string }[] | null) ?? [];
    setCommunityDetails(details[0] ?? null);
    const insights = (insightsRes.data as CommunityInsightsRow[] | null) ?? [];
    setInsightsRow(insights[0] ?? null);
    setScoreRows((scoreRes.data ?? []) as CommunityScoreRow[]);
    setModerationLogRows((moderationLogRes.data ?? []) as ModerationLogRow[]);
    setCommunityPostRows((communityPostRes.data ?? []) as CommunityPostRow[]);
    setBusinessRows((businessRes.data ?? []) as BusinessRow[]);
    setBusinessRatingRows((businessRatingRes.data ?? []) as BusinessRatingRow[]);
    setAlertRows((alertRes.data ?? []) as AlertRow[]);
    setAlertDismissalRows((alertDismissalRes.data ?? []) as AlertDismissalRow[]);
    setDataLoading(false);
  }, []);

  // Layout effect (not a plain effect) so dataLoading flips to true in the same
  // commit as a fresh session appearing — closes a gap right after signup where
  // session is already set but hasProfile/isRealtorAccount haven't resolved yet,
  // which would otherwise render AuthStack for a frame instead of the loading screen.
  useLayoutEffect(() => {
    if (session) {
      setDataLoading(true);
      refreshAll();
    } else {
      setMyRow(null);
      setMyFamily([]);
      setDirectoryRows([]);
      setFamilyByProfile({});
      setHouseRows([]);
      setClubRows([]);
      setClubPostRows([]);
      setClubMemberRows([]);
      setEventRows([]);
      setEventRsvpRows([]);
      setAskRows([]);
      setAskMessageRows([]);
      setPollRows([]);
      setPollOptionRows([]);
      setPollVoteRows([]);
      setProRows([]);
      setNotificationRows([]);
      setAnnouncementRows([]);
      setBoardMessageRows([]);
      setBoardThreadArchiveRows([]);
      setWaveRows([]);
      setRealtorRows([]);
      setClubEventRsvpRows([]);
      setSpotRows([]);
      setCommunityDetails(null);
      setInsightsRow(null);
      setScoreRows([]);
      setRealtorRow(null);
      setModerationLogRows([]);
      setCommunityPostRows([]);
      setBusinessRows([]);
      setBusinessRatingRows([]);
      setAlertRows([]);
      setAlertDismissalRows([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  const logout = useCallback(() => {
    supabase.auth.signOut();
  }, []);

  const completeSignup = useCallback(
    async (args: {
      email: string;
      password: string;
      signupKey: string;
      firstName: string;
      lastName: string;
      age: string;
      houseId: string;
      profession: string;
      yearsIn: string;
      bio: string;
      interests: string[];
      family: FamilyMember[];
      birthday: string;
      isPrivate: boolean;
    }) => {
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({ email: args.email, password: args.password });
      if (signUpError) throw signUpError;
      const session = await ensureSessionAfterSignUp(args.email, args.password, signUpData.session);
      const newUserId = session.user.id;
      const { error: rpcError } = await supabase.rpc('complete_profile', {
        p_signup_key: args.signupKey,
        p_first_name: args.firstName,
        p_last_name: args.lastName,
        p_age: args.age,
        p_house_id: args.houseId,
        p_profession: args.profession,
        p_years_in: args.yearsIn,
        p_bio: args.bio,
        p_interests: args.interests,
        p_birthday: args.birthday,
        p_is_private: args.isPrivate,
      });
      if (rpcError) throw rpcError;
      if (args.family.length) {
        await supabase
          .from('family_members')
          .insert(args.family.map((f) => ({ profile_id: newUserId, name: f.name, relation: f.relation, age: f.age, pet_type: f.petType ?? null })));
      }
      await refreshAll();
    },
    [refreshAll]
  );

  const listOpenHouses = useCallback(async (signupKey: string): Promise<House[]> => {
    const { data, error } = await supabase.rpc('list_open_houses', { key: signupKey });
    if (error || !data) return [];
    return (data as { house_id: string; address: string; latitude: number; longitude: number }[]).map((h) => ({
      id: h.house_id,
      address: h.address,
      latitude: h.latitude,
      longitude: h.longitude,
      claimed: false,
    }));
  }, []);

  const realtorSignup = useCallback(
    async (args: { email: string; password: string; signupKey: string; name: string; tag: string; phone: string }) => {
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({ email: args.email, password: args.password });
      if (signUpError) throw signUpError;
      await ensureSessionAfterSignUp(args.email, args.password, signUpData.session);
      const { error: rpcError } = await supabase.rpc('complete_realtor_signup', {
        p_signup_key: args.signupKey,
        p_name: args.name,
        p_tag: args.tag,
        p_phone: args.phone,
        p_email: args.email,
      });
      if (rpcError) throw rpcError;
      await refreshAll();
    },
    [refreshAll]
  );

  const profilesById = useMemo(() => {
    const map = new Map<string, ProfileRow>();
    if (myRow) map.set(myRow.id, myRow);
    for (const p of directoryRows) map.set(p.id, p);
    return map;
  }, [myRow, directoryRows]);

  const personRoster = useCallback(
    (profileId: string) => {
      const p = profilesById.get(profileId);
      return { initials: p ? initialsFor(p.first_name, p.last_name) : '?', bg: colorForId(profileId), photoUrl: p?.avatar_url ?? null };
    },
    [profilesById]
  );

  const profile: Profile = useMemo(() => {
    if (!myRow) return EMPTY_PROFILE;
    return {
      firstName: myRow.first_name,
      lastName: myRow.last_name,
      age: myRow.age,
      street: myRow.street,
      profession: myRow.profession,
      yearsIn: myRow.years_in,
      bio: myRow.bio,
      interests: myRow.interests,
      family: myFamily.map((f) => ({ id: f.id, name: f.name, relation: f.relation, age: f.age, petType: f.pet_type ?? undefined })),
      birthday: myRow.birthday,
      avatarUrl: myRow.avatar_url,
      isPrivate: myRow.is_private,
    };
  }, [myRow, myFamily]);

  const wavedIds = useMemo(
    () => waveRows.filter((w) => w.from_profile_id === myRow?.id).map((w) => w.to_profile_id),
    [waveRows, myRow]
  );
  const joinedClubIds = useMemo(
    () => clubMemberRows.filter((m) => m.profile_id === myRow?.id).map((m) => m.club_id),
    [clubMemberRows, myRow]
  );

  const communityName = communityDetails?.name ?? '';
  const signupKey = communityDetails?.signup_key ?? '';

  const realtors: Realtor[] = useMemo(
    () => realtorRows.map((r) => ({ id: r.id, name: r.name, tag: r.tag, dealsNote: r.deals_note, phone: r.phone, email: r.email })),
    [realtorRows]
  );

  const spots: Spot[] = useMemo(
    () => spotRows.map((s) => ({ id: s.id, emoji: s.emoji, name: s.name, detail: s.detail })),
    [spotRows]
  );

  const businesses: Business[] = useMemo(() => {
    const list = businessRows.map((row) => {
      const ratings = businessRatingRows.filter((r) => r.business_id === row.id);
      const avgRating = ratings.length ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length : null;
      const mine = ratings.find((r) => r.profile_id === myRow?.id);
      return {
        id: row.id,
        name: row.name,
        category: row.category,
        description: row.description,
        phone: row.phone,
        website: row.website,
        address: row.address,
        isSponsored: row.is_sponsored,
        addedByProfileId: row.added_by_profile_id,
        avgRating,
        ratingCount: ratings.length,
        myRating: mine?.rating ?? null,
      };
    });
    return list.sort((a, b) => {
      if (a.isSponsored !== b.isSponsored) return a.isSponsored ? -1 : 1;
      return 0;
    });
  }, [businessRows, businessRatingRows, myRow]);

  const neighborhoodScore: number | null = insightsRow?.score ?? null;

  const neighborhoodTrends: NeighborhoodTrend[] = useMemo(() => {
    if (!insightsRow) return [];
    const responseNote =
      insightsRow.avg_response_minutes == null
        ? { value: 'No data yet', note: 'Be the first to answer a neighbor’s ask' }
        : insightsRow.avg_response_minutes < 60
          ? { value: `${Math.round(insightsRow.avg_response_minutes)} min average`, note: 'Average time neighbors take to reply to an ask' }
          : { value: `${(insightsRow.avg_response_minutes / 60).toFixed(1)} hr average`, note: 'Average time neighbors take to reply to an ask' };
    const welcomeNote =
      insightsRow.welcome_rate == null
        ? { value: 'No new neighbors yet', note: 'Wave at the next person who joins' }
        : { value: `${Math.round(insightsRow.welcome_rate * 100)}%`, note: 'of neighbors who joined in the last 30 days got a wave' };
    return [
      {
        label: 'Families with kids',
        value: String(insightsRow.kids_count),
        note: 'households with kids in your community',
      },
      {
        label: 'Community events per month',
        value: (insightsRow.events_last_90d / 3).toFixed(1),
        note: `${insightsRow.events_last_90d} events in the last 90 days`,
      },
      { label: 'Help-request response time', value: responseNote.value, note: responseNote.note },
      { label: 'New-neighbor welcome rate', value: welcomeNote.value, note: welcomeNote.note },
    ];
  }, [insightsRow]);

  const neighborhoods: Neighborhood[] = useMemo(
    () =>
      scoreRows.map((r) => ({
        id: r.community_id,
        name: r.name,
        score: r.score,
        you: r.community_id === myRow?.community_id,
        householdCount: r.household_count,
        eventsPerMonth: r.events_per_month,
        kidsCount: r.kids_count,
      })),
    [scoreRows, myRow]
  );

  const isRealtorAccount = !!realtorRow;
  const realtorProfile: RealtorProfile | null = useMemo(
    () => (realtorRow ? { name: realtorRow.name, tag: realtorRow.tag, phone: realtorRow.phone, email: realtorRow.email } : null),
    [realtorRow]
  );

  const fetchCommunityInsights = useCallback(async (communityId: string): Promise<CommunityBreakdown | null> => {
    const { data } = await supabase.rpc('community_insights_for', { p_community_id: communityId });
    const row = ((data as CommunityInsightsRow[] | null) ?? [])[0];
    if (!row) return null;
    return {
      communityId: row.community_id,
      householdCount: row.household_count,
      housesTotal: row.houses_total,
      kidsCount: row.kids_count,
      eventsLast90d: row.events_last_90d,
      avgResponseMinutes: row.avg_response_minutes,
      connectedRate: row.connected_rate,
      clubParticipationRate: row.club_participation_rate,
      welcomeRate: row.welcome_rate,
      score: row.score,
    };
  }, []);

  const moderationLog: ModerationLogEntry[] = useMemo(
    () =>
      moderationLogRows.map((r) => {
        const who = r.board_profile_id ? profilesById.get(r.board_profile_id) : undefined;
        return {
          id: r.id,
          entityType: r.entity_type,
          summary: r.summary,
          who: who ? `${who.first_name} ${who.last_name}`.trim() : 'A board member',
          when: timeAgo(r.created_at),
        };
      }),
    [moderationLogRows, profilesById]
  );

  const posts: CommunityPost[] = useMemo(
    () =>
      communityPostRows.map((r) => {
        const author = profilesById.get(r.author_profile_id);
        return {
          id: r.id,
          authorId: r.author_profile_id,
          who: author ? `${author.first_name} ${author.last_name}`.trim() : 'Neighbor',
          initials: author ? initialsFor(author.first_name, author.last_name) : '?',
          bg: colorForId(r.author_profile_id),
          avatarUrl: author?.avatar_url ?? null,
          text: r.text,
          createdAt: timeAgo(r.created_at),
        };
      }),
    [communityPostRows, profilesById]
  );

  const alerts: AlertItem[] = useMemo(() => {
    const dismissedIds = new Set(alertDismissalRows.filter((d) => d.profile_id === myRow?.id).map((d) => d.alert_id));
    return alertRows
      .filter((r) => !dismissedIds.has(r.id))
      .map((r) => {
        const author = profilesById.get(r.author_profile_id);
        return {
          id: r.id,
          title: r.title,
          body: r.body,
          authorId: r.author_profile_id,
          who: author ? `${author.first_name} ${author.last_name}`.trim() : 'A neighbor',
          createdAt: timeAgo(r.created_at),
        };
      });
  }, [alertRows, alertDismissalRows, profilesById, myRow]);

  const directory: Person[] = useMemo(() => {
    const myInterests = new Set(myRow?.interests ?? []);
    return directoryRows.map((row) => {
      const family = (familyByProfile[row.id] ?? []).map((f) => ({ name: f.name, relation: f.relation, age: f.age, petType: f.pet_type ?? undefined }));
      const myClubs = clubMemberRows.filter((m) => m.profile_id === row.id).map((m) => m.club_id);
      return {
        id: row.id,
        name: `${row.first_name} ${row.last_name}`.trim(),
        initials: initialsFor(row.first_name, row.last_name),
        bg: colorForId(row.id),
        avatarUrl: row.avatar_url,
        house: row.house_id ?? '',
        street: row.street,
        tenure: row.years_in,
        job: row.job || row.profession,
        relation: '',
        helped: String(row.helped_count),
        connected: row.connected,
        phone: row.phone,
        email: '',
        bio: row.bio,
        shared: row.interests.filter((i) => myInterests.has(i)),
        family,
        clubs: myClubs,
        isBoardMember: row.is_board_member,
        birthday: row.birthday,
        isPrivate: row.is_private,
      };
    });
  }, [directoryRows, familyByProfile, clubMemberRows, myRow]);

  const matches: MatchNeighbor[] = useMemo(() => {
    return directory
      .filter((p) => p.shared.length > 0)
      .sort((a, b) => b.shared.length - a.shared.length)
      .map((p) => ({
        id: p.id,
        name: p.name,
        initials: p.initials,
        bg: p.bg,
        avatarUrl: p.avatarUrl,
        street: p.street,
        shared: p.shared,
        note: p.job,
        connected: wavedIds.includes(p.id) && p.connected,
        isPrivate: p.isPrivate,
      }));
  }, [directory, wavedIds]);

  const houses: House[] = useMemo(
    () =>
      houseRows.map((h) => ({
        id: h.id,
        address: h.address,
        latitude: h.latitude,
        longitude: h.longitude,
        claimed: h.resident_profile_id !== null,
        you: h.id === myRow?.house_id,
      })),
    [houseRows, myRow]
  );

  const clubMembersByClub = useMemo(() => {
    const map = new Map<string, ClubMemberRow[]>();
    for (const m of clubMemberRows) {
      const arr = map.get(m.club_id) ?? [];
      arr.push(m);
      map.set(m.club_id, arr);
    }
    return map;
  }, [clubMemberRows]);

  const clubs: Club[] = useMemo(() => {
    return clubRows.map((row) => {
      const members = clubMembersByClub.get(row.id) ?? [];
      const posts = clubPostRows
        .filter((p) => p.club_id === row.id)
        .map((p) => {
          const author = profilesById.get(p.author_profile_id);
          return {
            id: p.id,
            authorId: p.author_profile_id,
            who: author ? `${author.first_name} ${author.last_name}`.trim() : 'Neighbor',
            initials: author ? initialsFor(author.first_name, author.last_name) : '?',
            bg: colorForId(p.author_profile_id),
            avatarUrl: author?.avatar_url ?? null,
            text: p.text,
          };
        });
      const lead = row.lead_profile_id ? profilesById.get(row.lead_profile_id) : undefined;
      const going = clubEventRsvpRows.filter((r) => r.club_id === row.id && r.going).length;
      return {
        id: row.id,
        emoji: row.emoji,
        name: row.name,
        meets: row.meets,
        members: members.length,
        accent: row.accent,
        accentDeep: row.accent_deep,
        tagline: row.tagline,
        since: row.since_text,
        spot: row.spot,
        lead: lead
          ? {
              id: lead.id,
              name: `${lead.first_name} ${lead.last_name}`.trim(),
              initials: initialsFor(lead.first_name, lead.last_name),
              bg: colorForId(lead.id),
              job: lead.job || lead.profession,
              avatarUrl: lead.avatar_url,
            }
          : { name: '', initials: '?', bg: theme.colors.sky, job: '' },
        about: row.about,
        next: { title: row.next_title, when: row.next_when, where: row.next_where, going },
        rules: row.rules,
        posts,
        roster: members.slice(0, 4).map((m) => personRoster(m.profile_id)),
        headerUrl: row.header_url,
      };
    });
  }, [clubRows, clubMembersByClub, clubPostRows, profilesById, personRoster, clubEventRsvpRows]);

  const clubEventRsvps: Record<string, boolean> = useMemo(() => {
    const out: Record<string, boolean> = {};
    for (const r of clubEventRsvpRows) if (r.profile_id === myRow?.id) out[r.club_id] = r.going;
    return out;
  }, [clubEventRsvpRows, myRow]);

  const events: EventItem[] = useMemo(() => {
    return eventRows.map((row) => {
      const rsvps = eventRsvpRows.filter((r) => r.event_id === row.id && r.going);
      const host = row.host_profile_id ? profilesById.get(row.host_profile_id) : undefined;
      const { mon, day } = monthDay(row.event_date);
      const club = row.club_id ? clubRows.find((c) => c.id === row.club_id) : undefined;
      return {
        id: row.id,
        emoji: row.emoji,
        mon,
        day,
        date: row.event_date,
        title: row.title,
        time: row.event_time,
        where: row.where_text,
        host: host
          ? {
              id: host.id,
              name: `${host.first_name} ${host.last_name}`.trim(),
              initials: initialsFor(host.first_name, host.last_name),
              bg: colorForId(host.id),
              avatarUrl: host.avatar_url,
            }
          : { name: row.host_name, initials: (row.host_name[0] ?? '?').toUpperCase(), bg: theme.colors.mint },
        roster: rsvps.slice(0, 4).map((r) => personRoster(r.profile_id)),
        going: rsvps.length,
        rsvp: eventRsvpRows.some((r) => r.event_id === row.id && r.profile_id === myRow?.id && r.going),
        accent: row.accent,
        accentDeep: row.accent_deep,
        desc: row.description,
        club: club ? { id: club.id, name: club.name, emoji: club.emoji } : undefined,
      };
    });
  }, [eventRows, eventRsvpRows, profilesById, myRow, personRoster, clubRows]);

  const eventRsvps: Record<string, boolean> = useMemo(() => {
    const out: Record<string, boolean> = {};
    for (const e of events) out[e.id] = e.rsvp;
    return out;
  }, [events]);

  const asks: Ask[] = useMemo(() => {
    return askRows.map((row) => {
      const author = profilesById.get(row.author_profile_id);
      const messages = askMessageRows
        .filter((m) => m.ask_id === row.id)
        .map((m) => ({ from: (m.sender_profile_id === myRow?.id ? 'you' : 'them') as 'you' | 'them', text: m.text }));
      return {
        id: row.id,
        authorId: row.author_profile_id,
        who: row.author_profile_id === myRow?.id ? 'You' : author ? `${author.first_name} ${author.last_name}`.trim() : 'Neighbor',
        initials: author ? initialsFor(author.first_name, author.last_name) : '?',
        bg: colorForId(row.author_profile_id),
        kind: row.kind,
        text: row.text,
        messages,
      };
    });
  }, [askRows, askMessageRows, profilesById, myRow]);

  const archivedThreadIds: string[] = useMemo(
    () => boardThreadArchiveRows.map((r) => r.resident_profile_id),
    [boardThreadArchiveRows]
  );

  const archiveThread = useCallback(
    async (residentId: string) => {
      if (!myRow) return;
      const { error } = await supabase.from('board_thread_archives').insert({ resident_profile_id: residentId, archived_by: myRow.id });
      if (error) {
        notify("Couldn't archive", 'Something went wrong archiving this thread. Try again.');
        return;
      }
      setBoardThreadArchiveRows((rows) => [...rows, { resident_profile_id: residentId, archived_by: myRow.id, archived_at: new Date().toISOString() }]);
    },
    [myRow]
  );

  const unarchiveThread = useCallback(async (residentId: string) => {
    const { error } = await supabase.from('board_thread_archives').delete().eq('resident_profile_id', residentId);
    if (error) {
      notify("Couldn't unarchive", 'Something went wrong restoring this thread. Try again.');
      return;
    }
    setBoardThreadArchiveRows((rows) => rows.filter((r) => r.resident_profile_id !== residentId));
  }, []);

  const polls: Poll[] = useMemo(() => {
    return pollRows.map((row) => {
      const rowOptions = pollOptionRows.filter((o) => o.poll_id === row.id).sort((a, b) => a.position - b.position);
      const rowVotes = pollVoteRows.filter((v) => v.poll_id === row.id);
      const options = rowOptions.map((o) => ({
        id: o.id,
        text: o.text,
        votes: rowVotes.filter((v) => v.option_id === o.id).length,
      }));
      return {
        id: row.id,
        title: row.title,
        description: row.description,
        options,
        totalVotes: rowVotes.length,
      };
    });
  }, [pollRows, pollOptionRows, pollVoteRows]);

  const votes: Record<string, string> = useMemo(() => {
    const out: Record<string, string> = {};
    for (const v of pollVoteRows) if (v.profile_id === myRow?.id) out[v.poll_id] = v.option_id;
    return out;
  }, [pollVoteRows, myRow]);

  const pros: Pro[] = useMemo(() => proRows.map((r) => ({ name: r.name, used: r.used_count, tag: r.tag })), [proRows]);

  const notifications: NotificationItem[] = useMemo(
    () =>
      notificationRows.map((r) => ({
        id: r.id,
        emoji: r.emoji,
        tint: r.tint,
        title: r.title,
        sub: r.sub,
        time: timeAgo(r.created_at),
        go: { type: r.go_type, id: r.go_id } as NotificationItem['go'],
      })),
    [notificationRows]
  );
  const readNotificationIds = useMemo(() => notificationRows.filter((r) => r.read).map((r) => r.id), [notificationRows]);
  const unreadNotificationCount = notificationRows.filter((r) => !r.read).length;

  const announcements: Announcement[] = useMemo(
    () =>
      announcementRows.map((r) => {
        const author = r.author_profile_id ? profilesById.get(r.author_profile_id) : undefined;
        return {
          id: r.id,
          title: r.title,
          body: r.body,
          authorName: author ? `${author.first_name} ${author.last_name}`.trim() : 'HOA Board',
          createdAt: timeAgo(r.created_at),
        };
      }),
    [announcementRows, profilesById]
  );

  const boardThreads: BoardThread[] = useMemo(() => {
    const byResident = new Map<string, BoardMessageRow[]>();
    for (const r of boardMessageRows) {
      const arr = byResident.get(r.profile_id) ?? [];
      arr.push(r);
      byResident.set(r.profile_id, arr);
    }
    const threads: BoardThread[] = [];
    for (const [residentId, rows] of byResident) {
      const sorted = [...rows].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
      const resident = profilesById.get(residentId);
      threads.push({
        residentId,
        residentName: resident ? `${resident.first_name} ${resident.last_name}`.trim() : 'Neighbor',
        initials: resident ? initialsFor(resident.first_name, resident.last_name) : '?',
        bg: colorForId(residentId),
        messages: sorted.map((r) => ({ fromBoard: r.from_board, text: r.text, createdAt: r.created_at })),
        lastMessageAt: sorted[sorted.length - 1]?.created_at ?? '',
      });
    }
    return threads.sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime());
  }, [boardMessageRows, profilesById]);

  const setProfile = useCallback(
    async (p: Profile) => {
      if (!myRow) return;
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          first_name: p.firstName,
          last_name: p.lastName,
          age: p.age,
          street: p.street,
          profession: p.profession,
          years_in: p.yearsIn,
          bio: p.bio,
          interests: p.interests,
          is_private: p.isPrivate,
        })
        .eq('id', myRow.id);
      if (updateError) {
        notify("Couldn't save", 'Something went wrong saving your profile. Try again.');
        return;
      }
      const { error: deleteError } = await supabase.from('family_members').delete().eq('profile_id', myRow.id);
      if (deleteError) {
        notify("Couldn't save", 'Something went wrong saving your household. Try again.');
        await refreshAll();
        return;
      }
      if (p.family.length) {
        const { error: insertError } = await supabase
          .from('family_members')
          .insert(p.family.map((f) => ({ profile_id: myRow.id, name: f.name, relation: f.relation, age: f.age, pet_type: f.petType ?? null })));
        if (insertError) {
          notify("Couldn't save", 'Something went wrong saving your household. Try again.');
          await refreshAll();
          return;
        }
      }
      await refreshAll();
    },
    [myRow, refreshAll]
  );

  const updateAvatarUrl = useCallback(
    async (url: string) => {
      if (!myRow) return;
      const previous = myRow.avatar_url;
      setMyRow((row) => (row ? { ...row, avatar_url: url } : row));
      const { error } = await supabase.from('profiles').update({ avatar_url: url }).eq('id', myRow.id);
      if (error) {
        setMyRow((row) => (row ? { ...row, avatar_url: previous } : row));
        notify("Couldn't save photo", 'Something went wrong saving your photo. Try again.');
      }
    },
    [myRow]
  );

  const addFamilyMember = useCallback(
    async (m: FamilyMember) => {
      if (!myRow) return;
      await supabase
        .from('family_members')
        .insert({ profile_id: myRow.id, name: m.name, relation: m.relation, age: m.age, pet_type: m.petType ?? null });
      await refreshAll();
    },
    [myRow, refreshAll]
  );

  const removeFamilyMember = useCallback(
    async (index: number) => {
      const row = myFamily[index];
      if (!row) return;
      await supabase.from('family_members').delete().eq('id', row.id);
      await refreshAll();
    },
    [myFamily, refreshAll]
  );

  const markNotificationRead = useCallback(async (id: string) => {
    setNotificationRows((rows) => rows.map((r) => (r.id === id ? { ...r, read: true } : r)));
    await supabase.from('notifications').update({ read: true }).eq('id', id);
  }, []);

  const markAllNotificationsRead = useCallback(async () => {
    if (!myRow) return;
    setNotificationRows((rows) => rows.map((r) => ({ ...r, read: true })));
    await supabase.from('notifications').update({ read: true }).eq('profile_id', myRow.id).eq('read', false);
  }, [myRow]);

  const deleteNotification = useCallback(async (id: string) => {
    const removed = notificationRows.find((r) => r.id === id);
    setNotificationRows((rows) => rows.filter((r) => r.id !== id));
    const { error } = await supabase.from('notifications').delete().eq('id', id);
    if (error) {
      if (removed) setNotificationRows((rows) => [...rows, removed]);
      notify("Couldn't remove", 'Something went wrong removing that notification. Try again.');
    }
  }, [notificationRows]);

  const addAsk = useCallback(
    async (text: string, kind: 'Borrow' | 'Favor' | 'Recommend' | 'Ask' = 'Ask') => {
      if (!myRow) return;
      const tempId = makeTempId();
      setAskRows((rows) => [
        { id: tempId, community_id: myRow.community_id, author_profile_id: myRow.id, kind, text, created_at: new Date().toISOString() },
        ...rows,
      ]);
      const { data, error } = await supabase
        .from('asks')
        .insert({ community_id: myRow.community_id, author_profile_id: myRow.id, kind, text })
        .select()
        .single();
      if (error || !data) {
        setAskRows((rows) => rows.filter((r) => r.id !== tempId));
        notify("Couldn't post", 'Something went wrong posting your ask. Try again.');
        return;
      }
      const askRow = data as AskRow;
      setAskRows((rows) => rows.map((r) => (r.id === tempId ? askRow : r)));
      const { data: msgData } = await supabase
        .from('ask_messages')
        .insert({ ask_id: askRow.id, sender_profile_id: myRow.id, text })
        .select()
        .single();
      if (msgData) setAskMessageRows((rows) => [...rows, msgData as AskMessageRow]);
    },
    [myRow]
  );

  const sendChatMessage = useCallback(
    async (askId: string, text: string) => {
      if (!myRow) return;
      const tempId = makeTempId();
      setAskMessageRows((rows) => [
        ...rows,
        { id: tempId, ask_id: askId, sender_profile_id: myRow.id, text, created_at: new Date().toISOString() },
      ]);
      const { data, error } = await supabase
        .from('ask_messages')
        .insert({ ask_id: askId, sender_profile_id: myRow.id, text })
        .select()
        .single();
      if (error || !data) {
        setAskMessageRows((rows) => rows.filter((r) => r.id !== tempId));
        notify("Couldn't send", 'Something went wrong sending your message. Try again.');
        return;
      }
      setAskMessageRows((rows) => rows.map((r) => (r.id === tempId ? (data as AskMessageRow) : r)));
    },
    [myRow]
  );

  const vote = useCallback(
    async (pollId: string, optionId: string) => {
      if (!myRow || votes[pollId]) return;
      const { data, error } = await supabase
        .from('poll_votes')
        .insert({ poll_id: pollId, profile_id: myRow.id, option_id: optionId })
        .select()
        .single();
      if (error || !data) {
        notify("Couldn't vote", 'Something went wrong casting your vote. Try again.');
        return;
      }
      setPollVoteRows((rows) => [...rows, data as PollVoteRow]);
    },
    [myRow, votes]
  );

  const addPoll = useCallback(
    async (args: { title: string; description: string; options: string[] }) => {
      if (!myRow) return;
      const options = args.options.map((t) => t.trim()).filter(Boolean);
      if (options.length < 2) return;

      const tempPollId = makeTempId();
      setPollRows((rows) => [
        {
          id: tempPollId,
          community_id: myRow.community_id,
          board_profile_id: myRow.id,
          title: args.title,
          description: args.description,
          option_a: options[0],
          option_b: options[1],
          created_at: new Date().toISOString(),
        },
        ...rows,
      ]);
      setPollOptionRows((rows) => [
        ...rows,
        ...options.map((text, i) => ({ id: makeTempId(), poll_id: tempPollId, position: i, text })),
      ]);

      const { data, error } = await supabase
        .from('polls')
        .insert({
          community_id: myRow.community_id,
          board_profile_id: myRow.id,
          title: args.title,
          description: args.description,
          option_a: options[0],
          option_b: options[1],
        })
        .select()
        .single();
      if (error || !data) {
        setPollRows((rows) => rows.filter((r) => r.id !== tempPollId));
        setPollOptionRows((rows) => rows.filter((r) => r.poll_id !== tempPollId));
        notify("Couldn't post", 'Something went wrong posting this vote. Try again.');
        return;
      }
      const poll = data as PollRow;
      setPollRows((rows) => rows.map((r) => (r.id === tempPollId ? poll : r)));

      const { data: optionRows, error: optionsError } = await supabase
        .from('poll_options')
        .insert(options.map((text, i) => ({ poll_id: poll.id, position: i, text })))
        .select();
      if (optionsError || !optionRows) {
        setPollOptionRows((rows) => rows.filter((r) => r.poll_id !== tempPollId));
        notify("Couldn't post", "The poll posted, but its options failed to save. Try deleting and re-creating it.");
        return;
      }
      setPollOptionRows((rows) => [...rows.filter((r) => r.poll_id !== tempPollId), ...(optionRows as PollOptionRow[])]);
    },
    [myRow]
  );

  const toggleEventRsvp = useCallback(
    async (eventId: string) => {
      if (!myRow) return;
      const next = !(eventRsvps[eventId] ?? false);
      setEventRsvpRows((rows) => {
        const exists = rows.some((r) => r.event_id === eventId && r.profile_id === myRow.id);
        if (exists) return rows.map((r) => (r.event_id === eventId && r.profile_id === myRow.id ? { ...r, going: next } : r));
        return [...rows, { event_id: eventId, profile_id: myRow.id, going: next }];
      });
      await supabase.from('event_rsvps').upsert({ event_id: eventId, profile_id: myRow.id, going: next }, { onConflict: 'event_id,profile_id' });
    },
    [myRow, eventRsvps]
  );

  const sendWave = useCallback(
    async (personId: string) => {
      if (!myRow || wavedIds.includes(personId)) return;
      setWaveRows((rows) => [...rows, { from_profile_id: myRow.id, to_profile_id: personId, created_at: new Date().toISOString() }]);
      await supabase.from('waves').insert({ from_profile_id: myRow.id, to_profile_id: personId });
    },
    [myRow, wavedIds]
  );

  const toggleClubJoined = useCallback(
    async (clubId: string) => {
      if (!myRow) return;
      if (joinedClubIds.includes(clubId)) {
        setClubMemberRows((rows) => rows.filter((r) => !(r.club_id === clubId && r.profile_id === myRow.id)));
        await supabase.from('club_members').delete().eq('club_id', clubId).eq('profile_id', myRow.id);
      } else {
        setClubMemberRows((rows) => [...rows, { club_id: clubId, profile_id: myRow.id, joined_at: new Date().toISOString() }]);
        await supabase.from('club_members').insert({ club_id: clubId, profile_id: myRow.id });
      }
    },
    [myRow, joinedClubIds]
  );

  const toggleClubEventRsvp = useCallback(
    async (clubId: string) => {
      if (!myRow) return;
      const next = !(clubEventRsvps[clubId] ?? false);
      setClubEventRsvpRows((rows) => {
        const exists = rows.some((r) => r.club_id === clubId && r.profile_id === myRow.id);
        if (exists) return rows.map((r) => (r.club_id === clubId && r.profile_id === myRow.id ? { ...r, going: next } : r));
        return [...rows, { club_id: clubId, profile_id: myRow.id, going: next }];
      });
      await supabase.from('club_event_rsvps').upsert({ club_id: clubId, profile_id: myRow.id, going: next }, { onConflict: 'club_id,profile_id' });
    },
    [myRow, clubEventRsvps]
  );

  const createClub = useCallback(
    async (args: { name: string; emoji: string; tagline: string; meets: string; about: string }) => {
      if (!myRow) return;
      const tempId = makeTempId();
      const optimisticRow: ClubRow = {
        id: tempId,
        community_id: myRow.community_id,
        emoji: args.emoji,
        name: args.name,
        meets: args.meets,
        accent: theme.colors.grassPale,
        accent_deep: theme.colors.grassDeep,
        tagline: args.tagline,
        since_text: `Since ${new Date().getFullYear()}`,
        spot: '',
        about: args.about,
        next_title: '',
        next_when: '',
        next_where: '',
        lead_profile_id: myRow.id,
        rules: [],
        header_url: null,
        created_at: new Date().toISOString(),
      };
      setClubRows((rows) => [optimisticRow, ...rows]);
      setClubMemberRows((rows) => [...rows, { club_id: tempId, profile_id: myRow.id, joined_at: new Date().toISOString() }]);

      const { data, error } = await supabase
        .from('clubs')
        .insert({
          community_id: myRow.community_id,
          emoji: args.emoji,
          name: args.name,
          meets: args.meets,
          accent: optimisticRow.accent,
          accent_deep: optimisticRow.accent_deep,
          tagline: args.tagline,
          since_text: optimisticRow.since_text,
          about: args.about,
          lead_profile_id: myRow.id,
        })
        .select()
        .single();
      if (error || !data) {
        setClubRows((rows) => rows.filter((r) => r.id !== tempId));
        setClubMemberRows((rows) => rows.filter((r) => r.club_id !== tempId));
        notify("Couldn't start this club", 'Something went wrong creating it. Try again.');
        return;
      }
      const club = data as ClubRow;
      setClubRows((rows) => rows.map((r) => (r.id === tempId ? club : r)));
      setClubMemberRows((rows) => rows.map((r) => (r.club_id === tempId ? { ...r, club_id: club.id } : r)));
      await supabase.from('club_members').insert({ club_id: club.id, profile_id: myRow.id });
    },
    [myRow]
  );

  const addClubPost = useCallback(
    async (clubId: string, text: string) => {
      if (!myRow) return;
      const tempId = makeTempId();
      setClubPostRows((rows) => [
        { id: tempId, club_id: clubId, author_profile_id: myRow.id, text, created_at: new Date().toISOString() },
        ...rows,
      ]);
      const { data, error } = await supabase
        .from('club_posts')
        .insert({ club_id: clubId, author_profile_id: myRow.id, text })
        .select()
        .single();
      if (error || !data) {
        setClubPostRows((rows) => rows.filter((r) => r.id !== tempId));
        notify("Couldn't post", 'Something went wrong sending your post. Try again.');
        return;
      }
      setClubPostRows((rows) => rows.map((r) => (r.id === tempId ? (data as ClubPostRow) : r)));
    },
    [myRow]
  );

  const updateClubHeaderImage = useCallback(async (clubId: string, url: string) => {
    const previous = clubRows.find((c) => c.id === clubId)?.header_url ?? null;
    setClubRows((rows) => rows.map((r) => (r.id === clubId ? { ...r, header_url: url } : r)));
    const { error } = await supabase.from('clubs').update({ header_url: url }).eq('id', clubId);
    if (error) {
      setClubRows((rows) => rows.map((r) => (r.id === clubId ? { ...r, header_url: previous } : r)));
      notify("Couldn't save photo", 'Something went wrong saving this club photo. Try again.');
    }
  }, [clubRows]);

  const addAnnouncement = useCallback(
    async (title: string, body: string) => {
      if (!myRow) return;
      const tempId = makeTempId();
      setAnnouncementRows((rows) => [
        { id: tempId, community_id: myRow.community_id, author_profile_id: myRow.id, title, body, created_at: new Date().toISOString() },
        ...rows,
      ]);
      const { data, error } = await supabase
        .from('announcements')
        .insert({ community_id: myRow.community_id, author_profile_id: myRow.id, title, body })
        .select()
        .single();
      if (error || !data) {
        setAnnouncementRows((rows) => rows.filter((r) => r.id !== tempId));
        notify("Couldn't post", 'Something went wrong posting this announcement. Try again.');
        return;
      }
      setAnnouncementRows((rows) => rows.map((r) => (r.id === tempId ? (data as AnnouncementRow) : r)));
    },
    [myRow]
  );

  const addEvent = useCallback(
    async (args: { emoji: string; title: string; eventDate: string; eventTime: string; where: string; description: string; clubId?: string | null }) => {
      if (!myRow) return;
      const tempId = makeTempId();
      setEventRows((rows) => [
        ...rows,
        {
          id: tempId,
          community_id: myRow.community_id,
          emoji: args.emoji,
          title: args.title,
          event_date: args.eventDate,
          event_time: args.eventTime,
          where_text: args.where,
          description: args.description,
          host_profile_id: myRow.id,
          host_name: `${myRow.first_name} ${myRow.last_name}`.trim(),
          accent: theme.colors.grassPale,
          accent_deep: theme.colors.grassDeep,
          club_id: args.clubId ?? null,
          created_at: new Date().toISOString(),
        },
      ]);
      const { data, error } = await supabase
        .from('events')
        .insert({
          community_id: myRow.community_id,
          emoji: args.emoji,
          title: args.title,
          event_date: args.eventDate,
          event_time: args.eventTime,
          where_text: args.where,
          description: args.description,
          host_profile_id: myRow.id,
          host_name: `${myRow.first_name} ${myRow.last_name}`.trim(),
          accent: theme.colors.grassPale,
          accent_deep: theme.colors.grassDeep,
          club_id: args.clubId ?? null,
        })
        .select()
        .single();
      if (error || !data) {
        setEventRows((rows) => rows.filter((r) => r.id !== tempId));
        notify("Couldn't create event", 'Something went wrong creating your event. Try again.');
        return;
      }
      setEventRows((rows) => rows.map((r) => (r.id === tempId ? (data as EventRow) : r)));
    },
    [myRow]
  );

  const addSpot = useCallback(
    async (args: { emoji: string; name: string; detail: string }) => {
      if (!myRow) return;
      const tempId = makeTempId();
      setSpotRows((rows) => [
        {
          id: tempId,
          community_id: myRow.community_id,
          added_by_profile_id: myRow.id,
          emoji: args.emoji,
          name: args.name,
          detail: args.detail,
          created_at: new Date().toISOString(),
        },
        ...rows,
      ]);
      const { data, error } = await supabase
        .from('community_spots')
        .insert({ community_id: myRow.community_id, added_by_profile_id: myRow.id, emoji: args.emoji, name: args.name, detail: args.detail })
        .select()
        .single();
      if (error || !data) {
        setSpotRows((rows) => rows.filter((r) => r.id !== tempId));
        notify("Couldn't add spot", 'Something went wrong adding this spot. Try again.');
        return;
      }
      setSpotRows((rows) => rows.map((r) => (r.id === tempId ? (data as CommunitySpotRow) : r)));
    },
    [myRow]
  );

  const submitHomeLead = useCallback(
    async (kind: 'list' | 'valuation' | 'realtor_contact', realtorId?: string) => {
      if (!myRow) return;
      await supabase.from('home_leads').insert({ community_id: myRow.community_id, profile_id: myRow.id, kind, realtor_id: realtorId ?? null });
    },
    [myRow]
  );

  const addBusiness = useCallback(
    async (args: { name: string; category: string; description: string; phone: string; website: string; address: string }) => {
      if (!myRow) return;
      const tempId = makeTempId();
      setBusinessRows((rows) => [
        {
          id: tempId,
          community_id: myRow.community_id,
          added_by_profile_id: myRow.id,
          name: args.name,
          category: args.category,
          description: args.description,
          phone: args.phone,
          website: args.website,
          address: args.address,
          is_sponsored: false,
          created_at: new Date().toISOString(),
        },
        ...rows,
      ]);
      const { data, error } = await supabase
        .from('businesses')
        .insert({
          community_id: myRow.community_id,
          added_by_profile_id: myRow.id,
          name: args.name,
          category: args.category,
          description: args.description,
          phone: args.phone,
          website: args.website,
          address: args.address,
        })
        .select()
        .single();
      if (error || !data) {
        setBusinessRows((rows) => rows.filter((r) => r.id !== tempId));
        notify("Couldn't add business", 'Something went wrong shouting this out. Try again.');
        return;
      }
      setBusinessRows((rows) => rows.map((r) => (r.id === tempId ? (data as BusinessRow) : r)));
    },
    [myRow]
  );

  const rateBusiness = useCallback(
    async (businessId: string, rating: number) => {
      if (!myRow) return;
      const previous = businessRatingRows.find((r) => r.business_id === businessId && r.profile_id === myRow.id);
      setBusinessRatingRows((rows) => {
        const withoutMine = rows.filter((r) => !(r.business_id === businessId && r.profile_id === myRow.id));
        return [...withoutMine, { id: previous?.id ?? makeTempId(), business_id: businessId, profile_id: myRow.id, rating, created_at: new Date().toISOString() }];
      });
      const { error } = await supabase
        .from('business_ratings')
        .upsert({ business_id: businessId, profile_id: myRow.id, rating }, { onConflict: 'business_id,profile_id' });
      if (error) {
        setBusinessRatingRows((rows) => {
          const withoutMine = rows.filter((r) => !(r.business_id === businessId && r.profile_id === myRow.id));
          return previous ? [...withoutMine, previous] : withoutMine;
        });
        notify("Couldn't save rating", 'Something went wrong saving your rating. Try again.');
      }
    },
    [myRow, businessRatingRows]
  );

  const logModeration = useCallback(
    (entityType: ModerationLogRow['entity_type'], summary: string) => {
      if (!myRow) return;
      setModerationLogRows((rows) => [
        { id: `local-${Date.now()}`, community_id: myRow.community_id, board_profile_id: myRow.id, entity_type: entityType, summary, created_at: new Date().toISOString() },
        ...rows,
      ]);
    },
    [myRow]
  );

  const deleteClubPost = useCallback(
    async (postId: string) => {
      const post = clubPostRows.find((p) => p.id === postId);
      const { error } = await supabase.rpc('moderate_delete_club_post', { p_post_id: postId });
      if (error) {
        notify("Couldn't delete", 'Something went wrong deleting this post. Try again.');
        return;
      }
      setClubPostRows((rows) => rows.filter((p) => p.id !== postId));
      if (post) logModeration('club_post', post.text);
    },
    [clubPostRows, logModeration]
  );

  const deleteEvent = useCallback(
    async (eventId: string) => {
      const event = eventRows.find((e) => e.id === eventId);
      const { error } = await supabase.rpc('moderate_delete_event', { p_event_id: eventId });
      if (error) {
        notify("Couldn't delete", 'Something went wrong deleting this event. Try again.');
        return;
      }
      setEventRows((rows) => rows.filter((e) => e.id !== eventId));
      if (event) logModeration('event', event.title);
    },
    [eventRows, logModeration]
  );

  const deleteSpot = useCallback(
    async (spotId: string) => {
      const spot = spotRows.find((s) => s.id === spotId);
      const { error } = await supabase.rpc('moderate_delete_spot', { p_spot_id: spotId });
      if (error) {
        notify("Couldn't delete", 'Something went wrong deleting this spot. Try again.');
        return;
      }
      setSpotRows((rows) => rows.filter((s) => s.id !== spotId));
      if (spot) logModeration('community_spot', spot.name);
    },
    [spotRows, logModeration]
  );

  const deleteBusiness = useCallback(
    async (businessId: string) => {
      const business = businessRows.find((b) => b.id === businessId);
      const { error } = await supabase.rpc('moderate_delete_business', { p_business_id: businessId });
      if (error) {
        notify("Couldn't delete", 'Something went wrong deleting this listing. Try again.');
        return;
      }
      setBusinessRows((rows) => rows.filter((b) => b.id !== businessId));
      if (business) logModeration('business', business.name);
    },
    [businessRows, logModeration]
  );

  const deleteAsk = useCallback(
    async (askId: string) => {
      const ask = askRows.find((a) => a.id === askId);
      const { error } = await supabase.rpc('moderate_delete_ask', { p_ask_id: askId });
      if (error) {
        notify("Couldn't delete", 'Something went wrong deleting this ask. Try again.');
        return;
      }
      setAskRows((rows) => rows.filter((a) => a.id !== askId));
      if (ask) logModeration('ask', ask.text);
    },
    [askRows, logModeration]
  );

  const deletePoll = useCallback(
    async (pollId: string) => {
      const poll = pollRows.find((p) => p.id === pollId);
      const { error } = await supabase.rpc('moderate_delete_poll', { p_poll_id: pollId });
      if (error) {
        notify("Couldn't delete", 'Something went wrong deleting this vote. Try again.');
        return;
      }
      setPollRows((rows) => rows.filter((p) => p.id !== pollId));
      setPollOptionRows((rows) => rows.filter((o) => o.poll_id !== pollId));
      setPollVoteRows((rows) => rows.filter((v) => v.poll_id !== pollId));
      if (poll) logModeration('poll', poll.title);
    },
    [pollRows, logModeration]
  );

  const addPost = useCallback(
    async (text: string) => {
      if (!myRow) return;
      const tempId = makeTempId();
      setCommunityPostRows((rows) => [
        { id: tempId, community_id: myRow.community_id, author_profile_id: myRow.id, text, created_at: new Date().toISOString() },
        ...rows,
      ]);
      const { data, error } = await supabase
        .from('community_posts')
        .insert({ community_id: myRow.community_id, author_profile_id: myRow.id, text })
        .select()
        .single();
      if (error || !data) {
        setCommunityPostRows((rows) => rows.filter((r) => r.id !== tempId));
        notify("Couldn't post", 'Something went wrong sending your post. Try again.');
        return;
      }
      setCommunityPostRows((rows) => rows.map((r) => (r.id === tempId ? (data as CommunityPostRow) : r)));
    },
    [myRow]
  );

  const deletePost = useCallback(
    async (postId: string) => {
      const post = communityPostRows.find((p) => p.id === postId);
      const { error } = await supabase.rpc('moderate_delete_post', { p_post_id: postId });
      if (error) {
        notify("Couldn't delete", 'Something went wrong deleting this post. Try again.');
        return;
      }
      setCommunityPostRows((rows) => rows.filter((p) => p.id !== postId));
      if (post) logModeration('community_post', post.text);
    },
    [communityPostRows, logModeration]
  );

  const reportAlert = useCallback(
    async (title: string, body: string) => {
      if (!myRow) return;
      const tempId = makeTempId();
      setAlertRows((rows) => [
        { id: tempId, community_id: myRow.community_id, author_profile_id: myRow.id, title, body, created_at: new Date().toISOString() },
        ...rows,
      ]);
      const { data, error } = await supabase
        .from('alerts')
        .insert({ community_id: myRow.community_id, author_profile_id: myRow.id, title, body })
        .select()
        .single();
      if (error || !data) {
        setAlertRows((rows) => rows.filter((r) => r.id !== tempId));
        notify("Couldn't report alert", 'Something went wrong posting this alert. Try again.');
        return;
      }
      setAlertRows((rows) => rows.map((r) => (r.id === tempId ? (data as AlertRow) : r)));
    },
    [myRow]
  );

  const dismissAlert = useCallback(
    async (alertId: string) => {
      if (!myRow) return;
      setAlertDismissalRows((rows) => [...rows, { alert_id: alertId, profile_id: myRow.id, dismissed_at: new Date().toISOString() }]);
      const { error } = await supabase.from('alert_dismissals').insert({ alert_id: alertId, profile_id: myRow.id });
      if (error) {
        setAlertDismissalRows((rows) => rows.filter((r) => !(r.alert_id === alertId && r.profile_id === myRow.id)));
        notify("Couldn't dismiss", 'Something went wrong hiding this alert. Try again.');
      }
    },
    [myRow]
  );

  const deleteAlert = useCallback(
    async (alertId: string) => {
      const alert = alertRows.find((a) => a.id === alertId);
      const { error } = await supabase.rpc('moderate_delete_alert', { p_alert_id: alertId });
      if (error) {
        notify("Couldn't delete", 'Something went wrong deleting this alert. Try again.');
        return;
      }
      setAlertRows((rows) => rows.filter((a) => a.id !== alertId));
      if (alert) logModeration('alert', alert.title);
    },
    [alertRows, logModeration]
  );

  const sendBoardMessage = useCallback(
    async (text: string, targetProfileId?: string) => {
      if (!myRow) return;
      // No target = a resident writing to their own thread. A target = a board
      // member replying inside someone else's thread from the inbox.
      const profileId = targetProfileId ?? myRow.id;
      const fromBoard = !!targetProfileId;
      const tempId = makeTempId();
      setBoardMessageRows((rows) => [
        ...rows,
        { id: tempId, community_id: myRow.community_id, profile_id: profileId, from_board: fromBoard, text, created_at: new Date().toISOString() },
      ]);
      const { data, error } = await supabase
        .from('board_messages')
        .insert({ community_id: myRow.community_id, profile_id: profileId, from_board: fromBoard, text })
        .select()
        .single();
      if (error || !data) {
        setBoardMessageRows((rows) => rows.filter((r) => r.id !== tempId));
        notify("Couldn't send", 'Something went wrong sending your message. Try again.');
        return;
      }
      setBoardMessageRows((rows) => rows.map((r) => (r.id === tempId ? (data as BoardMessageRow) : r)));
    },
    [myRow]
  );

  const value = useMemo<AppState>(
    () => ({
      session,
      sessionLoading,
      dataLoading,
      hasProfile: !!myRow,
      myProfileId: myRow?.id ?? null,
      isBoardMember: myRow?.is_board_member ?? false,
      logout,
      completeSignup,
      listOpenHouses,
      isRealtorAccount,
      realtorProfile,
      realtorSignup,
      fetchCommunityInsights,
      profile,
      setProfile,
      updateAvatarUrl,
      addFamilyMember,
      removeFamilyMember,
      communityName,
      signupKey,
      directory,
      houses,
      matches,
      clubs,
      events,
      addEvent,
      asks,
      polls,
      pros,
      realtors,
      spots,
      addSpot,
      submitHomeLead,
      neighborhoodScore,
      neighborhoodTrends,
      neighborhoods,
      notifications,
      announcements,
      addAnnouncement,
      boardThreads,
      sendBoardMessage,
      archivedThreadIds,
      archiveThread,
      unarchiveThread,
      readNotificationIds,
      markNotificationRead,
      markAllNotificationsRead,
      deleteNotification,
      unreadNotificationCount,
      addAsk,
      sendChatMessage,
      votes,
      vote,
      addPoll,
      eventRsvps,
      toggleEventRsvp,
      wavedIds,
      sendWave,
      joinedClubIds,
      toggleClubJoined,
      addClubPost,
      createClub,
      updateClubHeaderImage,
      clubEventRsvps,
      toggleClubEventRsvp,
      moderationLog,
      deleteClubPost,
      deleteEvent,
      deleteSpot,
      deleteAsk,
      deletePoll,
      posts,
      addPost,
      deletePost,
      businesses,
      addBusiness,
      rateBusiness,
      deleteBusiness,
      alerts,
      reportAlert,
      dismissAlert,
      deleteAlert,
    }),
    [
      session,
      sessionLoading,
      dataLoading,
      myRow,
      logout,
      completeSignup,
      listOpenHouses,
      isRealtorAccount,
      realtorProfile,
      realtorSignup,
      fetchCommunityInsights,
      profile,
      setProfile,
      updateAvatarUrl,
      addFamilyMember,
      removeFamilyMember,
      communityName,
      signupKey,
      directory,
      houses,
      matches,
      clubs,
      events,
      addEvent,
      asks,
      polls,
      pros,
      realtors,
      spots,
      addSpot,
      submitHomeLead,
      neighborhoodScore,
      neighborhoodTrends,
      neighborhoods,
      notifications,
      announcements,
      addAnnouncement,
      boardThreads,
      sendBoardMessage,
      archivedThreadIds,
      archiveThread,
      unarchiveThread,
      readNotificationIds,
      markNotificationRead,
      markAllNotificationsRead,
      deleteNotification,
      unreadNotificationCount,
      addAsk,
      sendChatMessage,
      votes,
      vote,
      addPoll,
      eventRsvps,
      toggleEventRsvp,
      wavedIds,
      sendWave,
      joinedClubIds,
      toggleClubJoined,
      addClubPost,
      createClub,
      updateClubHeaderImage,
      clubEventRsvps,
      toggleClubEventRsvp,
      moderationLog,
      deleteClubPost,
      deleteEvent,
      deleteSpot,
      deleteAsk,
      deletePoll,
      posts,
      addPost,
      deletePost,
      businesses,
      addBusiness,
      rateBusiness,
      deleteBusiness,
      alerts,
      reportAlert,
      dismissAlert,
      deleteAlert,
    ]
  );

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useAppState() {
  const ctx = useContext(AppStateContext);
  if (!ctx) throw new Error('useAppState must be used within AppStateProvider');
  return ctx;
}
