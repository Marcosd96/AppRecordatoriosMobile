import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import AnimatedButton from '../AnimatedButton';
import SectionCard from '../SectionCard';
import { ReminderFilter } from '../../types';
import { useResponsive } from '../../hooks/useResponsive';

interface DashboardStatsCardProps {
  isDark: boolean;
  stats: { total: number; pending: number; overdue: number; upcoming: number };
  onSelectFilter: (filter: ReminderFilter) => void;
}

const plural = (count: number, singular: string, pluralForm: string) =>
  `${count} ${count === 1 ? singular : pluralForm}`;

export default function DashboardStatsCard({ isDark, stats, onSelectFilter }: DashboardStatsCardProps) {
  const responsive = useResponsive();

  // Lo vencido es lo más urgente: se menciona primero
  const statusMessage =
    stats.overdue > 0
      ? `Tienes ${plural(stats.overdue, 'recordatorio vencido', 'recordatorios vencidos')}. Revísalos cuanto antes.`
      : stats.pending > 0
      ? `Tienes ${plural(stats.pending, 'recordatorio pendiente', 'recordatorios pendientes')} por gestionar.`
      : 'Todo al día. Buen momento para agregar nuevas empresas.';

  const items: {
    label: string;
    value: number;
    dot: string;
    text: string;
    filter: ReminderFilter;
  }[] = [
    {
      label: 'Vencidos',
      value: stats.overdue,
      dot: 'bg-red-500',
      text: stats.overdue > 0 ? (isDark ? 'text-red-300' : 'text-red-600') : isDark ? 'text-white' : 'text-gray-900',
      filter: 'overdue',
    },
    {
      label: 'Pendientes',
      value: stats.pending,
      dot: 'bg-amber-500',
      text: isDark ? 'text-white' : 'text-gray-900',
      filter: 'pending',
    },
    {
      label: 'Próximos 30 días',
      value: stats.upcoming,
      dot: 'bg-indigo-500',
      text: isDark ? 'text-white' : 'text-gray-900',
      filter: 'upcoming',
    },
    {
      label: 'Total',
      value: stats.total,
      dot: 'bg-blue-500',
      text: isDark ? 'text-white' : 'text-gray-900',
      filter: 'all',
    },
  ];

  return (
    <SectionCard isDark={isDark} title="Resumen">
      <View
        className="flex-row flex-wrap"
        style={{ marginHorizontal: -responsive.spacing.xs }}
      >
        {items.map(item => (
          <View
            key={item.label}
            style={[
              responsive.isTablet ? styles.quarter : styles.half,
              { paddingHorizontal: responsive.spacing.xs, marginBottom: responsive.spacing.sm },
            ]}
          >
            <AnimatedButton
              onPress={() => onSelectFilter(item.filter)}
              accessibilityLabel={`${item.label}: ${item.value}. Ver recordatorios`}
            >
              <View
                className={`rounded-xl ${isDark ? 'bg-gray-900/60' : 'bg-gray-50'}`}
                style={{ padding: responsive.spacing.md }}
              >
                <View className="flex-row items-center">
                  <View className={`w-2 h-2 rounded-full mr-2 ${item.dot}`} />
                  <Text
                    className={`font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}
                    style={{ fontSize: responsive.fontSize.sm }}
                    numberOfLines={1}
                  >
                    {item.label}
                  </Text>
                </View>
                <Text
                  className={`font-bold ${item.text}`}
                  style={{ fontSize: responsive.fontSize['3xl'], marginTop: responsive.spacing.xs }}
                >
                  {item.value}
                </Text>
              </View>
            </AnimatedButton>
          </View>
        ))}
      </View>

      <Text
        className={isDark ? 'text-gray-400' : 'text-gray-500'}
        style={{ fontSize: responsive.fontSize.sm, marginTop: responsive.spacing.xs }}
      >
        {statusMessage}
      </Text>
    </SectionCard>
  );
}

// En tablet caben las cuatro cifras en una fila; en teléfono, dos por fila
const styles = StyleSheet.create({
  half: { width: '50%' },
  quarter: { width: '25%' },
});
