import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { PersonalTask } from '../types';
import {
  CreatePersonalTaskPayload,
  UpdatePersonalTaskPayload,
  personalTasksService,
} from '../services/personalTasksService';
import { notificationsService } from '../services/notificationsService';
import { FormMessage, TaskStatusAction } from '../components/personalTasks/taskForm';

/**
 * Datos y acciones de las tareas personales, con sus notificaciones sincronizadas.
 * Los errores se notifican con `onError` para que la pantalla decida cómo mostrarlos.
 */
export function usePersonalTasks(onError: (error: FormMessage) => void) {
  const [tasks, setTasks] = useState<PersonalTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const onErrorRef = useRef(onError);
  onErrorRef.current = onError;

  const loadTasks = useCallback(async () => {
    try {
      setLoading(true);
      const data = await personalTasksService.getAll();
      setTasks(data);

      // Programar notificaciones para todas las tareas activas
      await notificationsService.syncPersonalTasks(data);
    } catch (error: any) {
      console.error('Error al cargar tareas personales:', error);
      onErrorRef.current({
        title: 'Error',
        message:
          error?.message ||
          'No se pudieron cargar las tareas personales. Intenta nuevamente.',
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    // Inicializar canal de notificaciones
    const initializeNotifications = async () => {
      await notificationsService.createNotificationChannel();
      await notificationsService.requestPermissions();
    };

    initializeNotifications();
    loadTasks();
  }, [loadTasks]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadTasks();
  }, [loadTasks]);

  const stats = useMemo(() => {
    return {
      total: tasks.length,
      active: tasks.filter(task => task.status === 'active').length,
      paused: tasks.filter(task => task.status === 'paused').length,
      completed: tasks.filter(task => task.status === 'completed').length,
      cancelled: tasks.filter(task => task.status === 'cancelled').length,
    };
  }, [tasks]);

  /**
   * Crea o actualiza una tarea y reprograma su notificación.
   * @returns true si se guardó correctamente
   */
  const saveTask = useCallback(
    async (payload: CreatePersonalTaskPayload, editingTask: PersonalTask | null) => {
      try {
        if (editingTask) {
          // Cancelar notificaciones existentes antes de actualizar
          await notificationsService.cancelPersonalTaskNotifications(editingTask.id);

          const updatedTask = await personalTasksService.update(
            editingTask.id,
            payload as UpdatePersonalTaskPayload,
          );

          // Reprogramar notificación con los datos actualizados
          // Esto asegura que se use la próxima ocurrencia más reciente del backend
          try {
            await notificationsService.schedulePersonalTaskNotification(updatedTask);
          } catch (error) {
            console.error('Error al reprogramar notificación después de actualizar:', error);
            // Continuar aunque falle la reprogramación
          }
        } else {
          const newTask = await personalTasksService.create(payload);
          // Programar notificación para la nueva tarea
          try {
            await notificationsService.schedulePersonalTaskNotification(newTask);
          } catch (error) {
            console.error('Error al programar notificación para nueva tarea:', error);
            // Continuar aunque falle la programación
          }
        }

        // Recargar tareas y reprogramar notificaciones (esto asegura consistencia)
        await loadTasks();
        return true;
      } catch (error: any) {
        console.error('Error al guardar tarea:', error);
        onErrorRef.current({
          title: 'Error',
          message: error?.message || 'No se pudo guardar la tarea. Intenta nuevamente.',
        });
        return false;
      }
    },
    [loadTasks],
  );

  const updateTaskStatus = useCallback(
    async (id: string, action: TaskStatusAction) => {
      try {
        if (action === 'complete') {
          await personalTasksService.complete(id);
          // Cancelar notificaciones al completar
          await notificationsService.cancelPersonalTaskNotifications(id);

          // Si la tarea es recurrente, recargar la tarea actualizada y reprogramar notificación
          // para la próxima ocurrencia
          const currentTask = tasks.find(t => t.id === id);
          if (currentTask?.isRecurring) {
            try {
              const updatedTask = await personalTasksService.getOne(id);
              // Si la tarea sigue activa (recurrente) y tiene próxima ocurrencia, reprogramar
              if (updatedTask.status === 'active' && updatedTask.nextOccurrence) {
                await notificationsService.schedulePersonalTaskNotification(updatedTask);
              }
            } catch (error) {
              console.error('Error al reprogramar notificación de tarea recurrente:', error);
              // Continuar aunque falle la reprogramación
            }
          }
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
            await notificationsService.schedulePersonalTaskNotification(updatedTask);
          }
        } else if (action === 'cancel') {
          await personalTasksService.cancel(id);
          // Cancelar notificaciones al cancelar
          await notificationsService.cancelPersonalTaskNotifications(id);
        }
        await loadTasks();
      } catch (error: any) {
        console.error('Error al actualizar tarea:', error);
        onErrorRef.current({
          title: 'Error',
          message:
            error?.message ||
            'No se pudo actualizar el estado de la tarea. Intenta nuevamente.',
        });
      }
    },
    [tasks, loadTasks],
  );

  const deleteTask = useCallback(
    async (id: string) => {
      try {
        // Cancelar notificaciones antes de eliminar
        await notificationsService.cancelPersonalTaskNotifications(id);
        await personalTasksService.remove(id);
        await loadTasks();
      } catch (error: any) {
        console.error('Error al eliminar tarea:', error);
        onErrorRef.current({
          title: 'Error',
          message: error?.message || 'No se pudo eliminar la tarea. Intenta nuevamente.',
        });
      }
    },
    [loadTasks],
  );

  return {
    tasks,
    loading,
    refreshing,
    stats,
    onRefresh,
    saveTask,
    updateTaskStatus,
    deleteTask,
  };
}
