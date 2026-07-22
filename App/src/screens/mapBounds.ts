import { House } from '../data/types';

/** Free, no-API-key vector tile style — https://openfreemap.org (attribution required, shown via the map's attribution control). */
export const MAP_STYLE_URL = 'https://tiles.openfreemap.org/styles/liberty';

export type LngLatBoundsFlat = [west: number, south: number, east: number, north: number];

/** Bounding box around every house, padded so pins near the edge aren't clipped. Shared by the native and web map so both frame the same view. */
export function computeHouseBounds(houses: House[]): LngLatBoundsFlat | null {
  if (houses.length === 0) return null;
  const lats = houses.map((h) => h.latitude);
  const lngs = houses.map((h) => h.longitude);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
  const latPad = Math.max((maxLat - minLat) * 0.35, 0.0015);
  const lngPad = Math.max((maxLng - minLng) * 0.35, 0.0015);
  return [minLng - lngPad, minLat - latPad, maxLng + lngPad, maxLat + latPad];
}
