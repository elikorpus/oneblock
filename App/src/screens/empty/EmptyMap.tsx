import React from 'react';
import Svg, { Circle, Path } from 'react-native-svg';

export function EmptyMap() {
  return (
    <Svg viewBox="0 0 100 70" width="100%" style={{ aspectRatio: 100 / 70, backgroundColor: '#EFE9DB', borderRadius: 14, opacity: 0.55 }}>
      <Path d="M2,40 Q30,32 55,34 T98,30" fill="none" stroke="#fff" strokeWidth={3.4} strokeLinecap="round" strokeDasharray="4 3" />
      <Path d="M41,36 L41,64" stroke="#fff" strokeWidth={2.8} strokeLinecap="round" strokeDasharray="4 3" />
      <Path d="M41,50 L92,50" stroke="#fff" strokeWidth={2.8} strokeLinecap="round" strokeDasharray="4 3" />
      {[
        [20, 20],
        [70, 16],
        [86, 40],
        [14, 56],
        [64, 60],
      ].map(([x, y], i) => (
        <Circle key={i} cx={x} cy={y} r={1.4} fill="#C4D6B8" />
      ))}
    </Svg>
  );
}
