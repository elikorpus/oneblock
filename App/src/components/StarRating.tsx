import { Star } from 'lucide-react-native';
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { theme } from '../theme';

export type StarRatingProps = {
  /** 0-5. Fractional values (e.g. an average) round to the nearest whole star for display. */
  value: number;
  /** Omit for a read-only display; pass to make the stars tappable. */
  onRate?: (rating: number) => void;
  size?: number;
};

/** Five tappable/display stars. Large hit targets since this is used by elderly residents. */
export function StarRating({ value, onRate, size = 22 }: StarRatingProps) {
  const filledCount = Math.round(value);
  return (
    <View style={styles.row}>
      {[1, 2, 3, 4, 5].map((n) => {
        const star = (
          <Star
            size={size}
            color={theme.colors.marigold}
            fill={n <= filledCount ? theme.colors.marigold : 'transparent'}
          />
        );
        return onRate ? (
          <Pressable key={n} onPress={() => onRate(n)} hitSlop={8} style={styles.starBtn}>
            {star}
          </Pressable>
        ) : (
          <View key={n}>{star}</View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 4 },
  starBtn: { padding: 4 },
});
