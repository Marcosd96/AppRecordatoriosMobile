import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  View,
  FlatList,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Button from '../components/Button';
import { FilterChipOption } from '../components/FilterChips';
import EmptyState from '../components/EmptyState';
import ErrorState from '../components/ErrorState';
import { SearchIcon } from '../components/icons/ActionIcons';
import { TasksIcon } from '../components/icons/TabIcons';
import StyledModal from '../components/StyledModal';
import LoadingScreen from '../components/LoadingScreen';
import ScreenHeader from '../components/ScreenHeader';
import TaskCard from '../components/personalTasks/TaskCard';
import ActionSheet, { SheetActionGroup } from '../components/ActionSheet';
import {
  diagnoseTaskNotification,
  rescheduleTaskNotification,
  scheduleTaskQuickTestNotification,
  scheduleTaskTestNotification,
} from '../components/personalTasks/taskNotificationTools';
import TaskFilters from '../components/personalTasks/TaskFilters';
import TaskFormModal from '../components/personalTasks/TaskFormModal';
import {
  FormMessage,
  StatusFilter,
  TaskFormState,
  TaskStatusAction,
  createInitialFormState,
  formStateFromTask,
  serializeTaskForm,
  validateTaskForm,
} from '../components/personalTasks/taskForm';
import { useTheme } from '../context/ThemeContext';
import { useSnackbar } from '../context/SnackbarContext';
import { useResponsive } from '../hooks/useResponsive';
import { usePersonalTasks } from '../hooks/usePersonalTasks';
import { useHighlightItem } from '../hooks/useHighlightItem';
import { PersonalTask } from '../types';
import { MainTabScreenProps } from '../navigation/types';

const statusChangeMessages: Record<TaskStatusAction, string> = {
  complete: 'Tarea completada',
  pause: 'Tarea pausada',
  resume: 'Tarea reanudada',
  cancel: 'Tarea cancelada',
};

export default function PersonalTasksScreen({ route }: MainTabScreenProps<'PersonalTasks'>) {
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
    busyTaskIds,
    loadError,
    retrying,
    retry,
    onRefresh,
    saveTask,
    updateTaskStatus,
    deleteTask,
  } = usePersonalTasks();
  const { showSnackbar } = useSnackbar();
  // Tarea cuyas acciones secundarias están abiertas en la hoja
  const [actionsTask, setActionsTask] = useState<PersonalTask | null>(null);

  // Al abrir desde una notificación: quitar filtros, ir hasta la tarea y resaltarla
  const highlightTaskId: string | undefined = route?.params?.taskId;
  const highlightAt: number | undefined = route?.params?.highlightAt;
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

  const { listRef, highlightedId, onScrollToIndexFailed } = useHighlightItem(
    highlightTaskId,
    highlightAt,
    !loading,
    filteredTasks,
  );

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
    const result = await saveTask(serializeTaskForm(formState), editingTask);
    setSubmitting(false);

    // Si falla, la hoja sigue abierta con lo que se escribió
    if (!result.ok) {
      showMessage(result.error);
      return;
    }
    showSnackbar({ message: editingTask ? 'Cambios guardados' : 'Tarea creada' });
    setShowFormModal(false);
    setEditingTask(null);
    setFormState(createInitialFormState());
  };

  const changeStatus = useCallback(
    async (task: PersonalTask, action: TaskStatusAction) => {
      const result = await updateTaskStatus(task.id, action);
      if (!result.ok) {
        showMessage(result.error);
        return;
      }
      // Pausar y reanudar se pueden deshacer; completar y cancelar no tienen vuelta atrás en la API
      const undoAction = action === 'pause' ? 'resume' : action === 'resume' ? 'pause' : null;
      showSnackbar({
        message: statusChangeMessages[action],
        ...(undoAction && {
          actionLabel: 'Deshacer',
          onAction: async () => {
            const undo = await updateTaskStatus(task.id, undoAction);
            if (!undo.ok) {
              showMessage(undo.error);
            }
          },
        }),
      });
    },
    [updateTaskStatus, showMessage, showSnackbar],
  );

  const confirmDeleteTask = async () => {
    if (!taskToDelete) return;
    const id = taskToDelete;
    setTaskToDelete(null);
    const result = await deleteTask(id);
    if (result.ok) {
      showSnackbar({ message: 'Tarea eliminada' });
    } else {
      showMessage(result.error);
    }
  };

  const runTool = (tool: (task: PersonalTask) => Promise<FormMessage>, task: PersonalTask) => async () =>
    showMessage(await tool(task));

  const actionGroups = (task: PersonalTask): SheetActionGroup[] => [
    {
      actions: [
        { key: 'edit', label: 'Editar', onPress: () => openEditModal(task) },
        ...(task.status === 'active'
          ? [{ key: 'pause', label: 'Pausar', onPress: () => changeStatus(task, 'pause') }]
          : []),
        ...(task.status !== 'cancelled' && task.status !== 'completed'
          ? [{ key: 'cancel', label: 'Cancelar tarea', onPress: () => changeStatus(task, 'cancel') }]
          : []),
        { key: 'delete', label: 'Eliminar', destructive: true, onPress: () => setTaskToDelete(task.id) },
      ],
    },
    {
      // Herramientas para cuando un aviso no llega: fuera de la tarjeta, pero disponibles
      title: 'Diagnóstico del aviso',
      actions:
        task.status === 'active' && task.reminderEnabled
          ? [
              { key: 'diagnose', label: 'Comprobar aviso', onPress: runTool(diagnoseTaskNotification, task) },
              { key: 'reschedule', label: 'Reprogramar aviso', onPress: runTool(rescheduleTaskNotification, task) },
              { key: 'test', label: 'Aviso de prueba en 2 minutos', onPress: runTool(scheduleTaskTestNotification, task) },
              { key: 'quick-test', label: 'Aviso de prueba en 10 segundos', onPress: runTool(scheduleTaskQuickTestNotification, task) },
            ]
          : [],
    },
  ];

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
          <Button label="Nueva tarea" onPress={openCreateModal} />
        }
      />

      <FlatList
        ref={listRef}
        className="flex-1"
        data={filteredTasks}
        keyExtractor={task => task.id}
        extraData={busyTaskIds}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={{ paddingBottom: responsive.spacing.xl }}
        onScrollToIndexFailed={onScrollToIndexFailed}
        // Es un elemento, no un componente: así el buscador no pierde el foco al escribir
        ListHeaderComponent={
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
        }
        renderItem={({ item: task }) => (
          <View style={{ paddingHorizontal: responsive.spacing.lg }}>
            <TaskCard
              task={task}
              onPress={openEditModal}
              onStatusChange={changeStatus}
              onOpenActions={setActionsTask}
              highlighted={highlightedId === task.id}
              busy={busyTaskIds.has(task.id)}
            />
          </View>
        )}
        ListEmptyComponent={
          <View style={{ paddingHorizontal: responsive.spacing.lg }}>
            {loadError ? (
              <ErrorState message={loadError} onRetry={retry} retrying={retrying} />
            ) : (
              <EmptyState
                isDark={isDark}
                renderIcon={color =>
                  tasks.length === 0 ? <TasksIcon color={color} size={28} /> : <SearchIcon color={color} size={28} />
                }
                title={tasks.length === 0 ? 'Aún no tienes tareas' : 'No hay tareas con estos filtros'}
                message={
                  tasks.length === 0
                    ? 'Crea una tarea y te recordaremos cuando toque.'
                    : 'Prueba con otra búsqueda o cambia el filtro.'
                }
                actionLabel={tasks.length === 0 ? 'Crear mi primera tarea' : 'Nueva tarea'}
                onAction={openCreateModal}
              />
            )}
          </View>
        }
      />

      <ActionSheet
        visible={actionsTask !== null}
        title={actionsTask?.title ?? ''}
        groups={actionsTask ? actionGroups(actionsTask) : []}
        onClose={() => setActionsTask(null)}
      />

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
            text: 'Entendido',
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
