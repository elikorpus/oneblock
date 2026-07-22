import * as ImageManipulator from 'expo-image-manipulator';
import { Check, Minus, Plus, X } from 'lucide-react-native';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { PanGestureHandler, PinchGestureHandler, State } from 'react-native-gesture-handler';
import { ImageCropperModal } from './ImageCropperModal';
import { useAppFrameSize } from '../lib/useAppFrameSize';
import { theme } from '../theme';

export type ImageCropperProps = {
  /** Local/blob URI of the picked-but-not-yet-cropped image, or null to keep the modal closed. */
  uri: string | null;
  /** width:height ratio the crop must land on, e.g. [1, 1] for a square avatar or [2, 1] for a banner. */
  aspect: [number, number];
  onCancel: () => void;
  onDone: (croppedUri: string) => void;
};

const MIN_ZOOM = 1;
const MAX_ZOOM = 4;
const ZOOM_STEP = 0.35;

/** Full-screen pan/pinch/zoom crop tool. Works identically on iOS, Android, and web (unlike
 * expo-image-picker's native allowsEditing, which is a no-op on web and locked to a square on
 * iOS) — everything here is plain gesture-handler + Animated math, so the same code path
 * produces a correctly-cropped image on every platform this app ships to. */
export function ImageCropper({ uri, aspect, onCancel, onDone }: ImageCropperProps) {
  const [natural, setNatural] = useState<{ w: number; h: number } | null>(null);
  const [busy, setBusy] = useState(false);

  const screen = useAppFrameSize();
  const frameMaxWidth = Math.min(screen.width - 48, 420);
  const frameMaxHeight = screen.height * 0.6;
  const frameWidth = frameMaxWidth;
  const frameHeight = Math.min(frameMaxWidth * (aspect[1] / aspect[0]), frameMaxHeight);

  // Committed (post-gesture) state, plus refs mirroring it so gesture callbacks always read
  // the latest value without stale closures.
  const [zoom, setZoom] = useState(1);
  const [translate, setTranslate] = useState({ x: 0, y: 0 });
  const zoomRef = useRef(zoom);
  const translateRef = useRef(translate);
  const panStartRef = useRef({ x: 0, y: 0 });
  const pinchStartZoomRef = useRef(1);

  useEffect(() => {
    if (!uri) return;
    setNatural(null);
    setZoom(1);
    setTranslate({ x: 0, y: 0 });
    zoomRef.current = 1;
    translateRef.current = { x: 0, y: 0 };
    Image.getSize(
      uri,
      (w, h) => setNatural({ w, h }),
      () => setNatural({ w: 1, h: 1 })
    );
  }, [uri]);

  const coverScale = natural ? Math.max(frameWidth / natural.w, frameHeight / natural.h) : 1;
  const totalScale = coverScale * zoom;
  const displayedW = (natural?.w ?? frameWidth) * totalScale;
  const displayedH = (natural?.h ?? frameHeight) * totalScale;
  const maxTranslateX = Math.max(0, (displayedW - frameWidth) / 2);
  const maxTranslateY = Math.max(0, (displayedH - frameHeight) / 2);

  const clampTranslate = (t: { x: number; y: number }, maxX: number, maxY: number) => ({
    x: Math.min(maxX, Math.max(-maxX, t.x)),
    y: Math.min(maxY, Math.max(-maxY, t.y)),
  });

  const onPanEvent = useCallback(
    (e: { nativeEvent: { translationX: number; translationY: number } }) => {
      const next = clampTranslate(
        { x: panStartRef.current.x + e.nativeEvent.translationX, y: panStartRef.current.y + e.nativeEvent.translationY },
        maxTranslateX,
        maxTranslateY
      );
      translateRef.current = next;
      setTranslate(next);
    },
    [maxTranslateX, maxTranslateY]
  );

  const onPanStateChange = useCallback((e: { nativeEvent: { state: number } }) => {
    if (e.nativeEvent.state === State.BEGAN) {
      panStartRef.current = translateRef.current;
    } else if (e.nativeEvent.state === State.END || e.nativeEvent.state === State.CANCELLED) {
      panStartRef.current = translateRef.current;
    }
  }, []);

  const onPinchEvent = useCallback(
    (e: { nativeEvent: { scale: number } }) => {
      const nextZoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, pinchStartZoomRef.current * e.nativeEvent.scale));
      zoomRef.current = nextZoom;
      setZoom(nextZoom);
      const nextCoverScale = coverScale;
      const nextTotal = nextCoverScale * nextZoom;
      const dW = (natural?.w ?? frameWidth) * nextTotal;
      const dH = (natural?.h ?? frameHeight) * nextTotal;
      const clamped = clampTranslate(translateRef.current, Math.max(0, (dW - frameWidth) / 2), Math.max(0, (dH - frameHeight) / 2));
      translateRef.current = clamped;
      setTranslate(clamped);
    },
    [coverScale, natural, frameWidth, frameHeight]
  );

  const onPinchStateChange = useCallback((e: { nativeEvent: { state: number } }) => {
    if (e.nativeEvent.state === State.BEGAN) {
      pinchStartZoomRef.current = zoomRef.current;
    } else if (e.nativeEvent.state === State.END || e.nativeEvent.state === State.CANCELLED) {
      pinchStartZoomRef.current = zoomRef.current;
    }
  }, []);

  const stepZoom = (delta: number) => {
    const nextZoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoomRef.current + delta));
    zoomRef.current = nextZoom;
    pinchStartZoomRef.current = nextZoom;
    setZoom(nextZoom);
    const nextTotal = coverScale * nextZoom;
    const dW = (natural?.w ?? frameWidth) * nextTotal;
    const dH = (natural?.h ?? frameHeight) * nextTotal;
    const clamped = clampTranslate(translateRef.current, Math.max(0, (dW - frameWidth) / 2), Math.max(0, (dH - frameHeight) / 2));
    translateRef.current = clamped;
    panStartRef.current = clamped;
    setTranslate(clamped);
  };

  const confirm = async () => {
    if (!natural || busy || !uri) return;
    setBusy(true);
    try {
      const dx = (displayedW - frameWidth) / 2 - translate.x;
      const dy = (displayedH - frameHeight) / 2 - translate.y;
      const cropOriginX = Math.max(0, Math.min(natural.w - 1, Math.round(dx / totalScale)));
      const cropOriginY = Math.max(0, Math.min(natural.h - 1, Math.round(dy / totalScale)));
      const cropWidth = Math.max(1, Math.min(natural.w - cropOriginX, Math.round(frameWidth / totalScale)));
      const cropHeight = Math.max(1, Math.min(natural.h - cropOriginY, Math.round(frameHeight / totalScale)));
      const result = await ImageManipulator.manipulateAsync(
        uri,
        [{ crop: { originX: cropOriginX, originY: cropOriginY, width: cropWidth, height: cropHeight } }],
        { compress: 0.85, format: ImageManipulator.SaveFormat.JPEG }
      );
      onDone(result.uri);
    } finally {
      setBusy(false);
    }
  };

  return (
    <ImageCropperModal visible={!!uri} onRequestClose={onCancel}>
      <View style={styles.backdrop}>
        <View style={styles.headerRow}>
          <Pressable onPress={onCancel} hitSlop={10} style={styles.iconBtn}>
            <X size={20} color="#fff" />
          </Pressable>
          <Text style={styles.title}>Move and scale</Text>
          <Pressable onPress={confirm} hitSlop={10} disabled={busy || !natural} style={styles.iconBtn}>
            <Check size={20} color={busy ? 'rgba(255,255,255,.4)' : '#fff'} />
          </Pressable>
        </View>

        <View style={[styles.frame, { width: frameWidth, height: frameHeight }]}>
          <PinchGestureHandler onGestureEvent={onPinchEvent} onHandlerStateChange={onPinchStateChange}>
            <View style={StyleSheet.absoluteFill}>
              <PanGestureHandler onGestureEvent={onPanEvent} onHandlerStateChange={onPanStateChange}>
                <View style={StyleSheet.absoluteFill}>
                  {!!natural && (
                    <Image
                      source={{ uri: uri ?? '' }}
                      style={{
                        position: 'absolute',
                        left: (frameWidth - displayedW) / 2 + translate.x,
                        top: (frameHeight - displayedH) / 2 + translate.y,
                        width: displayedW,
                        height: displayedH,
                      }}
                    />
                  )}
                </View>
              </PanGestureHandler>
            </View>
          </PinchGestureHandler>
        </View>

        <Text style={styles.hint}>Drag to reposition · pinch or use the buttons to zoom</Text>

        <View style={styles.zoomRow}>
          <Pressable onPress={() => stepZoom(-ZOOM_STEP)} style={styles.zoomBtn} hitSlop={8}>
            <Minus size={18} color={theme.colors.ink} />
          </Pressable>
          <View style={styles.zoomTrack}>
            <View style={[styles.zoomFill, { width: `${((zoom - MIN_ZOOM) / (MAX_ZOOM - MIN_ZOOM)) * 100}%` }]} />
          </View>
          <Pressable onPress={() => stepZoom(ZOOM_STEP)} style={styles.zoomBtn} hitSlop={8}>
            <Plus size={18} color={theme.colors.ink} />
          </Pressable>
        </View>
      </View>
    </ImageCropperModal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(10,8,4,.94)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  headerRow: {
    position: 'absolute',
    top: 52,
    left: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: { color: '#fff', fontFamily: theme.font.bodyBold, fontSize: 15 },
  iconBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  frame: {
    overflow: 'hidden',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#fff',
    backgroundColor: '#000',
  },
  hint: { color: 'rgba(255,255,255,.7)', fontSize: 12.5, fontFamily: theme.font.bodySemibold, marginTop: 16, textAlign: 'center' },
  zoomRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 20, width: '100%', maxWidth: 320 },
  zoomBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  zoomTrack: { flex: 1, height: 4, borderRadius: 999, backgroundColor: 'rgba(255,255,255,.25)', overflow: 'hidden' },
  zoomFill: { height: '100%', backgroundColor: theme.colors.grass },
});
