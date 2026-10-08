import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useResponsive } from '../hooks/useResponsive';

interface SectionCardProps {
  isDark: boolean;
  title: string;
  /** Enlace opcional a la derecha del título (p. ej. "Ver todos") */
  actionLabel?: string;
  onAction?: () => void;
  children: React.ReactNode;
}

/** Tarjeta de sección con título: mismo aspecto en todas las tarjetas de Inicio */
export default function SectionCard({
  isDark,
  title,
  actionLabel,
  onAction,
  children,
}: SectionCardProps) {
  const responsive = useResponsive();

  return (
    <View style={{ paddingHorizontal: responsive.spacing.lg, paddingTop: responsive.spacing.md }}>
      <View
        className={`rounded-2xl border ${
          isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        }`}
        style={{ padding: responsive.spacing.md }}
      >
        <View
          className="flex-row items-center justify-between"
          style={{ marginBottom: responsive.spacing.md }}
        >
          <Text
            accessibilityRole="header"
            className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}
            style={{ fontSize: responsive.fontSize.lg }}
          >
            {title}
          </Text>
          {actionLabel && onAction ? (
            <TouchableOpacity
              onPress={onAction}
              accessibilityRole="button"
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text
                className={`font-semibold ${isDark ? 'text-blue-400' : 'text-blue-600'}`}
                style={{ fontSize: responsive.fontSize.sm }}
              >
                {actionLabel}
              </Text>
            </TouchableOpacity>
          ) : null}
        </View>
        {children}
      </View>
    </View>
  );
}
