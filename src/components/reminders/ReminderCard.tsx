import React from 'react';
import { AccessibilityActionEvent, View, Text, StyleProp, ViewStyle } from 'react-native';
import { Reminder } from '../../types';
import { formatDaysLabel, getDaysUntil } from '../dashboard/dashboardFormat';
import Button from '../Button';
import HighlightRing from '../HighlightRing';
import StatusBadge, { BadgeTone } from '../StatusBadge';
import { CheckIcon } from '../icons/ActionIcons';
import { getReminderState } from './reminderFilters';

// En la tarjeta, corta para que fecha y días quepan en una línea; TalkBack lee la larga
const shortDate = new Intl.DateTimeFormat('es-CO', { day: 'numeric', month: 'short', year: 'numeric' });
const longDate = new Intl.DateTimeFormat('es-CO', { day: 'numeric', month: 'long', year: 'numeric' });

interface ReminderCardProps {
  reminder: Reminder;
  isDark: boolean;
  /** Cambio de estado en curso: el botón no admite otra pulsación hasta que termine */
  busy?: boolean;
  onToggleStatus: (id: string) => void;
  /** Resaltado al llegar desde una notificación o la búsqueda */
  highlighted?: boolean;
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
  highlighted = false,
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
  const dueDate = new Date(reminder.dueDate);
  const daysLabel = formatDaysLabel(daysUntil).toLowerCase();
  const actionLabel = isCompleted ? 'Marcar como pendiente' : 'Marcar como completado';

  // TalkBack lee la tarjeta como un solo elemento; el botón se ofrece como acción
  const accessibilityLabel = [
    badges[tone].label,
    reminder.type,
    reminder.description,
    reminder.companyName,
    `vence el ${longDate.format(dueDate)}`,
    isCompleted ? null : daysLabel,
  ]
    .filter(Boolean)
    .join(', ');

  const onAccessibilityAction = ({ nativeEvent }: AccessibilityActionEvent) => {
    if (nativeEvent.actionName === 'toggle' && !busy) {
      onToggleStatus(reminder.id);
    }
  };

  return (
    <View
      style={style}
      accessible
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ busy }}
      accessibilityActions={[{ name: 'toggle', label: actionLabel }]}
      onAccessibilityAction={onAccessibilityAction}
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

        <View className="flex-row items-center justify-between mt-3">
          {/* Fecha y días en una línea ("15 nov 2026 · en 3 días"): caben más en pantalla */}
          <Text className={`flex-1 pr-3 text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
            {shortDate.format(dueDate)}
            {!isCompleted && (
              <Text className={`font-bold ${styles.days}`}> · {daysLabel}</Text>
            )}
          </Text>

          {/* Acción de fila: tonal, no rellena (con 20 filas habría 20 acciones principales) */}
          <Button
            label={isCompleted ? 'Deshacer' : 'Completar'}
            onPress={() => onToggleStatus(reminder.id)}
            variant={isCompleted ? 'secondary' : 'tonal'}
            renderIcon={isCompleted ? undefined : color => <CheckIcon color={color} size={16} />}
            busy={busy}
            accessibilityLabel={actionLabel}
          />
        </View>
      </View>
      <HighlightRing visible={highlighted} />
    </View>
  );
}
