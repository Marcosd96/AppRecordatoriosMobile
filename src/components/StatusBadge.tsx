import React from 'react';
import { Text, View } from 'react-native';
import { useTheme } from '../context/ThemeContext';

/**
 * Tonos por rol (DESIGN_SYSTEM §2): `error` vencido/cancelado, `warning` urgente/pausado,
 * `success` completado/activo, `primary` información, `neutral` sin énfasis,
 * `category` categorías que no son estado (impuestos distintos de IVA).
 */
export type BadgeTone = 'error' | 'warning' | 'success' | 'primary' | 'neutral' | 'category';

const toneClasses: Record<BadgeTone, { light: [string, string]; dark: [string, string] }> = {
  error: { light: ['bg-red-100', 'text-red-800'], dark: ['bg-red-500/15', 'text-red-300'] },
  warning: { light: ['bg-amber-100', 'text-amber-800'], dark: ['bg-amber-500/15', 'text-amber-300'] },
  success: { light: ['bg-green-100', 'text-green-800'], dark: ['bg-green-500/15', 'text-green-300'] },
  primary: { light: ['bg-blue-100', 'text-blue-800'], dark: ['bg-blue-500/15', 'text-blue-300'] },
  neutral: { light: ['bg-gray-100', 'text-gray-700'], dark: ['bg-gray-700', 'text-gray-200'] },
  category: { light: ['bg-purple-100', 'text-purple-800'], dark: ['bg-purple-500/15', 'text-purple-300'] },
};

/** Insignia de estado o categoría con el mismo aspecto en todas las listas */
export default function StatusBadge({ label, tone }: { label: string; tone: BadgeTone }) {
  const { isDark } = useTheme();
  const [background, text] = toneClasses[tone][isDark ? 'dark' : 'light'];

  return (
    <View className={`px-2 py-0.5 rounded-full ${background}`}>
      <Text className={`text-xs font-semibold ${text}`}>{label}</Text>
    </View>
  );
}
