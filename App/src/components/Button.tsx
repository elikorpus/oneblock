import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import { theme } from '../theme';

export type ButtonVariant = 'primary' | 'dark' | 'outline' | 'tint';
export type ButtonSize = 'lg' | 'md' | 'sm';

export type ButtonProps = {
  children: React.ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  block?: boolean;
  disabled?: boolean;
  loading?: boolean;
  leading?: React.ReactNode;
  trailing?: React.ReactNode;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
};

const VARIANTS: Record<ButtonVariant, { bg: string; fg: string; borderColor: string }> = {
  primary: { bg: theme.colors.grass, fg: '#fff', borderColor: theme.colors.grass },
  dark: { bg: theme.colors.ink, fg: theme.colors.paper, borderColor: theme.colors.ink },
  outline: { bg: theme.colors.paper, fg: theme.colors.ink, borderColor: theme.colors.line },
  tint: { bg: theme.colors.grassPale, fg: theme.colors.grassDeep, borderColor: theme.colors.grassPale },
};

const SIZES: Record<ButtonSize, { paddingVertical: number; paddingHorizontal: number; fontSize: number; radius: number }> = {
  lg: { paddingVertical: 16, paddingHorizontal: 16, fontSize: 16, radius: theme.radius.xl },
  md: { paddingVertical: 10, paddingHorizontal: 16, fontSize: 14, radius: theme.radius.md },
  sm: { paddingVertical: 8, paddingHorizontal: 16, fontSize: 13, radius: theme.radius.pill },
};

/** Primary action button. Full-width by default (block:true), matching Button.jsx. */
export function Button({
  children,
  variant = 'primary',
  size = 'lg',
  block = true,
  disabled = false,
  loading = false,
  leading,
  trailing,
  onPress,
  style,
}: ButtonProps) {
  const v = disabled
    ? { bg: theme.colors.line, fg: theme.colors.inkSoft, borderColor: theme.colors.line }
    : VARIANTS[variant];
  const s = SIZES[size];
  return (
    <Pressable
      onPress={disabled || loading ? undefined : onPress}
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor: v.bg,
          borderColor: v.borderColor,
          paddingVertical: s.paddingVertical,
          paddingHorizontal: s.paddingHorizontal,
          borderRadius: s.radius,
          width: block ? '100%' : undefined,
          opacity: pressed && !disabled ? 0.85 : 1,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={v.fg} />
      ) : (
        <View style={styles.content}>
          {leading}
          {/* Always wrapped in Text — JSX like `Post to {name}` compiles to an array of
              children, not a single string, so a `typeof children === 'string'` check
              misses it and silently drops the intended text color. */}
          <Text style={{ fontFamily: theme.font.bodyBold, fontSize: s.fontSize, color: v.fg }}>{children}</Text>
          {trailing}
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderWidth: theme.border.width,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
});
