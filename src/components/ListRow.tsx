import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useThemeColors } from '../theme/colors';
import { ChevronRightIcon } from './icons/ActionIcons';

interface ListRowProps {
  title: string;
  subtitle?: string;
  /** Sin `onPress` la fila es solo informativa */
  onPress?: () => void;
  /** Contenido a la derecha; por defecto, un chevron si la fila navega */
  trailing?: React.ReactNode;
  /** Acción que cierra sesión, borra…: título en rojo */
  destructive?: boolean;
  /** Divisor superior (todas las filas de un grupo salvo la primera) */
  divider?: boolean;
  accessibilityHint?: string;
}

/** Fila de lista M3: título, subtítulo opcional y contenido a la derecha. Mínimo 56 dp */
export default function ListRow({
  title,
  subtitle,
  onPress,
  trailing,
  destructive = false,
  divider = false,
  accessibilityHint,
}: ListRowProps) {
  const { isDark } = useTheme();
  const colors = useThemeColors();

  const content = (
    <View
      className={`flex-row items-center min-h-14 px-4 py-3 ${
        divider ? (isDark ? 'border-t border-gray-700' : 'border-t border-gray-100') : ''
      }`}
    >
      <View className="flex-1 pr-3">
        <Text
          className={`text-base ${
            destructive
              ? isDark ? 'text-red-300' : 'text-red-600'
              : isDark ? 'text-white' : 'text-gray-900'
          }`}
        >
          {title}
        </Text>
        {subtitle ? (
          <Text className={`text-sm mt-0.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {trailing ?? (onPress && !destructive ? <ChevronRightIcon color={colors.onSurfaceVariant} /> : null)}
    </View>
  );

  if (!onPress) {
    return <View accessible>{content}</View>;
  }

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityHint={accessibilityHint}
      android_ripple={{ color: colors.ripple }}
    >
      {content}
    </Pressable>
  );
}
