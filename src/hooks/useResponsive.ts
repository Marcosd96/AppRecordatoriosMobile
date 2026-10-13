import { useWindowDimensions } from 'react-native';

/**
 * Clase de tamaño de ventana de Material 3, según el ancho en dp.
 * Decide el layout (una columna, ancho máximo, dos columnas); no el tamaño del texto.
 */
export type WindowClass = 'compact' | 'medium' | 'expanded';

export const WINDOW_BREAKPOINTS = {
  medium: 600,
  expanded: 840,
} as const;

export function getWindowClass(width: number): WindowClass {
  if (width >= WINDOW_BREAKPOINTS.expanded) {
    return 'expanded';
  }
  if (width >= WINDOW_BREAKPOINTS.medium) {
    return 'medium';
  }
  return 'compact';
}

/**
 * Tamaños fijos en sp: el sistema ya los escala con la preferencia de fuente del usuario.
 * Antes crecían con el ancho de la pantalla y en tablet o en horizontal el texto se inflaba.
 * Los valores son los que tenían en un teléfono de 375 dp, para no cambiar el aspecto en móvil.
 */
export const fontSize = {
  xs: 10,
  sm: 12,
  base: 14,
  lg: 16,
  xl: 18,
  '2xl': 20,
  '3xl': 24,
  '4xl': 30,
} as const;

/** Rejilla de 4 dp, fija: en pantallas grandes se gana espacio con layout, no con márgenes */
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  '2xl': 48,
  '3xl': 64,
} as const;

export const borderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  '2xl': 20,
  '3xl': 24,
} as const;

interface ResponsiveValues {
  width: number;
  height: number;
  windowClass: WindowClass;
  /** Ventana mediana o expandida (≥ 600 dp): tablet, plegable abierto o teléfono en horizontal */
  isTablet: boolean;
  fontSize: typeof fontSize;
  spacing: typeof spacing;
  borderRadius: typeof borderRadius;
}

export function useResponsive(): ResponsiveValues {
  const { width, height } = useWindowDimensions();
  const windowClass = getWindowClass(width);

  return {
    width,
    height,
    windowClass,
    isTablet: windowClass !== 'compact',
    fontSize,
    spacing,
    borderRadius,
  };
}
