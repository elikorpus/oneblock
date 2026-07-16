import { Camera, type CameraRef, Map, Marker } from '@maplibre/maplibre-react-native';
import { LocateFixed } from 'lucide-react-native';
import React, { useMemo, useRef } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useAppState } from '../state/AppStateContext';
import { theme } from '../theme';
import { computeHouseBounds, MAP_STYLE_URL } from './mapBounds';

export type HoodMapProps = {
  highlightHouse: string | null;
  onHousePress: (id: string) => void;
};

const CAMERA_PADDING = { top: 24, bottom: 24, left: 24, right: 24 };

/** Real map (MapLibre, free OpenFreeMap tiles) showing every claimed/unclaimed house in the resident's community. */
export function HoodMap({ highlightHouse, onHousePress }: HoodMapProps) {
  const { houses } = useAppState();
  const cameraRef = useRef<CameraRef>(null);

  const bounds = useMemo(() => computeHouseBounds(houses), [houses]);

  if (!bounds) {
    return <View style={styles.empty} />;
  }

  return (
    <View style={styles.container}>
      <Map style={styles.map} mapStyle={MAP_STYLE_URL} compass={false}>
        <Camera ref={cameraRef} initialViewState={{ bounds, padding: CAMERA_PADDING }} />
        {houses.map((h) => {
          const isHi = h.id === highlightHouse;
          const bg = isHi ? theme.colors.marigold : h.you ? theme.colors.grass : theme.colors.card;
          return (
            <Marker key={h.id} id={h.id} lngLat={[h.longitude, h.latitude]} onPress={() => onHousePress(h.id)}>
              <View style={[styles.pin, { backgroundColor: bg, transform: [{ scale: isHi ? 1.15 : 1 }] }]}>
                <Text style={styles.pinText}>{h.id}</Text>
              </View>
            </Marker>
          );
        })}
      </Map>
      <Pressable
        onPress={() => cameraRef.current?.fitBounds(bounds, { padding: CAMERA_PADDING, duration: 400 })}
        style={styles.recenterBtn}
        hitSlop={6}
      >
        <LocateFixed size={18} color={theme.colors.ink} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width: '100%', aspectRatio: 100 / 130 },
  map: { width: '100%', height: '100%' },
  empty: { width: '100%', aspectRatio: 100 / 130, backgroundColor: '#EFE9DB' },
  pin: {
    minWidth: 38,
    height: 22,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: theme.colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  pinText: {
    fontSize: 10.5,
    fontFamily: theme.font.bodyBold,
    color: theme.colors.ink,
  },
  recenterBtn: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: theme.colors.card,
    borderWidth: theme.border.width,
    borderColor: theme.colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.hardShadow('sm'),
  },
});
