import { ChevronLeft } from 'lucide-react-native';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { theme } from '../theme';

export type BackBarProps = {
  title: string;
  onBack: () => void;
  onTitlePress?: () => void;
  right?: React.ReactNode;
};

/** Sticky top bar with a back chevron, title, and optional trailing action. */
export function BackBar({ title, onBack, onTitlePress, right }: BackBarProps) {
  const titleText = (
    <Text style={styles.title} numberOfLines={1}>
      {title}
    </Text>
  );
  return (
    <View style={styles.row}>
      <Pressable onPress={onBack} hitSlop={8} style={styles.backBtn}>
        <ChevronLeft size={20} color={theme.colors.ink} />
      </Pressable>
      {onTitlePress ? (
        <Pressable onPress={onTitlePress} style={{ flex: 1 }} hitSlop={4}>
          {titleText}
        </Pressable>
      ) : (
        titleText
      )}
      {right}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    borderBottomWidth: theme.border.width,
    borderBottomColor: theme.colors.line,
    backgroundColor: theme.colors.paper,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  backBtn: { padding: 4 },
  title: {
    fontFamily: theme.font.displaySemibold,
    fontSize: 17,
    color: theme.colors.ink,
    flex: 1,
  },
});
