import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { theme } from '../theme';

export type AvatarProps = {
  initials: string;
  bg: string;
  size?: number;
  tilt?: number;
};

/** Sticker-style ink-outlined initials avatar — the dominant identity glyph in OneBlock. */
export function Avatar({ initials, bg, size = 44, tilt = 0 }: AvatarProps) {
  return (
    <View
      style={[
        styles.base,
        theme.hardShadow('sm'),
        {
          width: size,
          height: size,
          backgroundColor: bg,
          borderRadius: size * 0.36,
          transform: [{ rotate: `${tilt}deg` }],
        },
      ]}
    >
      <Text
        style={{
          fontFamily: theme.font.displaySemibold,
          color: theme.colors.ink,
          fontSize: size * 0.34,
        }}
      >
        {initials}
      </Text>
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
  },
});
