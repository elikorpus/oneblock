import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { theme } from '../theme';

export type AvatarProps = {
  initials: string;
  bg: string;
  size?: number;
  tilt?: number;
  /** When set, a photo renders in place of the initials sticker. */
  photoUrl?: string | null;
};

/** Sticker-style ink-outlined avatar — the dominant identity glyph in OneBlock. Shows a
 * cropped photo when one's set, falling back to the initials-on-color sticker otherwise. */
export function Avatar({ initials, bg, size = 44, tilt = 0, photoUrl }: AvatarProps) {
  return (
    <View
      style={[
        styles.base,
        theme.hardShadow('sm'),
        {
          width: size,
          height: size,
          backgroundColor: photoUrl ? theme.colors.card : bg,
          borderRadius: size * 0.36,
          transform: [{ rotate: `${tilt}deg` }],
        },
      ]}
    >
      {photoUrl ? (
        <Image source={{ uri: photoUrl }} style={{ width: '100%', height: '100%' }} />
      ) : (
        <Text
          style={{
            fontFamily: theme.font.displaySemibold,
            color: theme.colors.ink,
            fontSize: size * 0.34,
          }}
        >
          {initials}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderWidth: theme.border.avatar,
    borderColor: theme.colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    overflow: 'hidden',
  },
});
