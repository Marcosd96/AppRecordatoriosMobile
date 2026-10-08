import React from 'react';
import { View, Text } from 'react-native';
import AnimatedButton from '../AnimatedButton';
import { ReminderFilter } from '../../types';
import { useResponsive } from '../../hooks/useResponsive';

interface DashboardStatsCardProps {
  isDark: boolean;
  stats: { total: number; pending: number; overdue: number; upcoming: number };
  onSelectFilter: (filter: ReminderFilter) => void;
}

export default function DashboardStatsCard({ isDark, stats, onSelectFilter }: DashboardStatsCardProps) {
  const responsive = useResponsive();

  return (
    <View style={{ paddingHorizontal: responsive.spacing.lg, paddingVertical: responsive.spacing.md }}>
      <View
        className={`rounded-3xl border ${
          isDark
            ? 'bg-gray-800 border-gray-700'
            : 'bg-white border-gray-200'
        }`}
        style={{ padding: responsive.spacing.lg }}
      >
        <View className="flex-row items-center justify-between" style={{ marginBottom: responsive.spacing.lg }}>
          <View className="flex-row items-center">
            <Text style={{ fontSize: responsive.fontSize['2xl'], marginRight: responsive.spacing.sm }}>📊</Text>
            <Text
              className={`font-bold ${
                isDark ? 'text-white' : 'text-gray-900'
              }`}
              style={{ fontSize: responsive.fontSize.xl }}
            >
              Resumen General
            </Text>
          </View>
          <View
            className={`px-3 py-1 rounded-full ${
              stats.pending > 0 || stats.overdue > 0
                ? isDark
                  ? 'bg-orange-500/20'
                  : 'bg-orange-100'
                : isDark
                ? 'bg-green-500/20'
                : 'bg-green-100'
            }`}
          >
            <Text
              className={`text-xs font-semibold ${
                stats.pending > 0 || stats.overdue > 0
                  ? isDark
                    ? 'text-orange-300'
                    : 'text-orange-700'
                  : isDark
                  ? 'text-green-300'
                  : 'text-green-700'
              }`}
            >
              {stats.pending > 0 || stats.overdue > 0
                ? 'Acción requerida'
                : 'Todo en orden'}
            </Text>
          </View>
        </View>

        <View 
          className="flex-row flex-wrap"
          style={{
            marginTop: responsive.spacing.sm,
            marginHorizontal: -responsive.spacing.xs,
          }}
        >
          {[
            {
              label: 'Total',
              value: stats.total,
              icon: '📋',
              bg: isDark ? 'bg-blue-500/10' : 'bg-blue-50',
              text: isDark ? 'text-blue-200' : 'text-blue-700',
              border: isDark ? 'border-blue-500/20' : 'border-blue-200',
              filter: 'all',
            },
            {
              label: 'Pendientes',
              value: stats.pending,
              icon: '⏳',
              bg: isDark ? 'bg-yellow-500/10' : 'bg-yellow-50',
              text: isDark ? 'text-yellow-200' : 'text-yellow-700',
              border: isDark ? 'border-yellow-500/20' : 'border-yellow-200',
              filter: 'pending',
            },
            {
              label: 'Vencidos',
              value: stats.overdue,
              icon: '⚠️',
              bg: isDark ? 'bg-red-500/10' : 'bg-red-50',
              text: isDark ? 'text-red-200' : 'text-red-700',
              border: isDark ? 'border-red-500/20' : 'border-red-200',
              filter: 'overdue',
            },
            {
              label: 'Próximos 30 días',
              value: stats.upcoming,
              icon: '📅',
              bg: isDark ? 'bg-indigo-500/10' : 'bg-indigo-50',
              text: isDark ? 'text-indigo-200' : 'text-indigo-700',
              border: isDark ? 'border-indigo-500/20' : 'border-indigo-200',
              filter: 'upcoming',
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
                onPress={() => onSelectFilter(item.filter as ReminderFilter)}
              >
                <View
                  className={`rounded-2xl border ${item.bg} ${item.border}`}
                  style={{ padding: responsive.spacing.md }}
                >
                  <View className="flex-row items-center justify-between" style={{ marginBottom: responsive.spacing.sm }}>
                    <Text style={{ fontSize: responsive.fontSize.lg }}>{item.icon}</Text>
                    <Text
                      className={`font-medium ${
                        isDark ? 'text-gray-300' : 'text-gray-500'
                      }`}
                      style={{ fontSize: responsive.fontSize.xs }}
                    >
                      {item.label}
                    </Text>
                  </View>
                  <Text className={`font-bold ${item.text}`} style={{ fontSize: responsive.fontSize['3xl'] }}>
                    {item.value}
                  </Text>
                </View>
              </AnimatedButton>
            </View>
          ))}
        </View>

        <View
          className={`rounded-2xl border ${
            isDark
              ? 'border-blue-900/40 bg-blue-900/10'
              : 'border-blue-100 bg-blue-50'
          }`}
          style={{
            marginTop: responsive.spacing.md,
            paddingHorizontal: responsive.spacing.md,
            paddingVertical: responsive.spacing.md,
          }}
        >
          <Text
            className={`font-semibold ${
              isDark ? 'text-blue-100' : 'text-blue-700'
            }`}
            style={{
              fontSize: responsive.fontSize.sm,
              marginBottom: responsive.spacing.xs,
            }}
          >
            💡 Estado Actual
          </Text>
          <Text
            className={`${
              isDark ? 'text-gray-300' : 'text-gray-600'
            }`}
            style={{ fontSize: responsive.fontSize.sm }}
          >
            {stats.pending > 0
              ? `Tienes ${stats.pending} recordatorio${
                  stats.pending === 1 ? '' : 's'
                } pendiente${stats.pending === 1 ? '' : 's'} listo${
                  stats.pending === 1 ? '' : 's'
                } para gestionar.`
              : stats.overdue > 0
              ? `⚠️ Tienes ${stats.overdue} recordatorio${
                  stats.overdue === 1 ? '' : 's'
                } vencido${stats.overdue === 1 ? '' : 's'}. Revisa tus recordatorios.`
              : 'No hay recordatorios pendientes. ¡Perfecto momento para agregar nuevas empresas!'}
          </Text>
        </View>
      </View>
    </View>
  );
}
