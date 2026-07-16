import { Map, type MapRef, Marker } from '@vis.gl/react-maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import { LocateFixed } from 'lucide-react-native';
import React, { useMemo, useRef } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useAppState } from '../state/AppStateContext';
import { theme } from '../theme';
import { computeHouseBounds, MAP_STYLE_URL } from './mapBounds';

export type HoodMapProps = {
  highlightHouse: string | null;
  onHousePress: (id: string) => void;
};

const pinStyle = (background: string, scale: number): React.CSSProperties => ({
  minWidth: 38,
  height: 22,
  borderRadius: 8,
  border: `2px solid ${theme.colors.ink}`,
  backgroundColor: background,
  transform: `scale(${scale})`,
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  paddingLeft: 5,
  paddingRight: 5,
  fontSize: 10.5,
  fontFamily: theme.font.bodyBold,
  color: theme.colors.ink,
  whiteSpace: 'nowrap',
});

/** Same MapLibre engine and OpenFreeMap style as the native map (HoodMap.tsx), just rendered through
 * the web (react-dom) MapLibre bindings instead of the native ones — same look, same behavior. */
export function HoodMap({ highlightHouse, onHousePress }: HoodMapProps) {
  const { houses } = useAppState();
  const mapRef = useRef<MapRef>(null);

  const bounds = useMemo(() => computeHouseBounds(houses), [houses]);

  if (!bounds) {
    return <View style={styles.empty} />;
  }

  return (
    <View style={styles.container}>
      <Map
        ref={mapRef}
        mapStyle={MAP_STYLE_URL}
        initialViewState={{ bounds, fitBoundsOptions: { padding: 24 } }}
        style={{ width: '100%', height: '100%' }}
        attributionControl={{ compact: true }}
      >
        {houses.map((h) => {
          const isHi = h.id === highlightHouse;
          const background = isHi ? theme.colors.marigold : h.you ? theme.colors.grass : theme.colors.card;
          return (
            <Marker key={h.id} longitude={h.longitude} latitude={h.latitude} onClick={() => onHousePress(h.id)}>
              <div style={pinStyle(background, isHi ? 1.15 : 1)}>{h.id}</div>
            </Marker>
          );
        })}
      </Map>
      <Pressable onPress={() => mapRef.current?.fitBounds(bounds, { padding: 24, duration: 400 })} style={styles.recenterBtn} hitSlop={6}>
        <LocateFixed size={18} color={theme.colors.ink} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width: '100%', aspectRatio: 100 / 130 },
  empty: { width: '100%', aspectRatio: 100 / 130, backgroundColor: '#EFE9DB' },
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
