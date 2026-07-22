import React from 'react';
import { Image, ImageStyle, StyleProp } from 'react-native';

const LONG_LOGO = require('../../assets/oneblock-long-logo.png');
const SMALL_LOGO = require('../../assets/oneblock-small-logo.png');

/** Source asset is 1579×403 — keep new sizes on this ratio so it never stretches. */
const LONG_LOGO_RATIO = 1579 / 403;

/** Horizontal "OneBlock." wordmark lockup — the brand mark wherever text used to say "oneblock." */
export function LongLogo({ height = 22, style }: { height?: number; style?: StyleProp<ImageStyle> }) {
  return <Image source={LONG_LOGO} style={[{ height, width: height * LONG_LOGO_RATIO }, style]} resizeMode="contain" />;
}

/** Square "1B" house mark — the icon-only badge, already rendered on the app's paper background. */
export function SmallLogo({ size = 40, style }: { size?: number; style?: StyleProp<ImageStyle> }) {
  return <Image source={SMALL_LOGO} style={[{ width: size, height: size }, style]} resizeMode="cover" />;
}
