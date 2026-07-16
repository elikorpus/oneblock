import { Map, Marker } from '@vis.gl/react-maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
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

  const bounds = useMemo(() => computeHouseBounds(houses), [houses]);

  if (!bounds) {
    return <View style={styles.empty} />;
  }

  return (
    <View style={styles.map}>
      <Map
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
    </View>
  );
}

const styles = StyleSheet.create({
  map: { width: '100%', aspectRatio: 100 / 130 },
  empty: { width: '100%', aspectRatio: 100 / 130, backgroundColor: '#EFE9DB' },
});
