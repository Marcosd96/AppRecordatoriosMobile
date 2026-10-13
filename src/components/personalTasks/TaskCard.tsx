import React from 'react';
import { AccessibilityActionEvent, Pressable, Text, View } from 'react-native';
import { PersonalTask, TaskPriority, TaskStatus } from '../../types';
import { useTheme } from '../../context/ThemeContext';
import { useThemeColors } from '../../theme/colors';
import { highlightStyle } from '../../hooks/useHighlightItem';
import Button from '../Button';
import IconButton from '../IconButton';
import StatusBadge, { BadgeTone } from '../StatusBadge';
import { CheckIcon, MoreIcon } from '../icons/ActionIcons';
import {
  TaskStatusAction,
  formatRecurrence,
  formatReminderLead,
  formatTaskDate,
  isTaskOverdue,
  priorityLabels,
  statusLabels,
} from './taskForm';

interface TaskCardProps {
  task: PersonalTask;
  /** Tocar la tarjeta: editar la tarea */
  onPress: (task: PersonalTask) => void;
  /** Acción principal visible (completar o reanudar) */
  onStatusChange: (task: PersonalTask, action: TaskStatusAction) => void;
  /** Resto de acciones (pausar, cancelar, eliminar…) en una hoja */
  onOpenActions: (task: PersonalTask) => void;
  /** Resaltada al abrir la app desde su notificación */
  highlighted?: boolean;
  /** Acción en curso: los botones no admiten otra pulsación hasta que termine */
  busy?: boolean;
}

const statusTones: Record<TaskStatus, BadgeTone> = {
  active: 'success',
  paused: 'warning',
  completed: 'neutral',
  cancelled: 'error',
};

// La prioridad baja no necesita llamar la atención; la urgente usa el mismo rojo que lo vencido
const priorityTones: Record<TaskPriority, BadgeTone> = {
  low: 'neutral',
  medium: 'primary',
  high: 'warning',
  urgent: 'error',
};

/** La acción más frecuente según el estado; las tareas cerradas no tienen ninguna */
const primaryAction = (
  status: TaskStatus,
): { action: TaskStatusAction; label: string } | null => {
  if (status === 'active') return { action: 'complete', label: 'Completar' };
  if (status === 'paused') return { action: 'resume', label: 'Reanudar' };
  return null;
};

/**
 * Tarea en la lista: estado, fecha y una sola acción visible. Tocarla abre la edición y el
 * resto de acciones están en ⋮ (COMPONENT_GUIDELINES §4).
 */
export default function TaskCard({
  task,
  onPress,
  onStatusChange,
  onOpenActions,
  highlighted = false,
  busy = false,
}: TaskCardProps) {
  const { isDark } = useTheme();
  const colors = useThemeColors();
  const overdue = isTaskOverdue(task);
  const closed = task.status === 'completed' || task.status === 'cancelled';
  const primary = primaryAction(task.status);
  const dateText = formatTaskDate(task.nextOccurrence || task.startDate);
  const details = [formatReminderLead(task), formatRecurrence(task)].filter(Boolean).join(' · ');

  // TalkBack lee la tarjeta como un solo elemento; las acciones se ofrecen en su menú
  const accessibilityLabel = [
    task.title,
    statusLabels[task.status],
    `prioridad ${priorityLabels[task.priority].toLowerCase()}`,
    overdue ? `atrasada, debía hacerse el ${dateText}` : `próxima ${dateText}`,
    details,
  ].join(', ');

  const accessibilityActions = [
    { name: 'activate', label: 'Editar' },
    ...(primary ? [{ name: primary.action, label: primary.label }] : []),
    { name: 'more', label: 'Más acciones' },
  ];

  const onAccessibilityAction = ({ nativeEvent }: AccessibilityActionEvent) => {
    if (nativeEvent.actionName === 'activate') {
      onPress(task);
    } else if (nativeEvent.actionName === 'more') {
      onOpenActions(task);
    } else if (primary && nativeEvent.actionName === primary.action && !busy) {
      onStatusChange(task, primary.action);
    }
  };

  return (
    <Pressable
      onPress={() => onPress(task)}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint="Abre la tarea para editarla"
      accessibilityActions={accessibilityActions}
      onAccessibilityAction={onAccessibilityAction}
      android_ripple={{ color: colors.ripple }}
      style={highlighted ? highlightStyle : undefined}
      className={`rounded-2xl border mb-3 overflow-hidden ${
        isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
      }`}
    >
      <View className={`pl-4 pt-4 pr-1 pb-2 ${closed ? 'opacity-70' : ''}`}>
        <View className="flex-row items-center flex-wrap gap-1.5 pr-3">
          <StatusBadge label={statusLabels[task.status]} tone={statusTones[task.status]} />
          <StatusBadge label={priorityLabels[task.priority]} tone={priorityTones[task.priority]} />
          {overdue && <StatusBadge label="Atrasada" tone="error" />}
        </View>

        <Text
          className={`mt-2 pr-3 text-base font-semibold ${isDark ? 'text-white' : 'text-gray-900'} ${
            task.status === 'completed' ? 'line-through' : ''
          }`}
        >
          {task.title}
        </Text>
        {task.description ? (
          <Text
            numberOfLines={2}
            className={`mt-0.5 pr-3 text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}
          >
            {task.description}
          </Text>
        ) : null}

        <View className="flex-row items-center mt-3">
          <View className="flex-1 pr-2">
            <Text
              className={`text-sm font-medium ${
                overdue
                  ? isDark ? 'text-red-300' : 'text-red-600'
                  : isDark ? 'text-gray-200' : 'text-gray-800'
              }`}
            >
              {overdue ? `Debía hacerse el ${dateText}` : dateText}
            </Text>
            <Text className={`text-xs mt-0.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              {details}
            </Text>
          </View>

          {primary ? (
            <Button
              label={primary.label}
              onPress={() => onStatusChange(task, primary.action)}
              variant="tonal"
              renderIcon={
                primary.action === 'complete'
                  ? color => <CheckIcon color={color} size={16} />
                  : undefined
              }
              busy={busy}
            />
          ) : null}
          <IconButton
            accessibilityLabel={`Más acciones de ${task.title}`}
            onPress={() => onOpenActions(task)}
            disabled={busy}
            renderIcon={color => <MoreIcon color={color} />}
          />
        </View>
      </View>
    </Pressable>
  );
}
