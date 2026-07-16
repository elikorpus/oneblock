/**
 * OneBlock design tokens — ported verbatim from the Claude Design system
 * (tokens/colors.css, typography.css, spacing.css, effects.css).
 */

export const colors = {
  // Neutrals (warm)
  paper: '#FBF6EC',
  card: '#FFFFFF',
  ink: '#221D14',
  inkSoft: '#6E6455',
  line: '#EBE2D2',
  desk: '#E9E2D2',

  // Primary: Grass
  grass: '#3E7C4F',
  grassDeep: '#2C5E3A',
  grassPale: '#E9F1E6',

  // Accent: Marigold
  marigold: '#F4B942',
  marigoldSoft: '#FBEBC7',
  marigoldInk: '#8A6D1C',

  // Accent: Sky
  sky: '#CFE3EA',
  skyDeep: '#5E8FA3',

  // Accent: Peach
  peach: '#F6E2CE',

  // Semantic: alert / negative
  red: '#C4553B',
  redPale: '#F8E4DE',

  // Avatar / category tints
  mint: '#DCEBD2',
  blush: '#FAD9E3',
  lilac: '#E5D9F5',
  apricot: '#FBE3D2',

  // Ink-surface text
  onInk: '#FBF6EC',
  onInkSoft: '#B8AE9C',
} as const;

export const fontFamilies = {
  displayMedium: 'Fraunces_500Medium',
  displaySemibold: 'Fraunces_600SemiBold',
  displayBold: 'Fraunces_700Bold',
  bodyRegular: 'InstrumentSans_400Regular',
  bodyMedium: 'InstrumentSans_500Medium',
  bodySemibold: 'InstrumentSans_600SemiBold',
  bodyBold: 'InstrumentSans_700Bold',
} as const;

export const fontSize = {
  hero: 36,
  displayLg: 32,
  display: 30,
  title: 28,
  heading: 24,
  subhead: 20,
  cardTitle: 17,
  lead: 15,
  body: 14,
  sm: 13,
  xs: 12,
  xxs: 11,
} as const;

export const lineHeightMultiplier = {
  tight: 1.1,
  snug: 1.15,
  body: 1.45,
  relaxed: 1.55,
} as const;

export const label = {
  size: 11,
  tracking: 0.6, // ~0.12em at 11px font size, in RN letterSpacing points
} as const;

export const space = {
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  8: 32,
  screenGutter: 20,
  cardPadding: 16,
} as const;

export const radius = {
  sm: 10,
  md: 12,
  lg: 14,
  xl: 16,
  xxl: 20,
  xxxl: 34,
  pill: 999,
} as const;

export const border = {
  width: 1.5,
  strong: 2,
  avatar: 2.5,
} as const;

export const tilt = {
  cw: 3,
  ccw: -3,
  cwLg: 5,
  ccwLg: -4,
} as const;

export const duration = {
  pop: 220,
  fast: 200,
  heart: 350,
} as const;

export const tapMin = 44;
