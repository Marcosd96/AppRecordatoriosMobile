import React from 'react';
import { View, Text } from 'react-native';
import SectionCard from '../SectionCard';
import { useResponsive } from '../../hooks/useResponsive';
import { History } from '../history/historyStats';

interface HistorySummaryCardProps {
  isDark: boolean;
  history: History;
  onOpenHistory: () => void;
}

/** Lo completado este mes y el cumplimiento reciente, con acceso al historial */
export default function HistorySummaryCard({ isDark, history, onOpenHistory }: HistorySummaryCardProps) {
  const responsive = useResponsive();
  const thisMonth = history.months[history.months.length - 1];
  const completedThisMonth = thisMonth.remindersOnTime + thisMonth.remindersLate + thisMonth.taskCompletions;
  const mutedText = isDark ? 'text-gray-400' : 'text-gray-500';

  return (
    <SectionCard isDark={isDark} title="Historial" actionLabel="Ver historial" onAction={onOpenHistory}>
      <View className="flex-row items-baseline">
        <Text
          className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}
          style={{ fontSize: responsive.fontSize['3xl'] }}
        >
          {completedThisMonth}
        </Text>
        <Text className={`ml-2 ${mutedText}`} style={{ fontSize: responsive.fontSize.base }}>
          completado{completedThisMonth === 1 ? '' : 's'} este mes
        </Text>
      </View>
      <Text className={`text-sm mt-1 ${mutedText}`}>
        {history.onTimeRate === null
          ? 'Cuando completes recordatorios verás aquí tu cumplimiento.'
          : `${history.onTimeRate}% de los recordatorios completados a tiempo en los últimos ${history.months.length} meses`}
      </Text>
    </SectionCard>
  );
}
