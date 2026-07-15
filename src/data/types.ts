export type PersonSummary = {
  id: string;
  name: string;
  initials: string;
  bg: string;
};

export type FamilyMember = {
  id?: string;
  name: string;
  relation: 'Spouse' | 'Kid' | 'Pet';
  age: string;
};

export type Person = {
  id: string;
  name: string;
  initials: string;
  bg: string;
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
};

export type ClubPost = {
  who: string;
  initials: string;
  bg: string;
  text: string;
};

export type ClubMember = {
  initials: string;
  bg: string;
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
  lead: { name: string; initials: string; bg: string; job: string };
  about: string;
  next: { title: string; when: string; where: string; going: number };
  rules: string[];
  posts: ClubPost[];
  roster: ClubMember[];
};

export type EventItem = {
  id: string;
  emoji: string;
  mon: string;
  day: string;
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
};

export type ChatMessage = {
  from: 'you' | 'them';
  text: string;
};

export type Ask = {
  id: string;
  who: string;
  initials: string;
  bg: string;
  kind: 'Borrow' | 'Favor' | 'Recommend' | 'Ask';
  text: string;
  messages: ChatMessage[];
};

export type Fine = {
  id: string;
  desc: string;
  addr: string;
  amount: number;
  fair: number;
  unfair: number;
  comment: string;
};

export type Pro = {
  name: string;
  used: number;
  tag: string;
};

export type NotificationGo =
  | { type: 'tab'; id: string }
  | { type: 'event'; id: string }
  | { type: 'person'; id: string };

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
  street: string;
  shared: string[];
  note: string;
  connected?: boolean;
};

export type Neighborhood = {
  name: string;
  score: number;
  you?: boolean;
  blurb: string;
  kids: string;
  events: number;
};
