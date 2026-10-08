import React from 'react';
import { View, Text } from 'react-native';
import AnimatedButton from './AnimatedButton';

interface EmptyStateProps {
  isDark: boolean;
  /** Recibe el color del icono según el tema */
  renderIcon: (color: string) => React.ReactNode;
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}

/** Aviso de lista vacía con el mismo aspecto en todas las pantallas */
export default function EmptyState({
  isDark,
  renderIcon,
  title,
  message,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <View
      className={`rounded-2xl p-8 border items-center ${
        isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
      }`}
    >
      <View
        className={`h-14 w-14 rounded-2xl items-center justify-center mb-4 ${
          isDark ? 'bg-gray-700' : 'bg-gray-100'
        }`}
      >
        {renderIcon(isDark ? '#9ca3af' : '#6b7280')}
      </View>
      <Text
        className={`text-base font-semibold text-center ${isDark ? 'text-white' : 'text-gray-900'}`}
      >
        {title}
      </Text>
      <Text className={`text-sm text-center mt-1.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
        {message}
      </Text>
      {actionLabel && onAction ? (
        <AnimatedButton onPress={onAction}>
          <View className="mt-5 px-6 py-3 rounded-xl bg-blue-600">
            <Text className="text-white font-semibold text-center">{actionLabel}</Text>
          </View>
        </AnimatedButton>
      ) : null}
    </View>
  );
}
