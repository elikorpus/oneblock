import React from 'react';
import { StyleProp, Text, TextStyle } from 'react-native';
import { theme } from '../theme';

export type PillTagTone = 'grass' | 'outline' | 'marigold' | 'ink';

const TONES: Record<PillTagTone, { bg: string; fg: string; borderColor: string }> = {
  grass: { bg: theme.colors.grassPale, fg: theme.colors.grassDeep, borderColor: 'transparent' },
  outline: { bg: theme.colors.paper, fg: theme.colors.grassDeep, borderColor: theme.colors.line },
  marigold: { bg: theme.colors.marigoldSoft, fg: theme.colors.marigoldInk, borderColor: 'transparent' },
  ink: { bg: theme.colors.ink, fg: theme.colors.paper, borderColor: theme.colors.ink },
};

export type PillTagProps = {
  children: React.ReactNode;
  tone?: PillTagTone;
  uppercase?: boolean;
  style?: StyleProp<TextStyle>;
};

/** Small non-interactive pill — kind badges, shared-interest tags, counts. */
export function PillTag({ children, tone = 'grass', uppercase = false, style }: PillTagProps) {
  const t = TONES[tone];
  return (
    <Text
      style={[
        {
          backgroundColor: t.bg,
          color: t.fg,
          borderWidth: 1,
          borderColor: t.borderColor,
          fontFamily: theme.font.bodyBold,
          fontSize: 11,
          borderRadius: theme.radius.pill,
          paddingVertical: 3,
          paddingHorizontal: 8,
          letterSpacing: uppercase ? 0.4 : 0,
          textTransform: uppercase ? 'uppercase' : 'none',
          overflow: 'hidden',
        },
        style,
      ]}
    >
      {children}
    </Text>
  );
}
