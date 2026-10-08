import React from 'react';
import { View, Text, TouchableOpacity, StyleProp, ViewStyle } from 'react-native';
import { Reminder } from '../../types';
import { formatDaysLabel, getDaysUntil } from '../dashboard/dashboardFormat';

const formatDate = (date: Date | string): string =>
  new Intl.DateTimeFormat('es-CO', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(date));

interface ReminderCardProps {
  reminder: Reminder;
  isDark: boolean;
  disabled?: boolean;
  onToggleStatus: (id: string) => void;
  style?: StyleProp<ViewStyle>;
}

type Tone = 'done' | 'overdue' | 'urgent' | 'normal';

const toneStyles = (isDark: boolean): Record<Tone, { accent: string; badge: string; badgeText: string; days: string }> => ({
  done: {
    accent: isDark ? 'bg-gray-600' : 'bg-gray-300',
    badge: isDark ? 'bg-green-500/15' : 'bg-green-100',
    badgeText: isDark ? 'text-green-300' : 'text-green-800',
    days: isDark ? 'text-gray-400' : 'text-gray-500',
  },
  overdue: {
    accent: 'bg-red-500',
    badge: isDark ? 'bg-red-500/15' : 'bg-red-100',
    badgeText: isDark ? 'text-red-300' : 'text-red-800',
    days: isDark ? 'text-red-300' : 'text-red-600',
  },
  urgent: {
    accent: 'bg-amber-500',
    badge: isDark ? 'bg-amber-500/15' : 'bg-amber-100',
    badgeText: isDark ? 'text-amber-300' : 'text-amber-800',
    days: isDark ? 'text-amber-300' : 'text-amber-700',
  },
  normal: {
    accent: 'bg-blue-500',
    badge: isDark ? 'bg-amber-500/15' : 'bg-amber-100',
    badgeText: isDark ? 'text-amber-300' : 'text-amber-800',
    days: isDark ? 'text-gray-200' : 'text-gray-700',
  },
});

const statusLabels: Record<Reminder['status'], string> = {
  pending: 'Pendiente',
  overdue: 'Vencido',
  completed: 'Completado',
};

export default function ReminderCard({
  reminder,
  isDark,
  disabled,
  onToggleStatus,
  style,
}: ReminderCardProps) {
  const isCompleted = reminder.status === 'completed';
  const daysUntil = getDaysUntil(reminder.dueDate);
  const tone: Tone = isCompleted
    ? 'done'
    : reminder.status === 'overdue' || daysUntil < 0
    ? 'overdue'
    : daysUntil <= 7
    ? 'urgent'
    : 'normal';
  const styles = toneStyles(isDark)[tone];
  const isIva = reminder.type === 'IVA';

  return (
    <View
      style={style}
      className={`flex-row rounded-2xl border mb-3 overflow-hidden ${
        isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
      } ${isCompleted ? 'opacity-70' : ''}`}
    >
      {/* Franja de color según la urgencia: se distingue sin leer la tarjeta */}
      <View className={`w-1.5 ${styles.accent}`} />

      <View className="flex-1 p-4">
        <View className="flex-row items-center flex-wrap gap-1.5">
          <View className={`px-2 py-0.5 rounded-full ${styles.badge}`}>
            <Text className={`text-xs font-semibold ${styles.badgeText}`}>
              {statusLabels[reminder.status]}
            </Text>
          </View>
          <View
            className={`px-2 py-0.5 rounded-full ${
              isIva
                ? isDark ? 'bg-blue-500/15' : 'bg-blue-100'
                : isDark ? 'bg-purple-500/15' : 'bg-purple-100'
            }`}
          >
            <Text
              className={`text-xs font-semibold ${
                isIva
                  ? isDark ? 'text-blue-300' : 'text-blue-800'
                  : isDark ? 'text-purple-300' : 'text-purple-800'
              }`}
            >
              {reminder.type}
            </Text>
          </View>
        </View>

        <Text
          className={`mt-2 text-base font-semibold ${
            isDark ? 'text-white' : 'text-gray-900'
          } ${isCompleted ? 'line-through' : ''}`}
        >
          {reminder.description}
        </Text>
        <Text className={`text-sm mt-0.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
          {reminder.companyName}
        </Text>

        <View className="flex-row items-end justify-between mt-3">
          <View className="flex-1 pr-3">
            <Text className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
              Vencimiento
            </Text>
            <Text className={`text-sm font-medium ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
              {formatDate(reminder.dueDate)}
            </Text>
            {!isCompleted && (
              <Text className={`text-sm font-bold mt-0.5 ${styles.days}`}>
                {formatDaysLabel(daysUntil)}
              </Text>
            )}
          </View>

          <TouchableOpacity
            onPress={() => onToggleStatus(reminder.id)}
            disabled={disabled}
            accessibilityRole="button"
            accessibilityLabel={
              isCompleted ? 'Marcar como pendiente' : 'Marcar como completado'
            }
            className={`px-4 py-2.5 rounded-xl ${
              isCompleted
                ? isDark ? 'bg-gray-700' : 'bg-gray-100'
                : 'bg-green-600'
            }`}
          >
            <Text
              className={`text-sm font-semibold ${
                isCompleted ? (isDark ? 'text-gray-200' : 'text-gray-700') : 'text-white'
              }`}
            >
              {isCompleted ? 'Deshacer' : '✓ Completar'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
