import { useCallback, useMemo, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  CreatePersonalTaskPayload,
  UpdatePersonalTaskPayload,
  personalTasksService,
} from '../services/personalTasksService';

import { queryKeys } from '../config/queryClient';
import { PersonalTask } from '../types';
import { TaskStatusAction } from '../components/personalTasks/taskForm';
import { ActionResult, failure } from './actionResult';
import { usePersonalTasksQuery, useRefetchOnFocus } from './queries';

/**
 * Datos y acciones de las tareas personales, desde la caché (también sin conexión).
 * Tras cada cambio se recargan las tareas y NotificationSync reprograma sus notificaciones.
 * Las acciones devuelven un `ActionResult` para que la pantalla decida cómo mostrarlo; el
 * error de carga se expone en `loadError`.
 */
export function usePersonalTasks() {
  const queryClient = useQueryClient();
  const tasksQuery = usePersonalTasksQuery();
  const [refreshing, setRefreshing] = useState(false);

  useRefetchOnFocus([tasksQuery]);


  // Error de carga solo si no hay datos guardados que mostrar: la pantalla lo muestra en su
  // sitio con "Reintentar". Con caché se siguen viendo los datos y basta el aviso sin conexión
  const { error, data } = tasksQuery;
  const loadError =
    error && !data
      ? (error as Error).message || 'No se pudieron cargar las tareas personales.'
      : null;

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
   */
  const saveTask = useCallback(
    async (
      payload: CreatePersonalTaskPayload,
      editingTask: PersonalTask | null,
    ): Promise<ActionResult> => {
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
        return { ok: true };
      } catch (saveError) {
        console.error('Error al guardar tarea:', saveError);
        return failure('No se pudo guardar la tarea', saveError, 'Inténtalo de nuevo.');
      }
    },
    [reloadTasks],
  );

  // Tareas con un cambio de estado en curso. Sin esto, dos pulsaciones seguidas en "Completar"
  // de una tarea recurrente completarían dos ocurrencias
  const pendingUpdates = useRef(new Set<string>());
  const [busyTaskIds, setBusyTaskIds] = useState<ReadonlySet<string>>(new Set());

  const setTaskBusy = useCallback((id: string, isBusy: boolean) => {
    if (isBusy) {
      pendingUpdates.current.add(id);
    } else {
      pendingUpdates.current.delete(id);
    }
    setBusyTaskIds(new Set(pendingUpdates.current));
  }, []);

  const updateTaskStatus = useCallback(
    async (id: string, action: TaskStatusAction): Promise<ActionResult> => {
      if (pendingUpdates.current.has(id)) return { ok: true };
      setTaskBusy(id, true);
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
        return { ok: true };
      } catch (statusError) {
        console.error('Error al actualizar tarea:', statusError);
        return failure('No se pudo actualizar la tarea', statusError, 'Inténtalo de nuevo.');
      } finally {
        setTaskBusy(id, false);
      }
    },
    [reloadTasks, setTaskBusy],
  );

  const deleteTask = useCallback(
    async (id: string): Promise<ActionResult> => {
      if (pendingUpdates.current.has(id)) return { ok: true };
      setTaskBusy(id, true);
      try {
        await personalTasksService.remove(id);
        await reloadTasks();
        return { ok: true };
      } catch (deleteError) {
        console.error('Error al eliminar tarea:', deleteError);
        return failure('No se pudo eliminar la tarea', deleteError, 'Inténtalo de nuevo.');
      } finally {
        setTaskBusy(id, false);
      }
    },
    [reloadTasks, setTaskBusy],
  );

  return {
    tasks,
    // Solo se muestra la pantalla de carga si no hay nada guardado y se está pidiendo
    loading: tasksQuery.isPending && tasksQuery.fetchStatus === 'fetching',
    refreshing,
    stats,
    /** Tareas con una acción en curso: sus botones no admiten otra pulsación */
    busyTaskIds,
    loadError,
    /** Reintento tras un error de carga en curso */
    retrying: tasksQuery.isFetching,
    retry: tasksQuery.refetch,
    onRefresh,
    saveTask,
    updateTaskStatus,
    deleteTask,
  };
}
