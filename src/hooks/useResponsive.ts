import { useState, useEffect } from 'react';
import { Dimensions, ScaledSize } from 'react-native';

interface ResponsiveValues {
  width: number;
  height: number;
  isSmallDevice: boolean;
  isMediumDevice: boolean;
  isLargeDevice: boolean;
  isTablet: boolean;
  scale: (size: number) => number;
  verticalScale: (size: number) => number;
  moderateScale: (size: number, factor?: number) => number;
  horizontalScale: (size: number) => number;
  fontSize: {
    xs: number;
    sm: number;
    base: number;
    lg: number;
    xl: number;
    '2xl': number;
    '3xl': number;
    '4xl': number;
  };
  spacing: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
    '2xl': number;
    '3xl': number;
  };
  borderRadius: {
    sm: number;
    md: number;
    lg: number;
    xl: number;
    '2xl': number;
    '3xl': number;
  };
}

// Breakpoints basados en ancho de pantalla
const BREAKPOINTS = {
  small: 375,   // iPhone SE, iPhone 6/7/8
  medium: 414,  // iPhone 6/7/8 Plus, iPhone X/XS
  large: 768,   // iPad Mini
  tablet: 1024, // iPad Pro
};

// Dimensiones base (iPhone 11 Pro - 375x812)
const BASE_WIDTH = 375;
const BASE_HEIGHT = 812;

export function useResponsive(): ResponsiveValues {
  const [dimensions, setDimensions] = useState<ScaledSize>(
    Dimensions.get('window')
  );

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setDimensions(window);
    });

    return () => subscription?.remove();
  }, []);

  const { width, height } = dimensions;

  // Determinar tipo de dispositivo
  const isSmallDevice = width < BREAKPOINTS.small;
  const isMediumDevice = width >= BREAKPOINTS.small && width < BREAKPOINTS.medium;
  const isLargeDevice = width >= BREAKPOINTS.medium && width < BREAKPOINTS.large;
  const isTablet = width >= BREAKPOINTS.large;

  // Función de escala horizontal
  const horizontalScale = (size: number): number => {
    return (width / BASE_WIDTH) * size;
  };

  // Función de escala vertical
  const verticalScale = (size: number): number => {
    return (height / BASE_HEIGHT) * size;
  };

  // Función de escala moderada (mejor para fuentes)
  const moderateScale = (size: number, factor: number = 0.5): number => {
    return size + (horizontalScale(size) - size) * factor;
  };

  // Función de escala general
  const scale = (size: number): number => {
    return horizontalScale(size);
  };

  // Tamaños de fuente responsive
  const fontSize = {
    xs: moderateScale(10),
    sm: moderateScale(12),
    base: moderateScale(14),
    lg: moderateScale(16),
    xl: moderateScale(18),
    '2xl': moderateScale(20),
    '3xl': moderateScale(24),
    '4xl': moderateScale(30),
  };

  // Espaciado responsive
  const spacing = {
    xs: scale(4),
    sm: scale(8),
    md: scale(16),
    lg: scale(24),
    xl: scale(32),
    '2xl': scale(48),
    '3xl': scale(64),
  };

  // Border radius responsive
  const borderRadius = {
    sm: scale(4),
    md: scale(8),
    lg: scale(12),
    xl: scale(16),
    '2xl': scale(20),
    '3xl': scale(24),
  };

  return {
    width,
    height,
    isSmallDevice,
    isMediumDevice,
    isLargeDevice,
    isTablet,
    scale,
    verticalScale,
    moderateScale,
    horizontalScale,
    fontSize,
    spacing,
    borderRadius,
  };
}

