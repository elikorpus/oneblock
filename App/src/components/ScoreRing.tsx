import React from 'react';
import Svg, { Circle, Text as SvgText } from 'react-native-svg';
import { theme } from '../theme';

export type ScoreRingProps = {
  score?: number;
  size?: number;
  color?: string;
};

/** Circular progress ring showing a 0-100 neighborhood score. */
export function ScoreRing({ score = 87, size = 64, color = theme.colors.grass }: ScoreRingProps) {
  const r = (size - 10) / 2;
  const c = 2 * Math.PI * r;
  const mid = size / 2;
  return (
    <Svg width={size} height={size}>
      <Circle cx={mid} cy={mid} r={r} fill="none" stroke={theme.colors.line} strokeWidth={7} />
      <Circle
        cx={mid}
        cy={mid}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth={7}
        strokeLinecap="round"
        strokeDasharray={`${(score / 100) * c} ${c}`}
        rotation={-90}
        origin={`${mid}, ${mid}`}
      />
      <SvgText
        x={mid}
        y={mid + size * 0.11}
        textAnchor="middle"
        fontSize={size * 0.3}
        fontWeight="700"
        fill={theme.colors.ink}
        fontFamily={theme.font.displaySemibold}
      >
        {score}
      </SvgText>
    </Svg>
  );
}
