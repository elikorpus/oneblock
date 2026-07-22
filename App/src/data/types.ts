export type PersonSummary = {
  id: string;
  name: string;
  initials: string;
  bg: string;
  avatarUrl?: string | null;
};

export type CommunityPost = {
  id: string;
  authorId: string;
  who: string;
  initials: string;
  bg: string;
  avatarUrl: string | null;
  text: string;
  createdAt: string;
};

export type FamilyMember = {
  id?: string;
  name: string;
  relation: 'Spouse' | 'Kid' | 'Pet';
  age: string;
  petType?: string;
};

export type Person = {
  id: string;
  name: string;
  initials: string;
  bg: string;
  avatarUrl: string | null;
  house: string;
  street: string;
  tenure: string;
  job: string;
  relation: string;
  helped: string;
  connected: boolean;
  phone: string;
  email: string;
  bio: string;
  shared: string[];
  family: FamilyMember[];
  clubs: string[];
  isBoardMember: boolean;
  birthday: string | null;
  isPrivate: boolean;
};

export type ClubPost = {
  id: string;
  authorId: string;
  who: string;
  initials: string;
  bg: string;
  avatarUrl: string | null;
  text: string;
};

export type ClubMember = {
  initials: string;
  bg: string;
  photoUrl?: string | null;
};

export type Club = {
  id: string;
  emoji: string;
  name: string;
  meets: string;
  members: number;
  accent: string;
  accentDeep: string;
  tagline: string;
  since: string;
  spot: string;
  lead: { id?: string; name: string; initials: string; bg: string; job: string; avatarUrl?: string | null };
  about: string;
  next: { title: string; when: string; where: string; going: number };
  rules: string[];
  posts: ClubPost[];
  roster: ClubMember[];
  headerUrl: string | null;
};

export type Spot = {
  id: string;
  emoji: string;
  name: string;
  detail: string;
};

export type Business = {
  id: string;
  name: string;
  category: string;
  description: string;
  phone: string;
  website: string;
  address: string;
  isSponsored: boolean;
  addedByProfileId: string | null;
  avgRating: number | null;
  ratingCount: number;
  myRating: number | null;
};

export type AlertItem = {
  id: string;
  title: string;
  body: string;
  authorId: string;
  who: string;
  createdAt: string;
};

export type Realtor = {
  id: string;
  name: string;
  tag: string;
  dealsNote: string;
  phone: string;
  email: string;
};

export type NeighborhoodTrend = {
  label: string;
  value: string;
  note: string;
};

export type RealtorProfile = {
  name: string;
  tag: string;
  phone: string;
  email: string;
};

export type CommunityBreakdown = {
  communityId: string;
  householdCount: number;
  housesTotal: number;
  kidsCount: number;
  eventsLast90d: number;
  avgResponseMinutes: number | null;
  connectedRate: number | null;
  clubParticipationRate: number | null;
  welcomeRate: number | null;
  score: number | null;
};

export type ModerationLogEntry = {
  id: string;
  entityType: 'club_post' | 'event' | 'community_spot' | 'ask' | 'community_post' | 'poll' | 'business' | 'alert';
  summary: string;
  who: string;
  when: string;
};

export type BoardMessage = {
  fromBoard: boolean;
  text: string;
  createdAt: string;
};

/** One resident's conversation with the board. Board members see every thread in
 * their community; residents only ever see their own (enforced by RLS). */
export type BoardThread = {
  residentId: string;
  residentName: string;
  initials: string;
  bg: string;
  messages: BoardMessage[];
  lastMessageAt: string;
};

export type EventItem = {
  id: string;
  emoji: string;
  mon: string;
  day: string;
  /** Raw ISO (YYYY-MM-DD) event date, or null for an undated event — used to filter the
   * homepage down to today/upcoming RSVPs since mon/day alone can't be sorted or compared. */
  date: string | null;
  title: string;
  time: string;
  where: string;
  host: PersonSummary | { name: string; initials: string; bg: string };
  roster: ClubMember[];
  going: number;
  rsvp: boolean;
  accent: string;
  accentDeep: string;
  desc: string;
  club?: { id: string; name: string; emoji: string };
};

export type ChatMessage = {
  from: 'you' | 'them';
  text: string;
};

export type Ask = {
  id: string;
  authorId: string;
  who: string;
  initials: string;
  bg: string;
  kind: 'Borrow' | 'Favor' | 'Recommend' | 'Ask';
  text: string;
  messages: ChatMessage[];
};

export type PollOption = {
  id: string;
  text: string;
  votes: number;
};

export type Poll = {
  id: string;
  title: string;
  description: string;
  options: PollOption[];
  totalVotes: number;
};

export type Pro = {
  name: string;
  used: number;
  tag: string;
};

export type NotificationGo =
  | { type: 'tab'; id: string }
  | { type: 'event'; id: string }
  | { type: 'person'; id: string }
  | { type: 'ask'; id: string };

export type NotificationItem = {
  id: string;
  emoji: string;
  tint: string;
  title: string;
  sub: string;
  time: string;
  go: NotificationGo;
};

export type Announcement = {
  id: string;
  title: string;
  body: string;
  authorName: string;
  createdAt: string;
};

export type House = {
  id: string;
  address: string;
  latitude: number;
  longitude: number;
  claimed: boolean;
  you?: boolean;
};

export type MatchNeighbor = {
  id: string;
  name: string;
  initials: string;
  bg: string;
  avatarUrl: string | null;
  street: string;
  shared: string[];
  note: string;
  connected?: boolean;
  isPrivate: boolean;
};

export type Neighborhood = {
  id: string;
  name: string;
  score: number | null;
  you: boolean;
  householdCount: number;
  eventsPerMonth: number;
  kidsCount: number;
};
