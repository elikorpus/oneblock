import { Camera, Map, Marker } from '@maplibre/maplibre-react-native';
import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useAppState } from '../state/AppStateContext';
import { theme } from '../theme';
import { computeHouseBounds, MAP_STYLE_URL } from './mapBounds';

export type HoodMapProps = {
  highlightHouse: string | null;
  onHousePress: (id: string) => void;
};

/** Real map (MapLibre, free OpenFreeMap tiles) showing every claimed/unclaimed house in the resident's community. */
export function HoodMap({ highlightHouse, onHousePress }: HoodMapProps) {
  const { houses } = useAppState();

  const bounds = useMemo(() => computeHouseBounds(houses), [houses]);

  if (!bounds) {
    return <View style={styles.empty} />;
  }

  return (
    <Map style={styles.map} mapStyle={MAP_STYLE_URL} compass={false}>
      <Camera initialViewState={{ bounds, padding: { top: 24, bottom: 24, left: 24, right: 24 } }} />
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
  );
}

const styles = StyleSheet.create({
  map: { width: '100%', aspectRatio: 100 / 130 },
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
});
