import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  TextInput,
  Switch,
  Modal,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AnimatedButton from '../components/AnimatedButton';
import AnimatedView from '../components/AnimatedView';
import StyledModal from '../components/StyledModal';
import { useTheme } from '../context/ThemeContext';
import {
  PersonalTask,
  RecurrenceType,
  TaskPriority,
  TaskStatus,
} from '../types';
import {
  CreatePersonalTaskPayload,
  UpdatePersonalTaskPayload,
  personalTasksService,
} from '../services/personalTasksService';
import { notificationsService } from '../services/notificationsService';

type StatusFilter = TaskStatus | 'all';

interface TaskFormState {
  title: string;
  description: string;
  priority: TaskPriority;
  reminderEnabled: boolean;
  reminderMinutes: string;
  isRecurring: boolean;
  recurrenceType: RecurrenceType;
  recurrenceInterval: string;
}

const initialFormState: TaskFormState = {
  title: '',
  description: '',
  priority: 'medium',
  reminderEnabled: true,
  reminderMinutes: '60',
  isRecurring: false,
  recurrenceType: 'once',
  recurrenceInterval: '1',
};

const priorityLabels: Record<TaskPriority, string> = {
  low: 'Baja',
  medium: 'Media',
  high: 'Alta',
  urgent: 'Urgente',
};

const statusLabels: Record<TaskStatus, string> = {
  active: 'Activa',
  paused: 'Pausada',
  completed: 'Completada',
  cancelled: 'Cancelada',
};

export default function PersonalTasksScreen() {
  const { isDark } = useTheme();
  const [tasks, setTasks] = useState<PersonalTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFormModal, setShowFormModal] = useState(false);
  const [formState, setFormState] = useState<TaskFormState>(initialFormState);
  const [editingTask, setEditingTask] = useState<PersonalTask | null>(null);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState({
    title: '',
    message: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<string | null>(null);

  useEffect(() => {
    // Inicializar canal de notificaciones
    const initializeNotifications = async () => {
      await notificationsService.createNotificationChannel();
      await notificationsService.requestPermissions();
    };

    initializeNotifications();
    loadTasks();
  }, []);

  const loadTasks = async () => {
    try {
      setLoading(true);
      const data = await personalTasksService.getAll();
      setTasks(data);

      // Programar notificaciones para todas las tareas activas
      await notificationsService.scheduleAllPersonalTasks(data);
    } catch (error: any) {
      console.error('Error al cargar tareas personales:', error);
      setErrorMessage({
        title: 'Error',
        message:
          error?.message ||
          'No se pudieron cargar las tareas personales. Intenta nuevamente.',
      });
      setShowErrorModal(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadTasks();
  };

  const stats = useMemo(() => {
    return {
      total: tasks.length,
      active: tasks.filter(task => task.status === 'active').length,
      paused: tasks.filter(task => task.status === 'paused').length,
      completed: tasks.filter(task => task.status === 'completed').length,
      cancelled: tasks.filter(task => task.status === 'cancelled').length,
    };
  }, [tasks]);

  const statusFilterOptions = useMemo(
    () => [
      {
        key: 'all' as StatusFilter,
        label: 'Todas',
        subtitle: `${stats.total} tareas`,
      },
      {
        key: 'active' as StatusFilter,
        label: 'Activas',
        subtitle: `${stats.active} en curso`,
      },
      {
        key: 'paused' as StatusFilter,
        label: 'Pausadas',
        subtitle: `${stats.paused} pendientes`,
      },
      {
        key: 'completed' as StatusFilter,
        label: 'Completadas',
        subtitle: `${stats.completed} cerradas`,
      },
      {
        key: 'cancelled' as StatusFilter,
        label: 'Canceladas',
        subtitle: `${stats.cancelled} descartadas`,
      },
    ],
    [stats],
  );

  const filteredTasks = useMemo(() => {
    return tasks
      .filter(task => {
        if (statusFilter !== 'all' && task.status !== statusFilter) {
          return false;
        }
        if (!searchQuery.trim()) return true;
        const query = searchQuery.toLowerCase();
        return (
          task.title.toLowerCase().includes(query) ||
          (task.description || '').toLowerCase().includes(query)
        );
      })
      .sort((a, b) => {
        const dateA = a.nextOccurrence || a.startDate;
        const dateB = b.nextOccurrence || b.startDate;
        return (
          new Date(dateA || '').getTime() - new Date(dateB || '').getTime()
        );
      });
  }, [tasks, statusFilter, searchQuery]);

  const formatDate = (date?: Date | string | null) => {
    if (!date) return 'Sin fecha';
    try {
      return new Intl.DateTimeFormat('es-CO', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(new Date(date));
    } catch {
      return String(date);
    }
  };

  const priorityStyles: Record<
    TaskPriority,
    { container: string; text: string }
  > = {
    low: {
      container: isDark
        ? 'bg-emerald-900/30 border-emerald-800'
        : 'bg-emerald-50 border-emerald-200',
      text: isDark ? 'text-emerald-200' : 'text-emerald-900',
    },
    medium: {
      container: isDark
        ? 'bg-blue-900/30 border-blue-800'
        : 'bg-blue-50 border-blue-200',
      text: isDark ? 'text-blue-200' : 'text-blue-900',
    },
    high: {
      container: isDark
        ? 'bg-orange-900/30 border-orange-800'
        : 'bg-orange-50 border-orange-200',
      text: isDark ? 'text-orange-200' : 'text-orange-900',
    },
    urgent: {
      container: isDark
        ? 'bg-red-900/30 border-red-800'
        : 'bg-red-50 border-red-200',
      text: isDark ? 'text-red-200' : 'text-red-900',
    },
  };

  const statusStyles: Record<TaskStatus, { container: string; text: string }> =
    {
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
    };

  const priorityAccentStyles: Record<
    TaskPriority,
    { bubble: string; label: string; chip: string }
  > = {
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
  };

  const openCreateModal = () => {
    setEditingTask(null);
    setFormState(initialFormState);
    setShowFormModal(true);
  };

  const openEditModal = (task: PersonalTask) => {
    setEditingTask(task);
    setFormState({
      title: task.title,
      description: task.description || '',
      priority: task.priority,
      reminderEnabled: task.reminderEnabled,
      reminderMinutes: String(task.reminderMinutes ?? 60),
      isRecurring: task.isRecurring,
      recurrenceType: task.recurrenceType || 'once',
      recurrenceInterval: String(task.recurrenceInterval ?? 1),
    });
    setShowFormModal(true);
  };

  const closeFormModal = () => {
    if (submitting) return;
    setShowFormModal(false);
    setEditingTask(null);
    setFormState(initialFormState);
  };

  const serializeForm = (): CreatePersonalTaskPayload => {
    const reminderMinutesNumber = Number(formState.reminderMinutes) || 60;
    const recurrenceIntervalNumber = Number(formState.recurrenceInterval) || 1;

    const basePayload: CreatePersonalTaskPayload = {
      title: formState.title.trim(),
      description: formState.description.trim()
        ? formState.description.trim()
        : undefined,
      startDate: editingTask?.startDate || new Date().toISOString(),
      priority: formState.priority,
      reminderEnabled: formState.reminderEnabled,
      reminderMinutes: reminderMinutesNumber,
      isRecurring: formState.isRecurring,
    };

    if (formState.isRecurring) {
      basePayload.recurrenceType = formState.recurrenceType;
      basePayload.recurrenceInterval = recurrenceIntervalNumber;
    } else {
      basePayload.recurrenceType = 'once';
    }

    return basePayload;
  };

  const handleSubmit = async () => {
    if (!formState.title.trim()) {
      setErrorMessage({
        title: 'Validación',
        message: 'El título es obligatorio.',
      });
      setShowErrorModal(true);
      return;
    }

    try {
      setSubmitting(true);
      const payload = serializeForm();

      if (editingTask) {
        // Cancelar notificaciones existentes antes de actualizar
        await notificationsService.cancelPersonalTaskNotifications(
          editingTask.id,
        );

        await personalTasksService.update(
          editingTask.id,
          payload as UpdatePersonalTaskPayload,
        );
      } else {
        await personalTasksService.create(payload);
      }

      // Recargar tareas y reprogramar notificaciones
      await loadTasks();
      closeFormModal();
    } catch (error: any) {
      console.error('Error al guardar tarea:', error);
      setErrorMessage({
        title: 'Error',
        message:
          error?.message || 'No se pudo guardar la tarea. Intenta nuevamente.',
      });
      setShowErrorModal(true);
    } finally {
      setSubmitting(false);
    }
  };

  const updateTaskStatus = async (
    id: string,
    action: 'pause' | 'resume' | 'cancel' | 'complete',
  ) => {
    try {
      if (action === 'complete') {
        await personalTasksService.complete(id);
        // Cancelar notificaciones al completar
        await notificationsService.cancelPersonalTaskNotifications(id);
      } else if (action === 'pause') {
        await personalTasksService.pause(id);
        // Cancelar notificaciones al pausar
        await notificationsService.cancelPersonalTaskNotifications(id);
      } else if (action === 'resume') {
        await personalTasksService.resume(id);
        // Reprogramar notificaciones al reanudar
        const task = tasks.find(t => t.id === id);
        if (task) {
          const updatedTask = await personalTasksService.getOne(id);
          await notificationsService.schedulePersonalTaskNotification(
            updatedTask,
          );
        }
      } else if (action === 'cancel') {
        await personalTasksService.cancel(id);
        // Cancelar notificaciones al cancelar
        await notificationsService.cancelPersonalTaskNotifications(id);
      }
      await loadTasks();
    } catch (error: any) {
      console.error('Error al actualizar tarea:', error);
      setErrorMessage({
        title: 'Error',
        message:
          error?.message ||
          'No se pudo actualizar el estado de la tarea. Intenta nuevamente.',
      });
      setShowErrorModal(true);
    }
  };

  const deleteTask = (id: string) => {
    setTaskToDelete(id);
    setShowDeleteModal(true);
  };

  const confirmDeleteTask = async () => {
    if (!taskToDelete) return;

    try {
      // Cancelar notificaciones antes de eliminar
      await notificationsService.cancelPersonalTaskNotifications(taskToDelete);
      await personalTasksService.remove(taskToDelete);
      await loadTasks();
      setShowDeleteModal(false);
      setTaskToDelete(null);
    } catch (error: any) {
      console.error('Error al eliminar tarea:', error);
      setShowDeleteModal(false);
      setTaskToDelete(null);
      setErrorMessage({
        title: 'Error',
        message:
          error?.message ||
          'No se pudo eliminar la tarea. Intenta nuevamente.',
      });
      setShowErrorModal(true);
    }
  };

  if (loading) {
    return (
      <SafeAreaView
        className={`flex-1 items-center justify-center ${
          isDark ? 'bg-gray-900' : 'bg-gray-50'
        }`}
        edges={['top']}
      >
        <ActivityIndicator size="large" color="#2563eb" />
        <Text className={isDark ? 'text-gray-300 mt-4' : 'text-gray-600 mt-4'}>
          Cargando tareas personales...
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      className={`flex-1 ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}
      edges={['top']}
    >
      <View
        className={`px-6 py-4 border-b ${
          isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        }`}
      >
        <View className="flex-row items-center mb-2">
          <Text className="text-3xl mr-2">✅</Text>
          <Text
            className={`text-3xl font-bold ${
              isDark ? 'text-white' : 'text-gray-900'
            }`}
          >
            Tareas Personales
          </Text>
        </View>
        <Text
          className={`mt-2 text-base ${
            isDark ? 'text-gray-300' : 'text-gray-600'
          }`}
        >
          Organiza tus pendientes diarios
        </Text>
      </View>

      <ScrollView
        className="flex-1"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={{ paddingBottom: 32 }}
      >
        <View className="px-6 py-4 space-y-4">
          <View
            className={`rounded-3xl p-5 border ${
              isDark
                ? 'bg-gray-800 border-gray-700'
                : 'bg-white border-gray-200'
            }`}
          >
            <Text
              className={`text-sm font-semibold mb-4 ${
                isDark ? 'text-blue-200' : 'text-blue-600'
              }`}
            >
              Resumen rápido
            </Text>
            <Text
              className={`text-2xl font-bold mt-1 ${
                isDark ? 'text-white' : 'text-gray-900'
              }`}
            >
              {stats.active
                ? 'Sigue completando tus tareas'
                : 'Todo en orden'}
            </Text>
            <View className="flex-row flex-wrap -mx-2 mt-4">
              {[
                {
                  label: 'Total',
                  value: stats.total,
                  bg: isDark ? 'bg-blue-500/10' : 'bg-blue-50',
                  text: isDark ? 'text-blue-200' : 'text-blue-700',
                },
                {
                  label: 'Activas',
                  value: stats.active,
                  bg: isDark ? 'bg-green-500/10' : 'bg-green-50',
                  text: isDark ? 'text-green-200' : 'text-green-700',
                },
                {
                  label: 'Pausadas',
                  value: stats.paused,
                  bg: isDark ? 'bg-yellow-500/10' : 'bg-yellow-50',
                  text: isDark ? 'text-yellow-200' : 'text-yellow-700',
                },
                {
                  label: 'Completadas',
                  value: stats.completed,
                  bg: isDark ? 'bg-indigo-500/10' : 'bg-indigo-50',
                  text: isDark ? 'text-indigo-200' : 'text-indigo-700',
                },
              ].map(item => (
                <View key={item.label} className="w-1/2 px-2 mb-4">
                  <View className={`rounded-2xl p-4 ${item.bg}`}>
                    <Text
                      className={`text-xs font-medium mb-1 ${
                        isDark ? 'text-gray-300' : 'text-gray-500'
                      }`}
                    >
                      {item.label}
                    </Text>
                    <Text className={`text-2xl font-bold ${item.text}`}>
                      {item.value}
                    </Text>
                  </View>
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

          <View
            className={`mt-6 rounded-3xl p-4 border ${
              isDark
                ? 'border-gray-700 bg-gray-800/80'
                : 'border-gray-200 bg-white'
            }`}
          >
            <Text
              className={`text-sm font-semibold mb-2 ${
                isDark ? 'text-gray-100' : 'text-gray-800'
              }`}
            >
              Búsqueda rápida
            </Text>
            <TextInput
              className={`border rounded-2xl px-4 py-3 ${
                isDark
                  ? 'bg-gray-900 border-gray-700 text-white'
                  : 'bg-gray-50 border-gray-200 text-gray-900'
              }`}
              placeholder="Buscar por título o descripción"
              placeholderTextColor={isDark ? '#9ca3af' : '#9ca3af'}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingVertical: 12 }}
            >
              {statusFilterOptions.map(status => (
                <TouchableOpacity
                  key={status.key}
                  onPress={() => setStatusFilter(status.key)}
                  className={`px-4 py-2 mr-3 rounded-2xl border ${
                    statusFilter === status.key
                      ? 'bg-blue-600 border-blue-600'
                      : isDark
                      ? 'bg-gray-900 border-gray-700'
                      : 'bg-white border-gray-200'
                  }`}
                >
                  <Text
                    className={`text-sm font-semibold ${
                      statusFilter === status.key
                        ? 'text-white'
                        : isDark
                        ? 'text-gray-100'
                        : 'text-gray-800'
                    }`}
                  >
                    {status.label}
                  </Text>
                  <Text
                    className={`text-xs mt-0.5 ${
                      statusFilter === status.key
                        ? 'text-white/80'
                        : isDark
                        ? 'text-gray-400'
                        : 'text-gray-500'
                    }`}
                  >
                    {status.subtitle}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <AnimatedButton onPress={openCreateModal}>
              <View className="bg-blue-600 py-3 rounded-2xl">
                <Text className="text-white text-center font-semibold">
                  + Nueva tarea
                </Text>
              </View>
            </AnimatedButton>
          </View>
        </View>

        <View className="px-6 py-4">
          {filteredTasks.length === 0 ? (
            <View
              className={`rounded-3xl p-8 border items-center ${
                isDark
                  ? 'bg-gray-800 border-gray-700'
                  : 'bg-white border-gray-200'
              }`}
            >
              <Text className="text-4xl mb-3">🗂️</Text>
              <Text
                className={`text-base font-semibold text-center ${
                  isDark ? 'text-white' : 'text-gray-900'
                }`}
              >
                No hay tareas con estos filtros
              </Text>
              <Text
                className={`text-center mt-2 ${
                  isDark ? 'text-gray-400' : 'text-gray-500'
                }`}
              >
                Ajusta la búsqueda o crea una nueva tarea personalizada.
              </Text>
              <AnimatedButton onPress={openCreateModal}>
                <View className="mt-4 px-6 py-3 rounded-2xl bg-blue-600">
                  <Text className="text-white font-semibold text-center">
                    Crear mi primera tarea
                  </Text>
                </View>
              </AnimatedButton>
            </View>
          ) : (
            filteredTasks.map(task => {
              const actionButtons: Array<{
                key: string;
                label: string;
                onPress: () => void;
                container: string;
                text: string;
              }> = [];

              if (task.status !== 'completed' && task.status !== 'cancelled') {
                actionButtons.push({
                  key: 'complete',
                  label: 'Completar',
                  onPress: () => updateTaskStatus(task.id, 'complete'),
                  container: 'bg-green-600',
                  text: 'text-white',
                });
              }

              if (task.status === 'active') {
                actionButtons.push({
                  key: 'pause',
                  label: 'Pausar',
                  onPress: () => updateTaskStatus(task.id, 'pause'),
                  container: isDark ? 'bg-yellow-900/40' : 'bg-yellow-100',
                  text: isDark ? 'text-yellow-100' : 'text-yellow-800',
                });
              }

              if (task.status === 'paused') {
                actionButtons.push({
                  key: 'resume',
                  label: 'Reanudar',
                  onPress: () => updateTaskStatus(task.id, 'resume'),
                  container: isDark ? 'bg-blue-900/40' : 'bg-blue-100',
                  text: isDark ? 'text-blue-100' : 'text-blue-800',
                });
              }

              if (task.status !== 'cancelled') {
                actionButtons.push({
                  key: 'cancel',
                  label: 'Cancelar',
                  onPress: () => updateTaskStatus(task.id, 'cancel'),
                  container: isDark ? 'bg-red-900/40' : 'bg-red-100',
                  text: isDark ? 'text-red-100' : 'text-red-700',
                });
              }

              actionButtons.push({
                key: 'delete',
                label: 'Eliminar',
                onPress: () => deleteTask(task.id),
                container: isDark
                  ? 'bg-gray-900 border border-gray-700'
                  : 'bg-gray-50 border border-gray-200',
                text: isDark ? 'text-gray-300' : 'text-gray-600',
              });

              return (
                <View
                  key={task.id}
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
                    <TouchableOpacity onPress={() => openEditModal(task)}>
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
                        <Text
                          className={`text-xs ${
                            isDark ? 'text-gray-500' : 'text-gray-500'
                          }`}
                        >
                          Próxima ejecución
                        </Text>
                        <Text
                          className={`text-sm font-semibold ${
                            isDark ? 'text-white' : 'text-gray-900'
                          }`}
                        >
                          {formatDate(task.nextOccurrence || task.startDate)}
                        </Text>
                      </View>
                      <View className="items-end">
                        <Text
                          className={`text-xs ${
                            isDark ? 'text-gray-500' : 'text-gray-500'
                          }`}
                        >
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
            })
          )}
        </View>
      </ScrollView>

      <Modal
        visible={showFormModal}
        animationType="slide"
        transparent
        onRequestClose={closeFormModal}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1 }}
        >
          <View className="flex-1 bg-black/60 justify-end">
            <View
              className={`rounded-t-3xl ${isDark ? 'bg-gray-900' : 'bg-white'}`}
            >
              {/* Header mejorado */}
              <AnimatedView animationType="slideDown" delay={0} duration={400}>
                <View className="px-6 pt-6 pb-4">
                  <View className="flex-row justify-between items-start mb-2">
                    <View className="flex-1 pr-4">
                      <View className="flex-row items-center mb-2">
                        <View
                          className={`h-10 w-10 rounded-2xl items-center justify-center mr-3 ${
                            isDark ? 'bg-blue-500/20' : 'bg-blue-100'
                          }`}
                        >
                          <Text className="text-xl">
                            {editingTask ? '✏️' : '✨'}
                          </Text>
                        </View>
                        <View className="flex-1">
                          <Text
                            className={`text-2xl font-bold ${
                              isDark ? 'text-white' : 'text-gray-900'
                            }`}
                          >
                            {editingTask ? 'Editar tarea' : 'Nueva tarea'}
                          </Text>
                          <Text
                            className={`text-sm mt-0.5 ${
                              isDark ? 'text-gray-400' : 'text-gray-500'
                            }`}
                          >
                            {editingTask
                              ? 'Modifica los detalles de tu tarea'
                              : 'Completa la información para crear tu tarea'}
                          </Text>
                        </View>
                      </View>
                    </View>
                    <TouchableOpacity
                      onPress={closeFormModal}
                      disabled={submitting}
                      className={`h-10 w-10 rounded-xl items-center justify-center ${
                        isDark ? 'bg-gray-800' : 'bg-gray-100'
                      }`}
                    >
                      <Text className="text-lg">✕</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </AnimatedView>

              <ScrollView
                style={{ maxHeight: Platform.OS === 'android' ? 550 : 500 }}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 20 }}
              >
                <View className="px-6 space-y-6">
                  {/* Sección: Información básica */}
                  <AnimatedView
                    animationType="fadeIn"
                    delay={100}
                    duration={400}
                  >
                    <View
                      className={`rounded-3xl p-5 border ${
                        isDark
                          ? 'bg-gray-800/50 border-gray-700'
                          : 'bg-gray-50 border-gray-200'
                      }`}
                    >
                    <Text
                      className={`text-base font-bold mb-4 ${
                        isDark ? 'text-white' : 'text-gray-900'
                      }`}
                    >
                      📝 Información básica
                    </Text>

                    <View className="mb-4">
                      <Text
                        className={`text-sm font-semibold mb-2 ${
                          isDark ? 'text-gray-200' : 'text-gray-700'
                        }`}
                      >
                        Título de la tarea
                        <Text className="text-red-500"> *</Text>
                      </Text>
                      <TextInput
                        className={`border-2 rounded-2xl px-4 py-3.5 ${
                          isDark
                            ? 'bg-gray-900 border-gray-600 text-white'
                            : 'bg-white border-gray-300 text-gray-900'
                        }`}
                        placeholder="Ej: Revisar documentos importantes"
                        placeholderTextColor={isDark ? '#6b7280' : '#9ca3af'}
                        value={formState.title}
                        onChangeText={text =>
                          setFormState(prev => ({ ...prev, title: text }))
                        }
                      />
                    </View>

                    <View>
                      <Text
                        className={`text-sm font-semibold mb-2 ${
                          isDark ? 'text-gray-200' : 'text-gray-700'
                        }`}
                      >
                        Descripción
                        <Text
                          className={`text-xs font-normal ${
                            isDark ? 'text-gray-500' : 'text-gray-500'
                          }`}
                        >
                          {' '}
                          (opcional)
                        </Text>
                      </Text>
                      <TextInput
                        className={`border-2 rounded-2xl px-4 py-3.5 h-28 text-top ${
                          isDark
                            ? 'bg-gray-900 border-gray-600 text-white'
                            : 'bg-white border-gray-300 text-gray-900'
                        }`}
                        placeholder="Agrega detalles adicionales sobre esta tarea..."
                        placeholderTextColor={isDark ? '#6b7280' : '#9ca3af'}
                        value={formState.description}
                        onChangeText={text =>
                          setFormState(prev => ({
                            ...prev,
                            description: text,
                          }))
                        }
                        multiline
                        textAlignVertical="top"
                      />
                    </View>
                  </View>
                  </AnimatedView>

                  {/* Sección: Configuración */}
                  <AnimatedView
                    animationType="fadeIn"
                    delay={200}
                    duration={400}
                  >
                    <View
                      className={`rounded-3xl p-5 border ${
                        isDark
                          ? 'bg-gray-800/50 border-gray-700'
                          : 'bg-gray-50 border-gray-200'
                      }`}
                    >
                    <Text
                      className={`text-base font-bold mb-4 ${
                        isDark ? 'text-white' : 'text-gray-900'
                      }`}
                    >
                      ⚙️ Configuración
                    </Text>

                    <View className="mb-5">
                      <Text
                        className={`text-sm font-semibold mb-3 ${
                          isDark ? 'text-gray-200' : 'text-gray-700'
                        }`}
                      >
                        Prioridad
                      </Text>
                      <View className="flex-row flex-wrap -mx-1">
                        {(Object.keys(priorityLabels) as TaskPriority[]).map(
                          (priority, index) => {
                            const isActive = formState.priority === priority;
                            const getButtonStyle = () => {
                              if (isActive) {
                                const activeStyles = {
                                  low: 'bg-emerald-500 border-emerald-500',
                                  medium: 'bg-blue-500 border-blue-500',
                                  high: 'bg-orange-500 border-orange-500',
                                  urgent: 'bg-red-500 border-red-500',
                                };
                                return activeStyles[priority];
                              } else {
                                return isDark
                                  ? 'bg-gray-700 border-gray-600'
                                  : 'bg-gray-100 border-gray-300';
                              }
                            };
                            const getTextStyle = () => {
                              if (isActive) {
                                return 'text-white';
                              } else {
                                return isDark ? 'text-gray-200' : 'text-gray-800';
                              }
                            };
                            return (
                              <AnimatedView
                                key={priority}
                                animationType="scale"
                                delay={250 + index * 50}
                                duration={300}
                                style={{ width: '48%', marginHorizontal: '1%', marginBottom: 8 }}
                              >
                                <TouchableOpacity
                                  onPress={() =>
                                    setFormState(prev => ({
                                      ...prev,
                                      priority,
                                    }))
                                  }
                                  className={`px-4 py-3 rounded-2xl border-2 ${getButtonStyle()}`}
                                >
                                  <Text
                                    className={`text-sm font-semibold text-center ${getTextStyle()}`}
                                    numberOfLines={1}
                                    adjustsFontSizeToFit
                                  >
                                    {priorityLabels[priority]}
                                  </Text>
                                </TouchableOpacity>
                              </AnimatedView>
                            );
                          },
                        )}
                      </View>
                    </View>

                    {/* Recordatorio */}
                    <View
                      className={`rounded-2xl p-4 mb-4 ${
                        isDark ? 'bg-gray-900/60' : 'bg-white'
                      }`}
                    >
                      <View className="flex-row justify-between items-center">
                        <View className="flex-1 pr-4">
                          <View className="flex-row items-center mb-1">
                            <Text className="text-lg mr-2">🔔</Text>
                            <Text
                              className={`text-sm font-semibold ${
                                isDark ? 'text-white' : 'text-gray-900'
                              }`}
                            >
                              Recordatorio
                            </Text>
                          </View>
                          <Text
                            className={`text-xs ml-7 ${
                              isDark ? 'text-gray-400' : 'text-gray-500'
                            }`}
                          >
                            Notificar antes de la tarea
                          </Text>
                        </View>
                        <Switch
                          value={formState.reminderEnabled}
                          onValueChange={value =>
                            setFormState(prev => ({
                              ...prev,
                              reminderEnabled: value,
                            }))
                          }
                          trackColor={{
                            false: isDark ? '#374151' : '#e5e7eb',
                            true: '#3b82f6',
                          }}
                          thumbColor={
                            formState.reminderEnabled ? '#ffffff' : '#f3f4f6'
                          }
                        />
                      </View>
                      {formState.reminderEnabled && (
                        <AnimatedView
                          animationType="slideDown"
                          delay={0}
                          duration={250}
                        >
                          <View className="mt-3 ml-7">
                            <TextInput
                              keyboardType="number-pad"
                              className={`border-2 rounded-2xl px-4 py-3 ${
                                isDark
                                  ? 'bg-gray-800 border-gray-600 text-white'
                                  : 'bg-gray-50 border-gray-300 text-gray-900'
                              }`}
                              placeholder="Minutos antes (ej: 60)"
                              placeholderTextColor={
                                isDark ? '#6b7280' : '#9ca3af'
                              }
                              value={formState.reminderMinutes}
                              onChangeText={text =>
                                setFormState(prev => ({
                                  ...prev,
                                  reminderMinutes: text.replace(/[^0-9]/g, ''),
                                }))
                              }
                            />
                          </View>
                        </AnimatedView>
                      )}
                    </View>

                    {/* Recurrencia */}
                    <View
                      className={`rounded-2xl p-4 ${
                        isDark ? 'bg-gray-900/60' : 'bg-white'
                      }`}
                    >
                      <View className="flex-row justify-between items-center">
                        <View className="flex-1 pr-4">
                          <View className="flex-row items-center mb-1">
                            <Text className="text-lg mr-2">🔄</Text>
                            <Text
                              className={`text-sm font-semibold ${
                                isDark ? 'text-white' : 'text-gray-900'
                              }`}
                            >
                              Repetir tarea
                            </Text>
                          </View>
                          <Text
                            className={`text-xs ml-7 ${
                              isDark ? 'text-gray-400' : 'text-gray-500'
                            }`}
                          >
                            Configura recurrencia si lo necesitas
                          </Text>
                        </View>
                        <Switch
                          value={formState.isRecurring}
                          onValueChange={value =>
                            setFormState(prev => ({
                              ...prev,
                              isRecurring: value,
                              recurrenceType: value
                                ? prev.recurrenceType
                                : 'once',
                            }))
                          }
                          trackColor={{
                            false: isDark ? '#374151' : '#e5e7eb',
                            true: '#3b82f6',
                          }}
                          thumbColor={
                            formState.isRecurring ? '#ffffff' : '#f3f4f6'
                          }
                        />
                      </View>
                    </View>
                  </View>
                  </AnimatedView>

                  {formState.isRecurring && (
                    <AnimatedView
                      animationType="slideUp"
                      delay={0}
                      duration={300}
                    >
                      <View
                        className={`rounded-3xl p-5 border ${
                          isDark
                            ? 'bg-gray-800/50 border-gray-700'
                            : 'bg-gray-50 border-gray-200'
                        }`}
                      >
                      <Text
                        className={`text-base font-bold mb-4 ${
                          isDark ? 'text-white' : 'text-gray-900'
                        }`}
                      >
                        🔄 Configuración de recurrencia
                      </Text>

                      <View className="mb-4">
                        <Text
                          className={`text-sm font-semibold mb-3 ${
                            isDark ? 'text-gray-200' : 'text-gray-700'
                          }`}
                        >
                          Tipo de recurrencia
                        </Text>
                        <View className="flex-row flex-wrap gap-2">
                          {(['daily', 'weekly', 'monthly'] as const).map(
                            (type, index) => {
                              const typeLabels: Record<
                                'daily' | 'weekly' | 'monthly',
                                string
                              > = {
                                daily: 'Diaria',
                                weekly: 'Semanal',
                                monthly: 'Mensual',
                              };
                              return (
                                <AnimatedView
                                  key={type}
                                  animationType="scale"
                                  delay={100 + index * 50}
                                  duration={300}
                                >
                                  <TouchableOpacity
                                    onPress={() =>
                                      setFormState(prev => ({
                                        ...prev,
                                        recurrenceType: type as RecurrenceType,
                                      }))
                                    }
                                    className={`px-4 py-2.5 rounded-2xl border-2 flex-1 min-w-[100px] ${
                                      formState.recurrenceType === type
                                        ? 'bg-purple-500 border-purple-500'
                                        : isDark
                                        ? 'bg-gray-700 border-gray-600'
                                        : 'bg-white border-gray-300'
                                    }`}
                                  >
                                    <Text
                                      className={`text-sm font-semibold text-center ${
                                        formState.recurrenceType === type
                                          ? 'text-white'
                                          : isDark
                                          ? 'text-white'
                                          : 'text-gray-900'
                                      }`}
                                    >
                                      {typeLabels[type]}
                                    </Text>
                                  </TouchableOpacity>
                                </AnimatedView>
                              );
                            },
                          )}
                        </View>
                      </View>

                      <View>
                        <Text
                          className={`text-sm font-semibold mb-2 ${
                            isDark ? 'text-gray-200' : 'text-gray-700'
                          }`}
                        >
                          Intervalo
                        </Text>
                        <TextInput
                          keyboardType="number-pad"
                          className={`border-2 rounded-2xl px-4 py-3 ${
                            isDark
                              ? 'bg-gray-900 border-gray-600 text-white'
                              : 'bg-white border-gray-300 text-gray-900'
                          }`}
                          placeholder="Ej: 2 (cada 2 días/semanas/meses)"
                          placeholderTextColor={isDark ? '#6b7280' : '#9ca3af'}
                          value={formState.recurrenceInterval}
                          onChangeText={text =>
                            setFormState(prev => ({
                              ...prev,
                              recurrenceInterval: text.replace(/[^0-9]/g, ''),
                            }))
                          }
                        />
                      </View>
                    </View>
                    </AnimatedView>
                  )}

                  {/* Botón de acción */}
                  <AnimatedView
                    animationType="fadeIn"
                    delay={300}
                    duration={400}
                  >
                    <View className="pt-2 pb-6">
                    <AnimatedButton
                      onPress={handleSubmit}
                      disabled={submitting}
                    >
                      <View
                        className={`py-4 rounded-2xl ${
                          submitting ? 'bg-blue-400' : 'bg-blue-600'
                        } shadow-lg`}
                      >
                        <Text className="text-white text-center font-bold text-base">
                          {submitting
                            ? 'Guardando...'
                            : editingTask
                            ? '💾 Guardar cambios'
                            : '✨ Crear tarea'}
                        </Text>
                      </View>
                    </AnimatedButton>
                    </View>
                  </AnimatedView>
                </View>
              </ScrollView>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <StyledModal
        visible={showErrorModal}
        onClose={() => setShowErrorModal(false)}
        title={errorMessage.title}
        message={errorMessage.message}
        buttons={[
          {
            text: 'Aceptar',
            onPress: () => setShowErrorModal(false),
          },
        ]}
      />

      {/* Modal de confirmación de eliminación */}
      <StyledModal
        visible={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setTaskToDelete(null);
        }}
        title="Eliminar tarea"
        message="¿Estás seguro de que deseas eliminar esta tarea? Esta acción no se puede deshacer."
        buttons={[
          {
            text: 'Cancelar',
            style: 'cancel',
            onPress: () => {
              setShowDeleteModal(false);
              setTaskToDelete(null);
            },
          },
          {
            text: 'Eliminar',
            style: 'destructive',
            onPress: confirmDeleteTask,
          },
        ]}
      />
    </SafeAreaView>
  );
}
