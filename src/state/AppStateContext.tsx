import { Session } from '@supabase/supabase-js';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { ProfileData } from '../data/constants';
import { Announcement, Ask, Club, EventItem, FamilyMember, Fine, House, MatchNeighbor, NotificationItem, Person, Pro } from '../data/types';
import {
  AskMessageRow,
  AskRow,
  BoardMessageRow,
  ClubMemberRow,
  ClubPostRow,
  ClubRow,
  EventRow,
  EventRsvpRow,
  FamilyMemberRow,
  FineRow,
  FineVoteRow,
  HouseRow,
  AnnouncementRow,
  NotificationRow,
  ProRow,
  ProfileRow,
  WaveRow,
} from '../lib/database.types';
import { supabase } from '../lib/supabase';
import { theme } from '../theme';

export type Profile = ProfileData;
type Vote = 'fair' | 'unfair';

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
  }) => Promise<void>;
  listOpenHouses: (signupKey: string) => Promise<House[]>;

  // profile
  profile: Profile;
  setProfile: (p: Profile) => void;
  addFamilyMember: (m: FamilyMember) => void;
  removeFamilyMember: (index: number) => void;

  // community data
  directory: Person[];
  houses: House[];
  matches: MatchNeighbor[];
  clubs: Club[];
  events: EventItem[];
  asks: Ask[];
  fines: Fine[];
  pros: Pro[];
  notifications: NotificationItem[];
  announcements: Announcement[];
  boardMessages: { from: 'you' | 'them'; text: string }[];
  sendBoardMessage: (text: string) => void;

  // notifications
  readNotificationIds: string[];
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  unreadNotificationCount: number;

  // asks + votes
  addAsk: (text: string) => void;
  sendChatMessage: (askId: string, text: string) => void;
  votes: Record<string, Vote>;
  vote: (fineId: string, which: Vote) => void;

  // event RSVPs
  eventRsvps: Record<string, boolean>;
  toggleEventRsvp: (eventId: string) => void;

  // "say hi" / wave sent, per person id
  wavedIds: string[];
  sendWave: (personId: string) => void;

  // club membership
  joinedClubIds: string[];
  toggleClubJoined: (clubId: string) => void;
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
  const [fineRows, setFineRows] = useState<FineRow[]>([]);
  const [fineVoteRows, setFineVoteRows] = useState<FineVoteRow[]>([]);
  const [proRows, setProRows] = useState<ProRow[]>([]);
  const [notificationRows, setNotificationRows] = useState<NotificationRow[]>([]);
  const [announcementRows, setAnnouncementRows] = useState<AnnouncementRow[]>([]);
  const [boardMessageRows, setBoardMessageRows] = useState<BoardMessageRow[]>([]);
  const [waveRows, setWaveRows] = useState<WaveRow[]>([]);

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
      setDataLoading(false);
      return;
    }

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
      fineRes,
      fineVoteRes,
      proRes,
      notificationRes,
      announcementRes,
      boardMessageRes,
      waveRes,
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
      supabase.from('fines').select('*'),
      supabase.from('fine_votes').select('*'),
      supabase.from('pros').select('*'),
      supabase.from('notifications').select('*').order('created_at', { ascending: false }),
      supabase.from('announcements').select('*').order('created_at', { ascending: false }),
      supabase.from('board_messages').select('*').order('created_at', { ascending: true }),
      supabase.from('waves').select('*'),
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
    setFineRows((fineRes.data ?? []) as FineRow[]);
    setFineVoteRows((fineVoteRes.data ?? []) as FineVoteRow[]);
    setProRows((proRes.data ?? []) as ProRow[]);
    setNotificationRows((notificationRes.data ?? []) as NotificationRow[]);
    setAnnouncementRows((announcementRes.data ?? []) as AnnouncementRow[]);
    setBoardMessageRows((boardMessageRes.data ?? []) as BoardMessageRow[]);
    setWaveRows((waveRes.data ?? []) as WaveRow[]);
    setDataLoading(false);
  }, []);

  useEffect(() => {
    if (session) {
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
      setFineRows([]);
      setFineVoteRows([]);
      setProRows([]);
      setNotificationRows([]);
      setAnnouncementRows([]);
      setBoardMessageRows([]);
      setWaveRows([]);
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
    }) => {
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({ email: args.email, password: args.password });
      if (signUpError) throw signUpError;
      if (!signUpData.session) {
        throw new Error('Check your email to confirm your account, then sign in.');
      }
      const newUserId = signUpData.session.user.id;
      const { error: rpcError } = await supabase.rpc('complete_profile', {
        signup_key: args.signupKey,
        p_first_name: args.firstName,
        p_last_name: args.lastName,
        p_age: args.age,
        p_house_id: args.houseId,
        p_profession: args.profession,
        p_years_in: args.yearsIn,
        p_bio: args.bio,
        p_interests: args.interests,
      });
      if (rpcError) throw rpcError;
      if (args.family.length) {
        await supabase
          .from('family_members')
          .insert(args.family.map((f) => ({ profile_id: newUserId, name: f.name, relation: f.relation, age: f.age })));
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

  const profilesById = useMemo(() => {
    const map = new Map<string, ProfileRow>();
    if (myRow) map.set(myRow.id, myRow);
    for (const p of directoryRows) map.set(p.id, p);
    return map;
  }, [myRow, directoryRows]);

  const personRoster = useCallback(
    (profileId: string) => {
      const p = profilesById.get(profileId);
      return { initials: p ? initialsFor(p.first_name, p.last_name) : '?', bg: colorForId(profileId) };
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
      family: myFamily.map((f) => ({ id: f.id, name: f.name, relation: f.relation, age: f.age })),
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

  const directory: Person[] = useMemo(() => {
    const myInterests = new Set(myRow?.interests ?? []);
    return directoryRows.map((row) => {
      const family = (familyByProfile[row.id] ?? []).map((f) => ({ name: f.name, relation: f.relation, age: f.age }));
      const myClubs = clubMemberRows.filter((m) => m.profile_id === row.id).map((m) => m.club_id);
      return {
        id: row.id,
        name: `${row.first_name} ${row.last_name}`.trim(),
        initials: initialsFor(row.first_name, row.last_name),
        bg: colorForId(row.id),
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
        street: p.street,
        shared: p.shared,
        note: p.job,
        connected: wavedIds.includes(p.id) && p.connected,
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
            who: author ? `${author.first_name} ${author.last_name}`.trim() : 'Neighbor',
            initials: author ? initialsFor(author.first_name, author.last_name) : '?',
            bg: colorForId(p.author_profile_id),
            text: p.text,
          };
        });
      const lead = row.lead_profile_id ? profilesById.get(row.lead_profile_id) : undefined;
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
              name: `${lead.first_name} ${lead.last_name}`.trim(),
              initials: initialsFor(lead.first_name, lead.last_name),
              bg: colorForId(lead.id),
              job: lead.job || lead.profession,
            }
          : { name: '', initials: '?', bg: theme.colors.sky, job: '' },
        about: row.about,
        next: { title: row.next_title, when: row.next_when, where: row.next_where, going: 0 },
        rules: row.rules,
        posts,
        roster: members.slice(0, 4).map((m) => personRoster(m.profile_id)),
      };
    });
  }, [clubRows, clubMembersByClub, clubPostRows, profilesById, personRoster]);

  const events: EventItem[] = useMemo(() => {
    return eventRows.map((row) => {
      const rsvps = eventRsvpRows.filter((r) => r.event_id === row.id && r.going);
      const host = row.host_profile_id ? profilesById.get(row.host_profile_id) : undefined;
      const { mon, day } = monthDay(row.event_date);
      return {
        id: row.id,
        emoji: row.emoji,
        mon,
        day,
        title: row.title,
        time: row.event_time,
        where: row.where_text,
        host: host
          ? { name: `${host.first_name} ${host.last_name}`.trim(), initials: initialsFor(host.first_name, host.last_name), bg: colorForId(host.id) }
          : { name: row.host_name, initials: (row.host_name[0] ?? '?').toUpperCase(), bg: theme.colors.mint },
        roster: rsvps.slice(0, 4).map((r) => personRoster(r.profile_id)),
        going: rsvps.length,
        rsvp: eventRsvpRows.some((r) => r.event_id === row.id && r.profile_id === myRow?.id && r.going),
        accent: row.accent,
        accentDeep: row.accent_deep,
        desc: row.description,
      };
    });
  }, [eventRows, eventRsvpRows, profilesById, myRow, personRoster]);

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
        who: row.author_profile_id === myRow?.id ? 'You' : author ? `${author.first_name} ${author.last_name}`.trim() : 'Neighbor',
        initials: author ? initialsFor(author.first_name, author.last_name) : '?',
        bg: colorForId(row.author_profile_id),
        kind: row.kind,
        text: row.text,
        messages,
      };
    });
  }, [askRows, askMessageRows, profilesById, myRow]);

  const fines: Fine[] = useMemo(() => {
    return fineRows.map((row) => {
      const rowVotes = fineVoteRows.filter((v) => v.fine_id === row.id);
      return {
        id: row.id,
        desc: row.description,
        addr: row.address,
        amount: row.amount,
        fair: rowVotes.filter((v) => v.vote === 'fair').length,
        unfair: rowVotes.filter((v) => v.vote === 'unfair').length,
        comment: row.comment,
      };
    });
  }, [fineRows, fineVoteRows]);

  const votes: Record<string, Vote> = useMemo(() => {
    const out: Record<string, Vote> = {};
    for (const v of fineVoteRows) if (v.profile_id === myRow?.id) out[v.fine_id] = v.vote;
    return out;
  }, [fineVoteRows, myRow]);

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

  const boardMessages = useMemo(
    () => boardMessageRows.map((r) => ({ from: (r.from_board ? 'them' : 'you') as 'you' | 'them', text: r.text })),
    [boardMessageRows]
  );

  const setProfile = useCallback(
    async (p: Profile) => {
      if (!myRow) return;
      await supabase
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
        })
        .eq('id', myRow.id);
      await supabase.from('family_members').delete().eq('profile_id', myRow.id);
      if (p.family.length) {
        await supabase
          .from('family_members')
          .insert(p.family.map((f) => ({ profile_id: myRow.id, name: f.name, relation: f.relation, age: f.age })));
      }
      await refreshAll();
    },
    [myRow, refreshAll]
  );

  const addFamilyMember = useCallback(
    async (m: FamilyMember) => {
      if (!myRow) return;
      await supabase.from('family_members').insert({ profile_id: myRow.id, name: m.name, relation: m.relation, age: m.age });
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

  const addAsk = useCallback(
    async (text: string) => {
      if (!myRow) return;
      const { data } = await supabase
        .from('asks')
        .insert({ community_id: myRow.community_id, author_profile_id: myRow.id, kind: 'Ask', text })
        .select()
        .single();
      if (!data) return;
      const askRow = data as AskRow;
      setAskRows((rows) => [askRow, ...rows]);
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
      const { data } = await supabase
        .from('ask_messages')
        .insert({ ask_id: askId, sender_profile_id: myRow.id, text })
        .select()
        .single();
      if (data) setAskMessageRows((rows) => [...rows, data as AskMessageRow]);
    },
    [myRow]
  );

  const vote = useCallback(
    async (fineId: string, which: Vote) => {
      if (!myRow || votes[fineId]) return;
      const { data } = await supabase
        .from('fine_votes')
        .insert({ fine_id: fineId, profile_id: myRow.id, vote: which })
        .select()
        .single();
      if (data) setFineVoteRows((rows) => [...rows, data as FineVoteRow]);
    },
    [myRow, votes]
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

  const sendBoardMessage = useCallback(
    async (text: string) => {
      if (!myRow) return;
      const communityId = myRow.community_id;
      const myId = myRow.id;
      const { data } = await supabase
        .from('board_messages')
        .insert({ community_id: communityId, profile_id: myId, from_board: false, text })
        .select()
        .single();
      if (data) setBoardMessageRows((rows) => [...rows, data as BoardMessageRow]);
      setTimeout(async () => {
        const { data: reply } = await supabase
          .from('board_messages')
          .insert({
            community_id: communityId,
            profile_id: myId,
            from_board: true,
            text: "Got it — added to the board's queue. We typically reply within 2 business days. — Cypress Bend HOA",
          })
          .select()
          .single();
        if (reply) setBoardMessageRows((rows) => [...rows, reply as BoardMessageRow]);
      }, 700);
    },
    [myRow]
  );

  const value = useMemo<AppState>(
    () => ({
      session,
      sessionLoading,
      dataLoading,
      hasProfile: !!myRow,
      logout,
      completeSignup,
      listOpenHouses,
      profile,
      setProfile,
      addFamilyMember,
      removeFamilyMember,
      directory,
      houses,
      matches,
      clubs,
      events,
      asks,
      fines,
      pros,
      notifications,
      announcements,
      boardMessages,
      sendBoardMessage,
      readNotificationIds,
      markNotificationRead,
      markAllNotificationsRead,
      unreadNotificationCount,
      addAsk,
      sendChatMessage,
      votes,
      vote,
      eventRsvps,
      toggleEventRsvp,
      wavedIds,
      sendWave,
      joinedClubIds,
      toggleClubJoined,
    }),
    [
      session,
      sessionLoading,
      dataLoading,
      myRow,
      logout,
      completeSignup,
      listOpenHouses,
      profile,
      setProfile,
      addFamilyMember,
      removeFamilyMember,
      directory,
      houses,
      matches,
      clubs,
      events,
      asks,
      fines,
      pros,
      notifications,
      announcements,
      boardMessages,
      sendBoardMessage,
      readNotificationIds,
      markNotificationRead,
      markAllNotificationsRead,
      unreadNotificationCount,
      addAsk,
      sendChatMessage,
      votes,
      vote,
      eventRsvps,
      toggleEventRsvp,
      wavedIds,
      sendWave,
      joinedClubIds,
      toggleClubJoined,
    ]
  );

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useAppState() {
  const ctx = useContext(AppStateContext);
  if (!ctx) throw new Error('useAppState must be used within AppStateProvider');
  return ctx;
}
