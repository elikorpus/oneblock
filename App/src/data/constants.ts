import { FamilyMember } from './types';

export const TENURE = ['Just moved in', 'Under 1 year', '1–3 years', '3–10 years', '10+ years'];

export type InterestGroup = { category: string; items: string[] };

export const INTEREST_GROUPS: InterestGroup[] = [
  {
    category: 'Sports & Fitness',
    items: [
      'Running',
      'Tennis',
      'Golf',
      'Cycling',
      'Yoga',
      'Basketball',
      'Soccer',
      'Swimming',
      'Hiking',
      'Pickleball',
      'Martial arts',
      'Weightlifting',
    ],
  },
  {
    category: 'Food & Drink',
    items: ['Coffee', 'Foodie', 'Cooking', 'Baking', 'Wine', 'Grilling', 'Craft beer'],
  },
  {
    category: 'Outdoors',
    items: ['Camping', 'Gardening', 'Fishing', 'Birdwatching', 'Boating'],
  },
  {
    category: 'Family & Pets',
    items: ['Dogs', 'Cats', 'Young kids', 'Teenagers'],
  },
  {
    category: 'Arts & Hobbies',
    items: ['Photography', 'Books', 'Music', 'DIY', 'Board games', 'Painting', 'Woodworking'],
  },
  {
    category: 'Community',
    items: ['Volunteering', 'Book club', 'Home improvement'],
  },
];

/** Flat list of every interest across all groups, in group order. */
export const ALL_INTERESTS = INTEREST_GROUPS.flatMap((g) => g.items);

export type ProfileData = {
  firstName: string;
  lastName: string;
  age: string;
  street: string;
  profession: string;
  yearsIn: string;
  bio: string;
  interests: string[];
  family: FamilyMember[];
  birthday: string | null;
  avatarUrl: string | null;
  isPrivate: boolean;
};
