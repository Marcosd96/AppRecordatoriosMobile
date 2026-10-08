import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AnimatedButton from '../components/AnimatedButton';
import StyledModal from '../components/StyledModal';
import TaskCard from '../components/personalTasks/TaskCard';
import TaskFilters from '../components/personalTasks/TaskFilters';
import TaskFormModal from '../components/personalTasks/TaskFormModal';
import TaskSummaryCard from '../components/personalTasks/TaskSummaryCard';
import {
  FormMessage,
  StatusFilter,
  TaskFormState,
  createInitialFormState,
  formStateFromTask,
  serializeTaskForm,
  validateTaskForm,
} from '../components/personalTasks/taskForm';
import { useTheme } from '../context/ThemeContext';
import { useResponsive } from '../hooks/useResponsive';
import { usePersonalTasks } from '../hooks/usePersonalTasks';
import { PersonalTask } from '../types';

export default function PersonalTasksScreen() {
  const { isDark } = useTheme();
  const responsive = useResponsive();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFormModal, setShowFormModal] = useState(false);
  const [formState, setFormState] = useState<TaskFormState>(createInitialFormState);
  const [editingTask, setEditingTask] = useState<PersonalTask | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<string | null>(null);
  // El mensaje se conserva al cerrar para que no se vacíe durante la animación de salida
  const [message, setMessage] = useState<FormMessage>({ title: '', message: '' });
  const [showMessageModal, setShowMessageModal] = useState(false);

  const showMessage = useCallback((newMessage: FormMessage) => {
    setMessage(newMessage);
    setShowMessageModal(true);
  }, []);

  const {
    tasks,
    loading,
    refreshing,
    stats,
    onRefresh,
    saveTask,
    updateTaskStatus,
    deleteTask,
  } = usePersonalTasks(showMessage);

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

  const openCreateModal = () => {
    setEditingTask(null);
    setFormState(createInitialFormState());
    setShowFormModal(true);
  };

  const openEditModal = (task: PersonalTask) => {
    setEditingTask(task);
    setFormState(formStateFromTask(task));
    setShowFormModal(true);
  };

  const closeFormModal = () => {
    if (submitting) return;
    setShowFormModal(false);
    setEditingTask(null);
    setFormState(createInitialFormState());
  };

  const handleSubmit = async () => {
    const validationError = validateTaskForm(formState);
    if (validationError) {
      showMessage(validationError);
      return;
    }

    setSubmitting(true);
    const saved = await saveTask(serializeTaskForm(formState), editingTask);
    setSubmitting(false);

    if (saved) {
      setShowFormModal(false);
      setEditingTask(null);
      setFormState(createInitialFormState());
    }
  };

  const confirmDeleteTask = async () => {
    if (!taskToDelete) return;
    const id = taskToDelete;
    setTaskToDelete(null);
    await deleteTask(id);
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
        className={`border-b ${
          isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        }`}
        style={{
          paddingHorizontal: responsive.spacing.lg,
          paddingVertical: responsive.spacing.md,
        }}
      >
        <View className="flex-row items-center" style={{ marginBottom: responsive.spacing.sm }}>
          <Text style={{ fontSize: responsive.fontSize['3xl'], marginRight: responsive.spacing.sm }}>✅</Text>
          <Text
            className={`font-bold ${
              isDark ? 'text-white' : 'text-gray-900'
            }`}
            style={{ fontSize: responsive.fontSize['3xl'] }}
          >
            Tareas Personales
          </Text>
        </View>
        <Text
          className={`${
            isDark ? 'text-gray-300' : 'text-gray-600'
          }`}
          style={{
            marginTop: responsive.spacing.sm,
            fontSize: responsive.fontSize.base,
          }}
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
        <View style={{ paddingHorizontal: responsive.spacing.lg, paddingVertical: responsive.spacing.md }}>
          <TaskSummaryCard
            isDark={isDark}
            stats={stats}
            onSelectStatus={setStatusFilter}
          />

          <TaskFilters
            isDark={isDark}
            searchQuery={searchQuery}
            onChangeSearch={setSearchQuery}
            statusFilter={statusFilter}
            statusOptions={statusFilterOptions}
            onChangeStatus={setStatusFilter}
            onCreate={openCreateModal}
          />
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
            filteredTasks.map(task => (
              <TaskCard
                key={task.id}
                task={task}
                isDark={isDark}
                onEdit={openEditModal}
                onStatusChange={updateTaskStatus}
                onDelete={setTaskToDelete}
                onShowMessage={showMessage}
              />
            ))
          )}
        </View>
      </ScrollView>

      <TaskFormModal
        visible={showFormModal}
        isEditing={editingTask !== null}
        isDark={isDark}
        formState={formState}
        setFormState={setFormState}
        submitting={submitting}
        onClose={closeFormModal}
        onSubmit={handleSubmit}
      />

      <StyledModal
        visible={showMessageModal}
        onClose={() => setShowMessageModal(false)}
        title={message.title}
        message={message.message}
        buttons={[
          {
            text: 'Aceptar',
            onPress: () => setShowMessageModal(false),
          },
        ]}
      />

      {/* Modal de confirmación de eliminación */}
      <StyledModal
        visible={taskToDelete !== null}
        onClose={() => setTaskToDelete(null)}
        title="Eliminar tarea"
        message="¿Estás seguro de que deseas eliminar esta tarea? Esta acción no se puede deshacer."
        buttons={[
          {
            text: 'Cancelar',
            style: 'cancel',
            onPress: () => setTaskToDelete(null),
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
