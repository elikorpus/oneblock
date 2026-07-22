const MORNING = [
  'Good morning',
  'Morning',
  'Rise and shine',
  'Top of the morning',
  'Rise and grind',
  'Morning sunshine',
  'Hope you slept well',
  "Coffee's calling",
  "Here's to a fresh start",
];
const AFTERNOON = [
  'Good afternoon',
  'Afternoon',
  'Hope your day is going well',
  'Hey there',
  'Halfway through the day',
  "Hope it's been a good one",
  "Hope your day's treating you well",
];
const EVENING = [
  'Good evening',
  'Evening',
  'Hope you had a good one today',
  'Winding down',
  'Hope today treated you well',
  "Here's to a relaxing evening",
];
const NIGHT = [
  'Good night',
  'Still up',
  'Burning the midnight oil',
  "Can't sleep",
  'Night owl',
  'Up late',
  "Hope tomorrow's a good one",
  'Sweet dreams soon',
];

/** Time-of-day greeting, randomized per call so it varies each time the screen mounts. */
export function randomGreeting(date: Date = new Date()): string {
  const hour = date.getHours();
  const pool = hour < 5 ? NIGHT : hour < 12 ? MORNING : hour < 17 ? AFTERNOON : hour < 21 ? EVENING : NIGHT;
  return pool[Math.floor(Math.random() * pool.length)];
}
