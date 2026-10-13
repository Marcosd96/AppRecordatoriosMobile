import React from 'react';
import { View, Text } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { AppLogo } from '../components/icons/BrandIcons';

/**
 * Continuación del splash nativo (mismo fondo) mientras se restaura la sesión. No tiene
 * duración propia: desaparece en cuanto la app sabe qué pantalla mostrar.
 */
export default function SplashScreen() {
  const { isDark } = useTheme();

  return (
    <View
      className={`flex-1 items-center justify-center ${isDark ? 'bg-gray-900' : 'bg-white'}`}
      accessibilityLabel="Gesaccol, cargando"
      accessibilityLiveRegion="polite"
    >
      <AppLogo size={96} />
      <Text className={`mt-6 text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
        Gesaccol
      </Text>
    </View>
  );
}
