import React from 'react';
import { View, Text, StyleProp, ViewStyle } from 'react-native';
import { Reminder } from '../../types';
import { formatDaysLabel, getDaysUntil } from '../dashboard/dashboardFormat';
import Button from '../Button';
import StatusBadge, { BadgeTone } from '../StatusBadge';
import { CheckIcon } from '../icons/ActionIcons';
import { getReminderState } from './reminderFilters';

const formatDate = (date: Date | string): string =>
  new Intl.DateTimeFormat('es-CO', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(date));

interface ReminderCardProps {
  reminder: Reminder;
  isDark: boolean;
  /** Cambio de estado en curso: el botón no admite otra pulsación hasta que termine */
  busy?: boolean;
  onToggleStatus: (id: string) => void;
  style?: StyleProp<ViewStyle>;
}

type Tone = 'done' | 'overdue' | 'urgent' | 'normal';

// Franja, insignia y días usan el mismo estado (DESIGN_SYSTEM §2.2)
const toneStyles = (isDark: boolean): Record<Tone, { accent: string; days: string }> => ({
  done: {
    accent: isDark ? 'bg-gray-600' : 'bg-gray-300',
    days: isDark ? 'text-gray-400' : 'text-gray-500',
  },
  overdue: {
    accent: 'bg-red-500',
    days: isDark ? 'text-red-300' : 'text-red-600',
  },
  urgent: {
    accent: 'bg-amber-500',
    days: isDark ? 'text-amber-300' : 'text-amber-700',
  },
  normal: {
    accent: 'bg-blue-500',
    days: isDark ? 'text-gray-200' : 'text-gray-700',
  },
});

// La etiqueta sale del estado calculado: un pendiente con fecha pasada se muestra "Vencido"
const badges: Record<Tone, { label: string; tone: BadgeTone }> = {
  done: { label: 'Completado', tone: 'success' },
  overdue: { label: 'Vencido', tone: 'error' },
  urgent: { label: 'Pendiente', tone: 'warning' },
  normal: { label: 'Pendiente', tone: 'primary' },
};

export default function ReminderCard({
  reminder,
  isDark,
  busy = false,
  onToggleStatus,
  style,
}: ReminderCardProps) {
  const state = getReminderState(reminder);
  const isCompleted = state === 'completed';
  const daysUntil = getDaysUntil(reminder.dueDate);
  const tone: Tone = isCompleted
    ? 'done'
    : state === 'overdue'
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
          <StatusBadge label={badges[tone].label} tone={badges[tone].tone} />
          <StatusBadge label={reminder.type} tone={isIva ? 'primary' : 'category'} />
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

          {/* Acción de fila: tonal, no rellena (con 20 filas habría 20 acciones principales) */}
          <Button
            label={isCompleted ? 'Deshacer' : 'Completar'}
            onPress={() => onToggleStatus(reminder.id)}
            variant={isCompleted ? 'secondary' : 'tonal'}
            renderIcon={isCompleted ? undefined : color => <CheckIcon color={color} size={16} />}
            busy={busy}
            accessibilityLabel={isCompleted ? 'Marcar como pendiente' : 'Marcar como completado'}
          />
        </View>
      </View>
    </View>
  );
}
