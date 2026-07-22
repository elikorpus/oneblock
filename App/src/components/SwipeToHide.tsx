import { Trash2 } from 'lucide-react-native';
import React, { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import { Animated, StyleSheet } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { theme } from '../theme';

export type SwipeToHideProps = {
  onHide: () => void;
  children: React.ReactNode;
};

export type SwipeToHideHandle = {
  /** True from the moment a real swipe release is recognized (open OR snap-back-closed —
   * both go through the same gesture-release handler) until a beat after the row settles.
   * A swipe gesture can end up also registering as a tap on whatever's inside (most
   * reliably reproduced on web, where a mouseup still synthesizes a native click on
   * whatever's underneath, independent of React): if a row's own onPress checks this
   * first and bails out, a swipe never also fires the row's tap action. Checked from a
   * ref rather than React state deliberately — `onSwipeableWillOpen`/`onSwipeableWillClose`
   * fire synchronously inside Swipeable's own gesture-release handler, so a plain ref
   * mutation there is guaranteed to happen-before any click event the same release
   * dispatches afterward; a React state update wouldn't be — the DOM/props update from a
   * state change lands on React's next commit, which isn't guaranteed to beat a
   * synchronously-following native click. */
  hasDragged: () => boolean;
};

/** Wraps a row so swiping it left reveals a "hide" action set apart from the row by a
 * gap, then smoothly collapses the row away instead of yanking it out of the list. */
export const SwipeToHide = forwardRef<SwipeToHideHandle, SwipeToHideProps>(function SwipeToHide(
  { onHide, children },
  ref
) {
  const [height, setHeight] = useState<number | null>(null);
  const collapse = useRef(new Animated.Value(1)).current;
  const hasDraggedRef = useRef(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useImperativeHandle(ref, () => ({ hasDragged: () => hasDraggedRef.current }), []);

  const handleOpen = () => {
    Animated.timing(collapse, {
      toValue: 0,
      duration: 260,
      useNativeDriver: false,
    }).start(({ finished }) => {
      if (finished) onHide();
    });
  };

  return (
    <Animated.View
      style={{
        opacity: collapse,
        marginBottom: collapse.interpolate({ inputRange: [0, 1], outputRange: [0, 16] }),
        maxHeight: height == null ? undefined : collapse.interpolate({ inputRange: [0, 1], outputRange: [0, height] }),
        overflow: 'hidden',
      }}
    >
      <Animated.View onLayout={(e) => setHeight((h) => h ?? e.nativeEvent.layout.height)}>
        <Swipeable
          renderRightActions={(_progress, dragX) => {
            const actionOpacity = dragX.interpolate({ inputRange: [-60, 0], outputRange: [1, 0], extrapolate: 'clamp' });
            return (
              <Animated.View style={[styles.hideActionWrap, { opacity: actionOpacity }]}>
                <Animated.View style={styles.hideAction}>
                  <Trash2 size={16} color="#fff" />
                </Animated.View>
              </Animated.View>
            );
          }}
          onSwipeableWillOpen={() => {
            if (closeTimer.current) clearTimeout(closeTimer.current);
            hasDraggedRef.current = true;
          }}
          onSwipeableWillClose={() => {
            hasDraggedRef.current = true;
            if (closeTimer.current) clearTimeout(closeTimer.current);
            // A beat after the row settles back closed before re-arming taps, so the
            // release from an aborted (under-threshold) swipe can't sneak through either.
            closeTimer.current = setTimeout(() => {
              hasDraggedRef.current = false;
            }, 200);
          }}
          onSwipeableOpen={handleOpen}
          overshootRight={false}
          rightThreshold={40}
        >
          {children}
        </Swipeable>
      </Animated.View>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  hideActionWrap: {
    justifyContent: 'center',
    paddingLeft: 14,
  },
  hideAction: {
    width: 56,
    height: '100%',
    backgroundColor: theme.colors.red,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
