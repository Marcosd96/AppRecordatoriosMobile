import React from 'react';
import { Text, View } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useThemeColors } from '../theme/colors';
import Button from './Button';
import { AlertIcon } from './icons/ActionIcons';

interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry: () => void;
  /** Reintento en curso */
  retrying?: boolean;
}

/**
 * Error de carga sin datos guardados que mostrar: explica qué pasó y permite reintentar
 * desde la misma pantalla, sin un diálogo que solo se puede cerrar.
 */
export default function ErrorState({
  title = 'No se pudieron cargar los datos',
  message,
  onRetry,
  retrying = false,
}: ErrorStateProps) {
  const { isDark } = useTheme();
  const colors = useThemeColors();

  return (
    <View
      className={`rounded-2xl p-8 border items-center ${
        isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
      }`}
      accessibilityLiveRegion="polite"
    >
      <View
        className={`h-14 w-14 rounded-2xl items-center justify-center mb-4 ${
          isDark ? 'bg-red-500/15' : 'bg-red-50'
        }`}
      >
        <AlertIcon color={colors.error} size={28} />
      </View>
      <Text
        accessibilityRole="header"
        className={`text-base font-semibold text-center ${isDark ? 'text-white' : 'text-gray-900'}`}
      >
        {title}
      </Text>
      <Text className={`text-sm text-center mt-1.5 mb-5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
        {message}
      </Text>
      <Button label="Reintentar" onPress={onRetry} busy={retrying} size="large" />
    </View>
  );
}
