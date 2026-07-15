import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import MapView, { Marker, Region } from 'react-native-maps';
import { useAppState } from '../state/AppStateContext';
import { theme } from '../theme';

export type HoodMapProps = {
  highlightHouse: string | null;
  onHousePress: (id: string) => void;
};

/** Real map (react-native-maps) showing every claimed/unclaimed house in the resident's community. */
export function HoodMap({ highlightHouse, onHousePress }: HoodMapProps) {
  const { houses } = useAppState();

  const region: Region | null = useMemo(() => {
    if (houses.length === 0) return null;
    const lats = houses.map((h) => h.latitude);
    const lngs = houses.map((h) => h.longitude);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);
    const latSpan = Math.max(maxLat - minLat, 0.0015) * 1.8;
    const lngSpan = Math.max(maxLng - minLng, 0.0015) * 1.8;
    return {
      latitude: (minLat + maxLat) / 2,
      longitude: (minLng + maxLng) / 2,
      latitudeDelta: latSpan,
      longitudeDelta: lngSpan,
    };
  }, [houses]);

  if (!region) {
    return <View style={styles.empty} />;
  }

  return (
    <MapView style={styles.map} initialRegion={region} showsCompass={false} toolbarEnabled={false}>
      {houses.map((h) => {
        const isHi = h.id === highlightHouse;
        return (
          <Marker
            key={h.id}
            coordinate={{ latitude: h.latitude, longitude: h.longitude }}
            title={h.you ? `Your house · ${h.address}` : h.address}
            onPress={() => onHousePress(h.id)}
          >
            <View
              style={[
                styles.pin,
                {
                  backgroundColor: isHi ? theme.colors.marigold : h.you ? theme.colors.grass : theme.colors.card,
                  borderColor: theme.colors.ink,
                  transform: [{ scale: isHi ? 1.25 : 1 }],
                },
              ]}
            />
          </Marker>
        );
      })}
    </MapView>
  );
}

const styles = StyleSheet.create({
  map: { width: '100%', aspectRatio: 100 / 130 },
  empty: { width: '100%', aspectRatio: 100 / 130, backgroundColor: '#EFE9DB' },
  pin: {
    width: 18,
    height: 18,
    borderRadius: 6,
    borderWidth: 2,
  },
});
