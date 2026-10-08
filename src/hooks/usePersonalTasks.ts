import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  CreatePersonalTaskPayload,
  UpdatePersonalTaskPayload,
  personalTasksService,
} from '../services/personalTasksService';

import { queryKeys } from '../config/queryClient';
import { PersonalTask } from '../types';
import { FormMessage, TaskStatusAction } from '../components/personalTasks/taskForm';
import { usePersonalTasksQuery, useRefetchOnFocus } from './queries';

/**
 * Datos y acciones de las tareas personales, desde la caché (también sin conexión).
 * Tras cada cambio se recargan las tareas y NotificationSync reprograma sus notificaciones.
 * Los errores se notifican con `onError` para que la pantalla decida cómo mostrarlos.
 */
export function usePersonalTasks(onError: (error: FormMessage) => void) {
  const queryClient = useQueryClient();
  const tasksQuery = usePersonalTasksQuery();
  const [refreshing, setRefreshing] = useState(false);

  useRefetchOnFocus([tasksQuery]);

  const onErrorRef = useRef(onError);
  onErrorRef.current = onError;

  // Avisar del error solo si no hay datos guardados que mostrar
  const { error, data } = tasksQuery;
  const lastReportedError = useRef<unknown>(null);
  useEffect(() => {
    if (error && !data && lastReportedError.current !== error) {
      lastReportedError.current = error;
      console.error('Error al cargar tareas personales:', error);
      onErrorRef.current({
        title: 'Error',
        message:
          (error as Error).message ||
          'No se pudieron cargar las tareas personales. Intenta nuevamente.',
      });
    }
  }, [error, data]);

  

  const tasks = useMemo(() => data ?? [], [data]);

  const reloadTasks = useCallback(
    () => queryClient.invalidateQueries({ queryKey: queryKeys.personalTasks }),
    [queryClient],
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await tasksQuery.refetch();
    setRefreshing(false);
  }, [tasksQuery]);

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
   * Crea o actualiza una tarea.
   * @returns true si se guardó correctamente
   */
  const saveTask = useCallback(
    async (payload: CreatePersonalTaskPayload, editingTask: PersonalTask | null) => {
      try {
        if (editingTask) {
          await personalTasksService.update(
            editingTask.id,
            payload as UpdatePersonalTaskPayload,
          );
        } else {
          await personalTasksService.create(payload);
        }
        await reloadTasks();
        return true;
      } catch (saveError: any) {
        console.error('Error al guardar tarea:', saveError);
        onErrorRef.current({
          title: 'Error',
          message: saveError?.message || 'No se pudo guardar la tarea. Intenta nuevamente.',
        });
        return false;
      }
    },
    [reloadTasks],
  );

  const updateTaskStatus = useCallback(
    async (id: string, action: TaskStatusAction) => {
      try {
        if (action === 'complete') {
          // Si es recurrente, el backend calcula la próxima ocurrencia
          await personalTasksService.complete(id);
        } else if (action === 'pause') {
          await personalTasksService.pause(id);
        } else if (action === 'resume') {
          await personalTasksService.resume(id);
        } else if (action === 'cancel') {
          await personalTasksService.cancel(id);
        }
        await reloadTasks();
      } catch (statusError: any) {
        console.error('Error al actualizar tarea:', statusError);
        onErrorRef.current({
          title: 'Error',
          message:
            statusError?.message ||
            'No se pudo actualizar el estado de la tarea. Intenta nuevamente.',
        });
      }
    },
    [reloadTasks],
  );

  const deleteTask = useCallback(
    async (id: string) => {
      try {
        await personalTasksService.remove(id);
        await reloadTasks();
      } catch (deleteError: any) {
        console.error('Error al eliminar tarea:', deleteError);
        onErrorRef.current({
          title: 'Error',
          message: deleteError?.message || 'No se pudo eliminar la tarea. Intenta nuevamente.',
        });
      }
    },
    [reloadTasks],
  );

  return {
    tasks,
    // Solo se muestra la pantalla de carga si no hay nada guardado y se está pidiendo
    loading: tasksQuery.isPending && tasksQuery.fetchStatus === 'fetching',
    refreshing,
    stats,
    onRefresh,
    saveTask,
    updateTaskStatus,
    deleteTask,
  };
}
