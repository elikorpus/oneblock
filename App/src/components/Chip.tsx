import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { theme } from '../theme';

export type ChipProps = {
  children: React.ReactNode;
  active?: boolean;
  onPress?: () => void;
};

/** Filter / selection pill. Fills ink when active, matching Chip.jsx. */
export function Chip({ children, active = false, onPress }: ChipProps) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.base,
        {
          backgroundColor: active ? theme.colors.ink : theme.colors.card,
          borderColor: active ? theme.colors.ink : theme.colors.line,
        },
      ]}
    >
      <Text
        style={{
          fontFamily: theme.font.bodySemibold,
          fontSize: 13,
          lineHeight: 16,
          color: active ? theme.colors.paper : theme.colors.ink,
        }}
      >
        {children}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderWidth: theme.border.width,
    borderRadius: theme.radius.pill,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
});
