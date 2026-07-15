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

export type FineRow = {
  id: string;
  community_id: string;
  description: string;
  address: string;
  amount: number;
  comment: string;
  created_at: string;
};

export type FineVoteRow = { fine_id: string; profile_id: string; vote: 'fair' | 'unfair' };

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
  go_type: 'tab' | 'event' | 'person';
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
      fines: Rows<FineRow>;
      fine_votes: Rows<FineVoteRow>;
      pros: Rows<ProRow>;
      notifications: Rows<NotificationRow>;
      announcements: Rows<AnnouncementRow>;
      board_messages: Rows<BoardMessageRow>;
      waves: Rows<WaveRow>;
    };
    Views: Record<string, never>;
    Functions: {
      validate_signup_key: {
        Args: { key: string };
        Returns: { community_id: string; name: string }[];
      };
      complete_profile: {
        Args: {
          signup_key: string;
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
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
