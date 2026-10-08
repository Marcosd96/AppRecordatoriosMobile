/**
 * Logos dibujados con react-native-svg: se ven sin conexión y no dependen de
 * descargar imágenes (antes el logo de Google se pedía a google.com).
 */
import React from 'react';
import Svg, { Circle, G, Line, Path, Polyline, Rect, Text as SvgText } from 'react-native-svg';

/** Mismo dibujo que assets/icon.svg (icono de la app) */
export function AppLogo({ size = 88 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 1024 1024">
      <Rect width={1024} height={1024} fill="#1e40af" rx={192} />
      <G transform="translate(192, 192)">
        <Rect x={128} y={64} width={384} height={512} fill="#ffffff" rx={32} />
        <Line x1={224} y1={192} x2={416} y2={192} stroke="#1e40af" strokeWidth={32} strokeLinecap="round" />
        <Line x1={224} y1={288} x2={416} y2={288} stroke="#1e40af" strokeWidth={32} strokeLinecap="round" />
        <Line x1={224} y1={384} x2={352} y2={384} stroke="#1e40af" strokeWidth={32} strokeLinecap="round" />
        <Circle cx={320} cy={480} r={96} fill="#10b981" stroke="#ffffff" strokeWidth={24} />
        <SvgText x={320} y={520} fontSize={128} fontWeight="bold" fill="#ffffff" textAnchor="middle">
          $
        </SvgText>
      </G>
      <G transform="translate(640, 640)">
        <Polyline
          points="0,128 64,64 128,96 192,32"
          fill="none"
          stroke="#60a5fa"
          strokeWidth={32}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </G>
    </Svg>
  );
}

/** "G" de Google con sus colores oficiales */
export function GoogleIcon({ size = 20 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48">
      <Path
        fill="#FFC107"
        d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"
      />
      <Path
        fill="#FF3D00"
        d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"
      />
      <Path
        fill="#4CAF50"
        d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z"
      />
      <Path
        fill="#1976D2"
        d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"
      />
    </Svg>
  );
}
