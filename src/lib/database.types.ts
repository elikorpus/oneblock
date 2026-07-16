/** Hand-written to match supabase/schema.sql (no CLI access to run `supabase gen types` against the live project). */

type TableDef<Row, Insert, Update> = { Row: Row; Insert: Insert; Update: Update };

export type CommunityRow = {
  id: string;
  name: string;
  signup_key: string;
  created_at: string;
};

export type ProfileRow = {
  id: string;
  community_id: string;
  first_name: string;
  last_name: string;
  age: string;
  street: string;
  profession: string;
  years_in: string;
  bio: string;
  interests: string[];
  job: string;
  phone: string;
  house_id: string | null;
  connected: boolean;
  helped_count: number;
  is_board_member: boolean;
  created_at: string;
};

export type FamilyMemberRow = {
  id: string;
  profile_id: string;
  name: string;
  relation: 'Spouse' | 'Kid' | 'Pet';
  age: string;
  pet_type: string | null;
};

export type HouseRow = {
  id: string;
  community_id: string;
  address: string;
  latitude: number;
  longitude: number;
  resident_profile_id: string | null;
};

export type OpenHouseRow = {
  house_id: string;
  address: string;
  latitude: number;
  longitude: number;
};

export type ClubRow = {
  id: string;
  community_id: string;
  emoji: string;
  name: string;
  meets: string;
  accent: string;
  accent_deep: string;
  tagline: string;
  since_text: string;
  spot: string;
  about: string;
  next_title: string;
  next_when: string;
  next_where: string;
  lead_profile_id: string | null;
  rules: string[];
  created_at: string;
};

export type ClubMemberRow = { club_id: string; profile_id: string; joined_at: string };

export type ClubPostRow = {
  id: string;
  club_id: string;
  author_profile_id: string;
  text: string;
  created_at: string;
};

export type EventRow = {
  id: string;
  community_id: string;
  emoji: string;
  title: string;
  event_date: string | null;
  event_time: string;
  where_text: string;
  host_profile_id: string | null;
  host_name: string;
  accent: string;
  accent_deep: string;
  description: string;
  created_at: string;
};

export type EventRsvpRow = { event_id: string; profile_id: string; going: boolean };

export type AskRow = {
  id: string;
  community_id: string;
  author_profile_id: string;
  kind: 'Borrow' | 'Favor' | 'Recommend' | 'Ask';
  text: string;
  created_at: string;
};

export type AskMessageRow = {
  id: string;
  ask_id: string;
  sender_profile_id: string;
  text: string;
  created_at: string;
};

export type AskHideRow = { ask_id: string; profile_id: string; created_at: string };

export type PollRow = {
  id: string;
  community_id: string;
  board_profile_id: string | null;
  title: string;
  description: string;
  option_a: string;
  option_b: string;
  created_at: string;
};

export type PollVoteRow = { poll_id: string; profile_id: string; choice: 'a' | 'b' };

export type ProRow = {
  id: string;
  community_id: string;
  name: string;
  tag: string;
  used_count: number;
};

export type NotificationRow = {
  id: string;
  community_id: string;
  profile_id: string;
  emoji: string;
  tint: string;
  title: string;
  sub: string;
  go_type: 'tab' | 'event' | 'person' | 'ask';
  go_id: string;
  read: boolean;
  created_at: string;
};

export type AnnouncementRow = {
  id: string;
  community_id: string;
  author_profile_id: string | null;
  title: string;
  body: string;
  created_at: string;
};

export type BoardMessageRow = {
  id: string;
  community_id: string;
  profile_id: string;
  from_board: boolean;
  text: string;
  created_at: string;
};

export type WaveRow = { from_profile_id: string; to_profile_id: string; created_at: string };

export type RealtorRow = {
  id: string;
  community_id: string;
  name: string;
  tag: string;
  deals_note: string;
  phone: string;
  email: string;
  created_at: string;
};

export type HomeLeadRow = {
  id: string;
  community_id: string;
  profile_id: string;
  kind: 'list' | 'valuation' | 'realtor_contact';
  realtor_id: string | null;
  created_at: string;
};

export type ClubEventRsvpRow = { club_id: string; profile_id: string; going: boolean };

export type CommunitySpotRow = {
  id: string;
  community_id: string;
  added_by_profile_id: string | null;
  emoji: string;
  name: string;
  detail: string;
  created_at: string;
};

export type CommunityInsightsRow = {
  community_id: string;
  household_count: number;
  houses_total: number;
  kids_count: number;
  events_last_90d: number;
  avg_response_minutes: number | null;
  connected_rate: number | null;
  club_participation_rate: number | null;
  welcome_rate: number | null;
  score: number | null;
};

export type CommunityScoreRow = {
  community_id: string;
  name: string;
  household_count: number;
  events_per_month: number;
  kids_count: number;
  score: number | null;
};

export type RealtorAccountRow = {
  id: string;
  name: string;
  tag: string;
  phone: string;
  email: string;
  created_at: string;
};

export type ModerationLogRow = {
  id: string;
  community_id: string;
  board_profile_id: string | null;
  entity_type: 'club_post' | 'event' | 'community_spot' | 'ask' | 'community_post';
  summary: string;
  created_at: string;
};

export type CommunityPostRow = {
  id: string;
  community_id: string;
  author_profile_id: string;
  text: string;
  created_at: string;
};

type Rows<R> = TableDef<R, Partial<R>, Partial<R>>;

export type Database = {
  public: {
    Tables: {
      communities: Rows<CommunityRow>;
      profiles: Rows<ProfileRow>;
      family_members: Rows<FamilyMemberRow>;
      houses: Rows<HouseRow>;
      clubs: Rows<ClubRow>;
      club_members: Rows<ClubMemberRow>;
      club_posts: Rows<ClubPostRow>;
      events: Rows<EventRow>;
      event_rsvps: Rows<EventRsvpRow>;
      asks: Rows<AskRow>;
      ask_messages: Rows<AskMessageRow>;
      polls: Rows<PollRow>;
      poll_votes: Rows<PollVoteRow>;
      pros: Rows<ProRow>;
      notifications: Rows<NotificationRow>;
      announcements: Rows<AnnouncementRow>;
      board_messages: Rows<BoardMessageRow>;
      waves: Rows<WaveRow>;
      realtors: Rows<RealtorRow>;
      home_leads: Rows<HomeLeadRow>;
      club_event_rsvps: Rows<ClubEventRsvpRow>;
      community_spots: Rows<CommunitySpotRow>;
      realtor_accounts: Rows<RealtorAccountRow>;
      moderation_log: Rows<ModerationLogRow>;
      community_posts: Rows<CommunityPostRow>;
    };
    Views: Record<string, never>;
    Functions: {
      validate_signup_key: {
        Args: { key: string };
        Returns: { community_id: string; name: string }[];
      };
      complete_profile: {
        Args: {
          p_signup_key: string;
          p_first_name: string;
          p_last_name: string;
          p_age: string;
          p_house_id: string;
          p_profession: string;
          p_years_in: string;
          p_bio: string;
          p_interests: string[];
        };
        Returns: void;
      };
      list_open_houses: {
        Args: { key: string };
        Returns: { house_id: string; address: string; latitude: number; longitude: number }[];
      };
      current_community_id: { Args: Record<string, never>; Returns: string };
      current_community_details: { Args: Record<string, never>; Returns: { id: string; name: string; signup_key: string }[] };
      community_insights: { Args: Record<string, never>; Returns: CommunityInsightsRow[] };
      community_insights_for: { Args: { p_community_id: string }; Returns: CommunityInsightsRow[] };
      community_scores: { Args: Record<string, never>; Returns: CommunityScoreRow[] };
      validate_realtor_signup_key: { Args: { key: string }; Returns: boolean };
      complete_realtor_signup: {
        Args: { p_signup_key: string; p_name: string; p_tag: string; p_phone: string; p_email: string };
        Returns: void;
      };
      moderate_delete_club_post: { Args: { p_post_id: string }; Returns: void };
      moderate_delete_event: { Args: { p_event_id: string }; Returns: void };
      moderate_delete_spot: { Args: { p_spot_id: string }; Returns: void };
      moderate_delete_ask: { Args: { p_ask_id: string }; Returns: void };
      moderate_delete_post: { Args: { p_post_id: string }; Returns: void };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
