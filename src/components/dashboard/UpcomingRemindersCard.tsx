import React from 'react';
import { View, Text } from 'react-native';
import AnimatedButton from '../AnimatedButton';
import SectionCard from '../SectionCard';
import { Reminder } from '../../types';
import { formatDate, formatDaysLabel, getDaysUntil } from './dashboardFormat';
import { useResponsive } from '../../hooks/useResponsive';

interface UpcomingRemindersCardProps {
  isDark: boolean;
  reminders: Reminder[];
  onOpenReminders: () => void;
  onAddCompany: () => void;
}

export default function UpcomingRemindersCard({ isDark, reminders, onOpenReminders, onAddCompany }: UpcomingRemindersCardProps) {
  const responsive = useResponsive();

  return (
    <SectionCard
      isDark={isDark}
      title="Próximos recordatorios"
      actionLabel={reminders.length > 0 ? 'Ver todos' : undefined}
      onAction={onOpenReminders}
    >
      {reminders.length === 0 ? (
        <View className="items-center" style={{ paddingVertical: responsive.spacing.md }}>
          <Text
            className={`text-base font-semibold text-center ${isDark ? 'text-white' : 'text-gray-900'}`}
          >
            No hay recordatorios próximos
          </Text>
          <Text
            className={`text-center text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}
          >
            Agrega empresas para generar recordatorios automáticos.
          </Text>
          <AnimatedButton onPress={onAddCompany}>
            <View className="px-5 py-2.5 rounded-xl mt-4 bg-blue-600">
              <Text className="text-sm font-semibold text-white">Agregar empresa</Text>
            </View>
          </AnimatedButton>
        </View>
      ) : (
        reminders.map((reminder, index) => {
          const daysUntil = getDaysUntil(reminder.dueDate);
          const isUrgent = daysUntil <= 7;
          return (
            <AnimatedButton
              key={reminder.id}
              onPress={onOpenReminders}
              scaleValue={0.98}
              accessibilityLabel={`${reminder.description}, ${reminder.companyName}, ${formatDaysLabel(daysUntil)}`}
            >
              <View
                className={`flex-row items-center ${
                  index > 0 ? (isDark ? 'border-t border-gray-700' : 'border-t border-gray-100') : ''
                }`}
                style={{ paddingVertical: responsive.spacing.sm + 4 }}
              >
                {/* Indicador de urgencia */}
                <View
                  className={`w-1 self-stretch rounded-full mr-3 ${
                    daysUntil < 0 ? 'bg-red-500' : isUrgent ? 'bg-amber-500' : 'bg-blue-500'
                  }`}
                />
                <View className="flex-1 pr-3">
                  <Text
                    className={`text-base font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}
                    numberOfLines={1}
                  >
                    {reminder.description}
                  </Text>
                  <Text
                    className={`text-sm mt-0.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}
                    numberOfLines={1}
                  >
                    {reminder.companyName} · {reminder.type}
                  </Text>
                </View>
                <View className="items-end">
                  <Text
                    className={`text-sm font-semibold ${
                      daysUntil < 0
                        ? isDark ? 'text-red-300' : 'text-red-600'
                        : isUrgent
                        ? isDark ? 'text-amber-300' : 'text-amber-700'
                        : isDark ? 'text-gray-200' : 'text-gray-700'
                    }`}
                  >
                    {formatDaysLabel(daysUntil)}
                  </Text>
                  <Text className={`text-xs mt-0.5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                    {formatDate(reminder.dueDate)}
                  </Text>
                </View>
              </View>
            </AnimatedButton>
          );
        })
      )}
    </SectionCard>
  );
}
