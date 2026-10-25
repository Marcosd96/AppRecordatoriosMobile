import React from 'react';
import { Text, View } from 'react-native';
import { useTheme } from '../context/ThemeContext';

interface ListGroupProps {
  /** Título de la sección sobre el grupo (opcional) */
  title?: string;
  /** Recuento junto al título */
  count?: number;
  children: React.ReactNode;
}

/**
 * Grupo de filas (`ListRow`) en un contenedor con borde, con divisores entre filas en lugar
 * de una tarjeta por elemento (COMPONENT_GUIDELINES §4). Inicio, Búsqueda, Historial.
 */
export default function ListGroup({ title, count, children }: ListGroupProps) {
  const { isDark } = useTheme();
  return (
    <View>
      {title ? (
        <Text
          accessibilityRole="header"
          className={`text-sm font-semibold mb-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}
        >
          {title}
          {count !== undefined ? ` · ${count}` : ''}
        </Text>
      ) : null}
      <View
        className={`rounded-2xl border overflow-hidden ${
          isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        }`}
      >
        {children}
      </View>
    </View>
  );
}
