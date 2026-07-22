import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { theme } from '../../theme';

export function Blob({ emoji, tint }: { emoji: string; tint: string }) {
  return (
    <View style={styles.wrap}>
      <View style={[styles.blob, { backgroundColor: tint }]} />
      <View style={[styles.badge, theme.hardShadow('lg')]}>
        <Text style={{ fontSize: 46 }}>{emoji}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 22, alignItems: 'center', justifyContent: 'center' },
  blob: {
    position: 'absolute',
    width: 116,
    height: 116,
    opacity: 0.6,
    borderTopLeftRadius: 50,
    borderTopRightRadius: 60,
    borderBottomRightRadius: 64,
    borderBottomLeftRadius: 44,
  },
  badge: {
    width: 96,
    height: 96,
    backgroundColor: theme.colors.card,
    borderWidth: theme.border.avatar,
    borderColor: theme.colors.ink,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotate: '-4deg' }],
  },
});
