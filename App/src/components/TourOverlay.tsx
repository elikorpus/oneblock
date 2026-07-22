import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { theme } from '../theme';

export type TourRect = { x: number; y: number; width: number; height: number };
export type TourStep = { title: string; body: string };

export type TourOverlayProps = {
  visible: boolean;
  steps: TourStep[];
  stepIndex: number;
  /** Target position in the *host container's* coordinate space, not the window. */
  targetRect: TourRect | null;
  /** Height of the host container, used to sit the tooltip just above the target. */
  containerHeight: number;
  /** Re-rendered copy of whatever is being highlighted, drawn inside the spotlight. */
  spotlight?: React.ReactNode;
  onNext: () => void;
  onSkip: () => void;
};

const PAD = 6;

/** Dims the host container and draws a pill-shaped spotlight over `targetRect`.
 *
 * The spotlight is an opaque pill that re-renders the highlighted control rather
 * than a hole punched through the dim layer — a rectangular hole leaves square
 * bright corners poking out of a rounded ring, and RN can't mask a rounded hole
 * without pulling in SVG.
 *
 * This deliberately renders inline (not in a `Modal`). On web a `Modal` portals
 * to `document.body`, which escapes the phone-shaped frame the app is pinned
 * inside, and window-relative coordinates drift whenever the browser chrome
 * shows or hides. Staying inside the container keeps everything in one
 * coordinate space that re-lays-out on resize. */
export function TourOverlay({
  visible,
  steps,
  stepIndex,
  targetRect,
  containerHeight,
  spotlight,
  onNext,
  onSkip,
}: TourOverlayProps) {
  const step = steps[stepIndex];
  if (!visible || !step) return null;

  const rect = targetRect
    ? {
        x: targetRect.x - PAD,
        y: targetRect.y - PAD,
        width: targetRect.width + PAD * 2,
        height: targetRect.height + PAD * 2,
      }
    : null;

  // Targets live at the bottom of the screen, so anchor the tooltip's *bottom*
  // edge above them and let it grow upward — no guessing at its height.
  const tooltipPos =
    rect && containerHeight > 0
      ? { bottom: Math.max(16, containerHeight - rect.y + 12) }
      : styles.tooltipCentered;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      <View style={[StyleSheet.absoluteFill, styles.dim]} />

      {rect ? (
        <View
          pointerEvents="none"
          style={[styles.spotlight, { top: rect.y, left: rect.x, width: rect.width, height: rect.height }]}
        >
          {spotlight}
        </View>
      ) : null}

      <View style={[styles.tooltip, tooltipPos]}>
        <Text style={styles.title}>{step.title}</Text>
        <Text style={styles.body}>{step.body}</Text>
        <View style={styles.dotsRow}>
          {steps.map((_, i) => (
            <View key={i} style={[styles.dot, { backgroundColor: i === stepIndex ? theme.colors.grass : theme.colors.line }]} />
          ))}
        </View>
        <View style={styles.btnRow}>
          <Pressable onPress={onSkip} style={styles.skipBtn} hitSlop={8}>
            <Text style={styles.skipText}>Skip tour</Text>
          </Pressable>
          <Pressable onPress={onNext} style={styles.nextBtn} hitSlop={8}>
            <Text style={styles.nextText}>{stepIndex === steps.length - 1 ? 'Got it' : 'Next'}</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  dim: { backgroundColor: 'rgba(20,16,10,0.72)' },
  spotlight: {
    position: 'absolute',
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.pill,
    borderWidth: 3,
    borderColor: theme.colors.marigold,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  tooltip: {
    position: 'absolute',
    left: 16,
    right: 16,
    backgroundColor: theme.colors.card,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: theme.colors.ink,
    padding: 20,
  },
  tooltipCentered: { top: '35%' },
  title: { fontFamily: theme.font.displayBold, fontSize: 22, color: theme.colors.ink },
  body: { fontSize: 15, color: theme.colors.inkSoft, marginTop: 8, fontFamily: theme.font.bodyRegular, lineHeight: 15 * 1.4 },
  dotsRow: { flexDirection: 'row', gap: 6, marginTop: 16 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  btnRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 18 },
  skipBtn: { paddingVertical: 10, paddingHorizontal: 6 },
  skipText: { fontSize: 14, color: theme.colors.inkSoft, fontFamily: theme.font.bodyBold },
  nextBtn: { backgroundColor: theme.colors.grass, borderRadius: theme.radius.pill, paddingVertical: 12, paddingHorizontal: 24 },
  nextText: { color: '#fff', fontFamily: theme.font.bodyBold, fontSize: 15 },
});
