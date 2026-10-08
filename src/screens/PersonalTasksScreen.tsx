import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AnimatedButton from '../components/AnimatedButton';
import { FilterChipOption } from '../components/FilterChips';
import StyledModal from '../components/StyledModal';
import LoadingScreen from '../components/LoadingScreen';
import ScreenHeader from '../components/ScreenHeader';
import TaskCard from '../components/personalTasks/TaskCard';
import TaskFilters from '../components/personalTasks/TaskFilters';
import TaskFormModal from '../components/personalTasks/TaskFormModal';
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
import { useHighlightItem } from '../hooks/useHighlightItem';
import { PersonalTask } from '../types';

export default function PersonalTasksScreen({ route }: any) {
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

  // Al abrir desde una notificación: quitar filtros, ir hasta la tarea y resaltarla
  const highlightTaskId: string | undefined = route?.params?.taskId;
  const highlightAt: number | undefined = route?.params?.highlightAt;
  const { scrollRef, registerItem, highlightedId } = useHighlightItem(
    highlightTaskId,
    highlightAt,
    !loading,
  );
  useEffect(() => {
    if (highlightTaskId && highlightAt) {
      setStatusFilter('all');
      setSearchQuery('');
    }
  }, [highlightTaskId, highlightAt]);

  const statusFilterOptions = useMemo<FilterChipOption<StatusFilter>[]>(
    () => [
      { key: 'all', label: 'Todas', count: stats.total },
      { key: 'active', label: 'Activas', count: stats.active },
      { key: 'paused', label: 'Pausadas', count: stats.paused },
      { key: 'completed', label: 'Completadas', count: stats.completed },
      { key: 'cancelled', label: 'Canceladas', count: stats.cancelled },
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
    return <LoadingScreen isDark={isDark} message="Cargando tareas personales..." />;
  }

  return (
    <SafeAreaView
      className={`flex-1 ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}
      edges={['top']}
    >
      <ScreenHeader
        isDark={isDark}
        title="Tareas"
        subtitle="Organiza tus pendientes diarios"
        right={
          <AnimatedButton onPress={openCreateModal} accessibilityLabel="Nueva tarea">
            <View
              className="rounded-xl bg-blue-600"
              style={{
                paddingHorizontal: responsive.spacing.md,
                paddingVertical: responsive.spacing.sm,
              }}
            >
              <Text className="font-semibold text-white" style={{ fontSize: responsive.fontSize.sm }}>
                + Nueva
              </Text>
            </View>
          </AnimatedButton>
        }
      />

      <ScrollView
        ref={scrollRef}
        className="flex-1"
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={{ paddingBottom: responsive.spacing.xl }}
      >
        <View style={{ paddingHorizontal: responsive.spacing.lg, paddingVertical: responsive.spacing.md }}>
          <TaskFilters
            isDark={isDark}
            searchQuery={searchQuery}
            onChangeSearch={setSearchQuery}
            statusFilter={statusFilter}
            statusOptions={statusFilterOptions}
            onChangeStatus={setStatusFilter}
          />
        </View>

        <View style={{ paddingHorizontal: responsive.spacing.lg }}>
          {filteredTasks.length === 0 ? (
            <View
              className={`rounded-2xl p-8 border items-center ${
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
                {tasks.length === 0 ? 'Aún no tienes tareas' : 'No hay tareas con estos filtros'}
              </Text>
              <Text
                className={`text-center mt-2 ${
                  isDark ? 'text-gray-400' : 'text-gray-500'
                }`}
              >
                {tasks.length === 0
                  ? 'Crea una tarea y te recordaremos cuando toque.'
                  : 'Prueba con otra búsqueda o cambia el filtro.'}
              </Text>
              <AnimatedButton onPress={openCreateModal}>
                <View className="mt-4 px-6 py-3 rounded-xl bg-blue-600">
                  <Text className="text-white font-semibold text-center">
                    {tasks.length === 0 ? 'Crear mi primera tarea' : 'Nueva tarea'}
                  </Text>
                </View>
              </AnimatedButton>
            </View>
          ) : (
            filteredTasks.map(task => (
              <View key={task.id} ref={registerItem(task.id)} collapsable={false}>
              <TaskCard
                task={task}
                highlighted={highlightedId === task.id}
                isDark={isDark}
                onEdit={openEditModal}
                onStatusChange={updateTaskStatus}
                onDelete={setTaskToDelete}
                onShowMessage={showMessage}
              />
              </View>
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
