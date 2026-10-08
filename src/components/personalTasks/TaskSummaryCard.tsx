import React from 'react';
import { View, Text } from 'react-native';
import AnimatedButton from '../AnimatedButton';
import { useResponsive } from '../../hooks/useResponsive';
import { StatusFilter } from './taskForm';

interface TaskSummaryCardProps {
  isDark: boolean;
  stats: {
    total: number;
    active: number;
    paused: number;
    completed: number;
  };
  onSelectStatus: (status: StatusFilter) => void;
}

export default function TaskSummaryCard({ isDark, stats, onSelectStatus }: TaskSummaryCardProps) {
  const responsive = useResponsive();

  return (
    <View
      className={`rounded-3xl border ${
        isDark
          ? 'bg-gray-800 border-gray-700'
          : 'bg-white border-gray-200'
      }`}
      style={{ padding: responsive.spacing.lg }}
    >
      <Text
        className={`font-semibold ${
          isDark ? 'text-blue-200' : 'text-blue-600'
        }`}
        style={{
          fontSize: responsive.fontSize.sm,
          marginBottom: responsive.spacing.md,
        }}
      >
        Resumen rápido
      </Text>
      <Text
        className={`font-bold ${
          isDark ? 'text-white' : 'text-gray-900'
        }`}
        style={{
          fontSize: responsive.fontSize['2xl'],
          marginTop: responsive.spacing.xs,
        }}
      >
        {stats.active
          ? 'Sigue completando tus tareas'
          : 'Todo en orden'}
      </Text>
      <View
        className="flex-row flex-wrap"
        style={{
          marginTop: responsive.spacing.md,
          marginHorizontal: -responsive.spacing.xs,
        }}
      >
        {[
          {
            label: 'Total',
            value: stats.total,
            bg: isDark ? 'bg-blue-500/10' : 'bg-blue-50',
            text: isDark ? 'text-blue-200' : 'text-blue-700',
            status: 'all',
          },
          {
            label: 'Activas',
            value: stats.active,
            bg: isDark ? 'bg-green-500/10' : 'bg-green-50',
            text: isDark ? 'text-green-200' : 'text-green-700',
            status: 'active',
          },
          {
            label: 'Pausadas',
            value: stats.paused,
            bg: isDark ? 'bg-yellow-500/10' : 'bg-yellow-50',
            text: isDark ? 'text-yellow-200' : 'text-yellow-700',
            status: 'paused',
          },
          {
            label: 'Completadas',
            value: stats.completed,
            bg: isDark ? 'bg-indigo-500/10' : 'bg-indigo-50',
            text: isDark ? 'text-indigo-200' : 'text-indigo-700',
            status: 'completed',
          },
        ].map(item => (
          <View
            key={item.label}
            style={{
              width: responsive.isTablet ? '25%' : responsive.isSmallDevice ? '100%' : '50%',
              paddingHorizontal: responsive.spacing.xs,
              marginBottom: responsive.spacing.md,
            }}
          >
            <AnimatedButton
              onPress={() => onSelectStatus(item.status as StatusFilter)}
            >
              <View className={`rounded-2xl ${item.bg}`} style={{ padding: responsive.spacing.md }}>
                <Text
                  className={`font-medium ${
                    isDark ? 'text-gray-300' : 'text-gray-500'
                  }`}
                  style={{
                    fontSize: responsive.fontSize.xs,
                    marginBottom: responsive.spacing.xs,
                  }}
                >
                  {item.label}
                </Text>
                <Text className={`font-bold ${item.text}`} style={{ fontSize: responsive.fontSize['2xl'] }}>
                  {item.value}
                </Text>
              </View>
            </AnimatedButton>
          </View>
        ))}
      </View>
      <View
        className={`mt-2 rounded-2xl px-4 py-3 border ${
          isDark
            ? 'border-blue-900/40 bg-blue-900/10'
            : 'border-blue-100 bg-blue-50'
        }`}
      >
        <Text
          className={`text-sm font-semibold ${
            isDark ? 'text-blue-100' : 'text-blue-700'
          }`}
        >
          Productividad
        </Text>
        <Text
          className={isDark ? 'text-gray-300 mt-1' : 'text-gray-600 mt-1'}
        >
          {stats.active > 0
            ? `Tienes ${stats.active} tarea${
                stats.active === 1 ? '' : 's'
              } activas listas para avanzar.`
            : 'No hay tareas activas. ¡Perfecto momento para crear nuevas ideas!'}
        </Text>
      </View>
    </View>
  );
}
