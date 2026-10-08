import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { PersonalTask, TaskPriority, TaskStatus } from '../../types';
import {
  FormMessage,
  TaskStatusAction,
  formatTaskDate,
  priorityLabels,
  statusLabels,
} from './taskForm';
import {
  diagnoseTaskNotification,
  rescheduleTaskNotification,
  scheduleTaskQuickTestNotification,
  scheduleTaskTestNotification,
} from './taskNotificationTools';

interface TaskCardProps {
  task: PersonalTask;
  isDark: boolean;
  onEdit: (task: PersonalTask) => void;
  onStatusChange: (id: string, action: TaskStatusAction) => void;
  onDelete: (id: string) => void;
  onShowMessage: (message: FormMessage) => void;
}

interface ActionButton {
  key: string;
  label: string;
  onPress: () => void;
  container: string;
  text: string;
}

const getStatusStyles = (
  isDark: boolean,
): Record<TaskStatus, { container: string; text: string }> => ({
  active: {
    container: isDark
      ? 'bg-green-900/30 border-green-800'
      : 'bg-green-50 border-green-200',
    text: isDark ? 'text-green-200' : 'text-green-900',
  },
  paused: {
    container: isDark
      ? 'bg-yellow-900/30 border-yellow-800'
      : 'bg-yellow-50 border-yellow-200',
    text: isDark ? 'text-yellow-200' : 'text-yellow-900',
  },
  completed: {
    container: isDark
      ? 'bg-gray-800 border-gray-700'
      : 'bg-gray-100 border-gray-200',
    text: isDark ? 'text-gray-200' : 'text-gray-700',
  },
  cancelled: {
    container: isDark
      ? 'bg-red-900/30 border-red-800'
      : 'bg-red-50 border-red-200',
    text: isDark ? 'text-red-200' : 'text-red-900',
  },
});

const getPriorityAccentStyles = (
  isDark: boolean,
): Record<TaskPriority, { bubble: string; label: string; chip: string }> => ({
  low: {
    bubble: isDark ? 'bg-emerald-500/10' : 'bg-emerald-100',
    label: isDark ? 'text-emerald-200' : 'text-emerald-700',
    chip: isDark ? 'bg-emerald-900/30' : 'bg-emerald-50',
  },
  medium: {
    bubble: isDark ? 'bg-blue-500/10' : 'bg-blue-100',
    label: isDark ? 'text-blue-200' : 'text-blue-700',
    chip: isDark ? 'bg-blue-900/30' : 'bg-blue-50',
  },
  high: {
    bubble: isDark ? 'bg-orange-500/10' : 'bg-orange-100',
    label: isDark ? 'text-orange-200' : 'text-orange-700',
    chip: isDark ? 'bg-orange-900/30' : 'bg-orange-50',
  },
  urgent: {
    bubble: isDark ? 'bg-red-500/10' : 'bg-red-100',
    label: isDark ? 'text-red-200' : 'text-red-700',
    chip: isDark ? 'bg-red-900/30' : 'bg-red-50',
  },
});

function getActionButtons(
  task: PersonalTask,
  isDark: boolean,
  { onStatusChange, onDelete, onShowMessage }: Omit<TaskCardProps, 'task' | 'isDark' | 'onEdit'>,
): ActionButton[] {
  const actionButtons: ActionButton[] = [];
  const showResult = (action: (t: PersonalTask) => Promise<FormMessage>) => async () => {
    onShowMessage(await action(task));
  };

  if (task.status !== 'completed' && task.status !== 'cancelled') {
    actionButtons.push({
      key: 'complete',
      label: 'Completar',
      onPress: () => onStatusChange(task.id, 'complete'),
      container: 'bg-green-600',
      text: 'text-white',
    });
  }

  if (task.status === 'active') {
    actionButtons.push({
      key: 'pause',
      label: 'Pausar',
      onPress: () => onStatusChange(task.id, 'pause'),
      container: isDark ? 'bg-yellow-900/40' : 'bg-yellow-100',
      text: isDark ? 'text-yellow-100' : 'text-yellow-800',
    });
  }

  if (task.status === 'paused') {
    actionButtons.push({
      key: 'resume',
      label: 'Reanudar',
      onPress: () => onStatusChange(task.id, 'resume'),
      container: isDark ? 'bg-blue-900/40' : 'bg-blue-100',
      text: isDark ? 'text-blue-100' : 'text-blue-800',
    });
  }

  if (task.status !== 'cancelled') {
    actionButtons.push({
      key: 'cancel',
      label: 'Cancelar',
      onPress: () => onStatusChange(task.id, 'cancel'),
      container: isDark ? 'bg-red-900/40' : 'bg-red-100',
      text: isDark ? 'text-red-100' : 'text-red-700',
    });
  }

  // Herramientas de diagnóstico y prueba de notificaciones
  if (task.status === 'active' && task.reminderEnabled) {
    actionButtons.push(
      {
        key: 'diagnose',
        label: '🔍 Diagnosticar',
        onPress: showResult(diagnoseTaskNotification),
        container: isDark ? 'bg-indigo-900/40' : 'bg-indigo-100',
        text: isDark ? 'text-indigo-100' : 'text-indigo-800',
      },
      {
        key: 'test-notification',
        label: '🔔 Probar Notif.',
        onPress: showResult(scheduleTaskTestNotification),
        container: isDark ? 'bg-purple-900/40' : 'bg-purple-100',
        text: isDark ? 'text-purple-100' : 'text-purple-800',
      },
      {
        key: 'test-notification-immediate',
        label: '⚡ Prueba Rápida',
        onPress: showResult(scheduleTaskQuickTestNotification),
        container: isDark ? 'bg-orange-900/40' : 'bg-orange-100',
        text: isDark ? 'text-orange-100' : 'text-orange-800',
      },
      {
        key: 'reschedule-notification',
        label: '🔄 Reprogramar',
        onPress: showResult(rescheduleTaskNotification),
        container: isDark ? 'bg-cyan-900/40' : 'bg-cyan-100',
        text: isDark ? 'text-cyan-100' : 'text-cyan-800',
      },
    );
  }

  actionButtons.push({
    key: 'delete',
    label: 'Eliminar',
    onPress: () => onDelete(task.id),
    container: isDark
      ? 'bg-gray-900 border border-gray-700'
      : 'bg-gray-50 border border-gray-200',
    text: isDark ? 'text-gray-300' : 'text-gray-600',
  });

  return actionButtons;
}

export default function TaskCard({
  task,
  isDark,
  onEdit,
  onStatusChange,
  onDelete,
  onShowMessage,
}: TaskCardProps) {
  const statusStyles = getStatusStyles(isDark);
  const priorityAccentStyles = getPriorityAccentStyles(isDark);
  const actionButtons = getActionButtons(task, isDark, {
    onStatusChange,
    onDelete,
    onShowMessage,
  });

  return (
    <View
      className={`rounded-3xl p-5 border mb-4 ${
        isDark
          ? 'bg-gray-800/80 border-gray-700'
          : 'bg-white border-gray-200'
      }`}
    >
      <View className="flex-row items-start justify-between">
        <View className="flex-row items-center flex-1 pr-3">
          <View
            className={`h-12 w-12 rounded-2xl items-center justify-center ${
              priorityAccentStyles[task.priority].bubble
            }`}
          >
            <Text
              className={`text-base font-semibold ${
                priorityAccentStyles[task.priority].label
              }`}
            >
              {priorityLabels[task.priority].substring(0, 1)}
            </Text>
          </View>
          <View className="ml-3 flex-1">
            <Text
              className={`text-lg font-semibold ${
                isDark ? 'text-white' : 'text-gray-900'
              }`}
            >
              {task.title}
            </Text>
            <View className="flex-row items-center mt-1">
              <View
                className={`px-2 py-0.5 rounded-full border ${
                  statusStyles[task.status].container
                }`}
              >
                <Text
                  className={`text-xs font-semibold ${
                    statusStyles[task.status].text
                  }`}
                >
                  {statusLabels[task.status]}
                </Text>
              </View>
              <View
                className={`ml-2 px-2 py-0.5 rounded-full ${
                  priorityAccentStyles[task.priority].chip
                }`}
              >
                <Text
                  className={`text-xs font-medium ${
                    priorityAccentStyles[task.priority].label
                  }`}
                >
                  {priorityLabels[task.priority]}
                </Text>
              </View>
            </View>
          </View>
        </View>
        <TouchableOpacity onPress={() => onEdit(task)}>
          <Text className="text-blue-500 text-sm font-semibold">
            Editar
          </Text>
        </TouchableOpacity>
      </View>

      {task.description ? (
        <View
          className={`mt-3 rounded-2xl px-3 py-2 ${
            isDark ? 'bg-gray-900/60' : 'bg-gray-50'
          }`}
        >
          <Text
            className={`text-sm leading-relaxed ${
              isDark ? 'text-gray-300' : 'text-gray-600'
            }`}
          >
            {task.description}
          </Text>
        </View>
      ) : null}

      <View
        className={`mt-4 rounded-2xl border px-4 py-3 ${
          isDark ? 'border-gray-700' : 'border-gray-100'
        }`}
      >
        <View className="flex-row justify-between mb-2">
          <View>
            <Text className="text-xs text-gray-500">
              Próxima ejecución
            </Text>
            <Text
              className={`text-sm font-semibold ${
                isDark ? 'text-white' : 'text-gray-900'
              }`}
            >
              {formatTaskDate(task.nextOccurrence || task.startDate)}
            </Text>
          </View>
          <View className="items-end">
            <Text className="text-xs text-gray-500">
              Recordatorio
            </Text>
            <Text
              className={`text-sm font-semibold ${
                task.reminderEnabled
                  ? isDark
                    ? 'text-green-200'
                    : 'text-green-700'
                  : isDark
                  ? 'text-gray-400'
                  : 'text-gray-500'
              }`}
            >
              {task.reminderEnabled
                ? `Sí (${task.reminderMinutes} min antes)`
                : 'Desactivado'}
            </Text>
          </View>
        </View>
        {task.isRecurring && (
          <View
            className={`mt-2 rounded-2xl px-3 py-2 ${
              isDark
                ? 'bg-purple-900/30 border border-purple-800/60'
                : 'bg-purple-50 border border-purple-200'
            }`}
          >
            <Text
              className={`text-xs font-semibold ${
                isDark ? 'text-purple-100' : 'text-purple-700'
              }`}
            >
              Recurrente
            </Text>
            <Text
              className={`text-sm mt-1 ${
                isDark ? 'text-purple-50' : 'text-purple-800'
              }`}
            >
              {task.recurrenceInterval
                ? `Cada ${task.recurrenceInterval} ${
                    task.recurrenceType === 'daily'
                      ? 'día(s)'
                      : task.recurrenceType === 'weekly'
                      ? 'semana(s)'
                      : 'mes(es)'
                  }`
                : `Tipo: ${task.recurrenceType}`}
            </Text>
          </View>
        )}
      </View>

      <View className="mt-4 flex-row flex-wrap -mx-1">
        {actionButtons.map(button => (
          <View key={button.key} className="w-1/2 px-1 mb-2">
            <TouchableOpacity
              onPress={button.onPress}
              className={`py-2.5 rounded-2xl items-center justify-center ${button.container}`}
            >
              <Text
                className={`text-sm font-semibold ${button.text}`}
              >
                {button.label}
              </Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>
    </View>
  );
}
