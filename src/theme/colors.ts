import { useTheme } from '../context/ThemeContext';

/**
 * Colores por rol (DESIGN_SYSTEM §2.1) para las props que no aceptan clases de NativeWind:
 * iconos SVG, ActivityIndicator, placeholderTextColor, android_ripple…
 * Para fondos y textos se usan las clases equivalentes de la tabla.
 */
export interface ThemeColors {
  primary: string;
  onPrimary: string;
  onPrimaryContainer: string;
  secondary: string;
  onSurface: string;
  onSurfaceVariant: string;
  outline: string;
  placeholder: string;
  error: string;
  onError: string;
  /** Capa de pulsación del ripple sobre superficies */
  ripple: string;
  /** Capa de pulsación del ripple sobre botones rellenos */
  rippleOnFilled: string;
}

export const lightColors: ThemeColors = {
  primary: '#2563eb', // blue-600
  onPrimary: '#ffffff',
  onPrimaryContainer: '#1d4ed8', // blue-700
  secondary: '#374151', // gray-700
  onSurface: '#111827', // gray-900
  onSurfaceVariant: '#6b7280', // gray-500
  outline: '#e5e7eb', // gray-200
  placeholder: '#9ca3af', // gray-400
  error: '#dc2626', // red-600
  onError: '#ffffff',
  ripple: 'rgba(17, 24, 39, 0.12)',
  rippleOnFilled: 'rgba(255, 255, 255, 0.24)',
};

export const darkColors: ThemeColors = {
  primary: '#60a5fa', // blue-400
  onPrimary: '#ffffff', // sobre el botón relleno, que sigue siendo blue-600
  onPrimaryContainer: '#93c5fd', // blue-300
  secondary: '#e5e7eb', // gray-200
  onSurface: '#ffffff',
  onSurfaceVariant: '#9ca3af', // gray-400
  outline: '#374151', // gray-700
  placeholder: '#6b7280', // gray-500
  error: '#fca5a5', // red-300
  onError: '#ffffff',
  ripple: 'rgba(255, 255, 255, 0.12)',
  rippleOnFilled: 'rgba(255, 255, 255, 0.24)',
};

export function useThemeColors(): ThemeColors {
  const { isDark } = useTheme();
  return isDark ? darkColors : lightColors;
}
