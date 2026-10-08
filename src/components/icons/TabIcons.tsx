/**
 * Iconos de la barra de pestañas. Son vectoriales y toman el color de la pestaña
 * (activa o inactiva), a diferencia de los emojis, que se ven distintos en cada
 * dispositivo e ignoran el color.
 */
import React from 'react';
import Svg, { Path, Rect } from 'react-native-svg';

interface IconProps {
  color: string;
  size: number;
}

const strokeProps = (color: string) => ({
  stroke: color,
  strokeWidth: 2,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  fill: 'none',
});

export function HomeIcon({ color, size }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M3 10.5 12 3l9 7.5" {...strokeProps(color)} />
      <Path d="M5 9.5V21h14V9.5" {...strokeProps(color)} />
      <Path d="M10 21v-6h4v6" {...strokeProps(color)} />
    </Svg>
  );
}

export function TasksIcon({ color, size }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Rect x={3} y={3} width={18} height={18} rx={3} {...strokeProps(color)} />
      <Path d="m8 12 3 3 5-6" {...strokeProps(color)} />
    </Svg>
  );
}

export function CalendarIcon({ color, size }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Rect x={3} y={5} width={18} height={16} rx={2} {...strokeProps(color)} />
      <Path d="M3 10h18M8 3v4M16 3v4" {...strokeProps(color)} />
      <Path d="M8 14h.01M12 14h.01M16 14h.01M8 17.5h.01M12 17.5h.01" {...strokeProps(color)} />
    </Svg>
  );
}

export function CompaniesIcon({ color, size }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M4 21V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16" {...strokeProps(color)} />
      <Path d="M16 9h2a2 2 0 0 1 2 2v10M2 21h20" {...strokeProps(color)} />
      <Path d="M8 7h4M8 11h4M8 15h4" {...strokeProps(color)} />
    </Svg>
  );
}

// Funciones de render fuera del componente de navegación: así no se crea un componente
// nuevo en cada render (react/no-unstable-nested-components)
type TabIconRenderProps = { color: string; size: number };
export const renderHomeTabIcon = ({ color, size }: TabIconRenderProps) => (
  <HomeIcon color={color} size={size} />
);
export const renderTasksTabIcon = ({ color, size }: TabIconRenderProps) => (
  <TasksIcon color={color} size={size} />
);
export const renderCalendarTabIcon = ({ color, size }: TabIconRenderProps) => (
  <CalendarIcon color={color} size={size} />
);
export const renderCompaniesTabIcon = ({ color, size }: TabIconRenderProps) => (
  <CompaniesIcon color={color} size={size} />
);
