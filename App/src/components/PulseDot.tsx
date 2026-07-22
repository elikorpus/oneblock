import React, { useEffect, useRef } from 'react';
import { AccessibilityInfo, Animated } from 'react-native';

export type PulseDotProps = {
  size: number;
  color: string;
};

/** Looping opacity pulse used for map attention dots (nb-pulse). */
export function PulseDot({ size, color }: PulseDotProps) {
  const progress = useRef(new Animated.Value(0.25)).current;

  useEffect(() => {
    let loop: Animated.CompositeAnimation | undefined;
    let cancelled = false;
    AccessibilityInfo.isReduceMotionEnabled().then((reduced) => {
      if (cancelled || reduced) return;
      loop = Animated.loop(
        Animated.sequence([
          Animated.timing(progress, { toValue: 0.55, duration: 800, useNativeDriver: true }),
          Animated.timing(progress, { toValue: 0.25, duration: 800, useNativeDriver: true }),
        ])
      );
      loop.start();
    });
    return () => {
      cancelled = true;
      loop?.stop();
    };
  }, [progress]);

  return (
    <Animated.View
      style={{
        position: 'absolute',
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: color,
        opacity: progress,
      }}
    />
  );
}
