import React from 'react';
import { View, Text } from 'react-native';
import { useResponsive } from '../hooks/useResponsive';

interface ScreenHeaderProps {
  isDark: boolean;
  title: string;
  subtitle?: string;
  /** Acción opcional a la derecha del título (p. ej. un botón) */
  right?: React.ReactNode;
}

/**
 * Encabezado común de las pantallas principales, para que todas tengan el mismo
 * tamaño de título, espaciado y separación del contenido.
 */
export default function ScreenHeader({ isDark, title, subtitle, right }: ScreenHeaderProps) {
  const responsive = useResponsive();

  return (
    <View
      className={`border-b ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}
      style={{
        paddingHorizontal: responsive.spacing.lg,
        paddingTop: responsive.spacing.md,
        paddingBottom: responsive.spacing.md,
      }}
    >
      <View className="flex-row items-center justify-between">
        <View className="flex-1">
          <Text
            accessibilityRole="header"
            className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}
            style={{ fontSize: responsive.fontSize['3xl'] }}
            numberOfLines={1}
          >
            {title}
          </Text>
          {subtitle ? (
            <Text
              className={isDark ? 'text-gray-400' : 'text-gray-500'}
              style={{ marginTop: responsive.spacing.xs, fontSize: responsive.fontSize.base }}
              numberOfLines={1}
            >
              {subtitle}
            </Text>
          ) : null}
        </View>
        {right ? <View style={{ marginLeft: responsive.spacing.md }}>{right}</View> : null}
      </View>
    </View>
  );
}
