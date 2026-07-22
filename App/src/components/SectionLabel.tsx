import React from 'react';
import { Text } from 'react-native';
import { theme } from '../theme';

/** Uppercase, wide-tracked micro-label eyebrow — the signature section heading. */
export function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <Text
      style={{
        fontFamily: theme.font.bodyBold,
        fontSize: theme.label.size,
        letterSpacing: theme.label.tracking,
        textTransform: 'uppercase',
        color: theme.colors.inkSoft,
        marginBottom: 8,
      }}
    >
      {children}
    </Text>
  );
}
