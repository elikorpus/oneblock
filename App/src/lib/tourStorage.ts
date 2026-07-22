import AsyncStorage from '@react-native-async-storage/async-storage';

const TOUR_SEEN_KEY = 'oneblock_tour_seen_v1';

/** Per-device only (not synced to the account) — reinstalling or signing in on
 * another device shows the tour again, which is fine for a short welcome tour. */
export async function hasSeenTour(): Promise<boolean> {
  const v = await AsyncStorage.getItem(TOUR_SEEN_KEY);
  return v === 'true';
}

export async function markTourSeen(): Promise<void> {
  await AsyncStorage.setItem(TOUR_SEEN_KEY, 'true');
}
