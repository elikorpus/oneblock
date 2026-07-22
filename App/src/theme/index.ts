import { Platform } from 'react-native';
import {
  border,
  colors,
  duration,
  fontFamilies,
  fontSize,
  label,
  lineHeightMultiplier,
  radius,
  space,
  tapMin,
  tilt,
} from './tokens';

export type ShadowSize = 'sm' | 'md' | 'lg' | 'frame';

/**
 * The OneBlock signature is a hard, offset, (nearly) un-blurred "sticker" shadow —
 * `2px 3px 0 rgba(34,29,20,.12)` — rather than soft material elevation.
 * `shadowRadius: 0` on iOS gives a genuinely crisp offset shadow. Android's `elevation`
 * has no offset/blur control, so it only approximates the look there.
 */
export function hardShadow(size: ShadowSize = 'md') {
  const specs: Record<ShadowSize, { dx: number; dy: number; opacity: number; elevation: number }> = {
    sm: { dx: 2, dy: 2.5, opacity: 0.1, elevation: 2 },
    md: { dx: 2, dy: 3, opacity: 0.12, elevation: 3 },
    lg: { dx: 3, dy: 4, opacity: 0.15, elevation: 4 },
    frame: { dx: 8, dy: 10, opacity: 0.15, elevation: 10 },
  };
  const s = specs[size];
  return Platform.select({
    ios: {
      shadowColor: colors.ink,
      shadowOffset: { width: s.dx, height: s.dy },
      shadowOpacity: s.opacity,
      shadowRadius: 0,
    },
    android: {
      elevation: s.elevation,
    },
    default: {},
  });
}

export const theme = {
  colors,
  font: fontFamilies,
  fontSize,
  lineHeightMultiplier,
  label,
  space,
  radius,
  border,
  tilt,
  duration,
  tapMin,
  hardShadow,
} as const;

export type Theme = typeof theme;

export * from './tokens';
