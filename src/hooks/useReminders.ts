import { useCallback, useMemo, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../config/queryClient';
import { remindersService } from '../services/remindersService';
import { Reminder } from '../types';
import { toggledReminder } from '../components/reminders/reminderFilters';
import { ActionResult, failure } from './actionResult';
import { useCompaniesQuery, useRefetchOnFocus, useRemindersQuery } from './queries';

/**
 * Recordatorios y empresas desde la caché (también sin conexión), con la acción de completar.
 * Al cambiar la caché, NotificationSync cancela o reprograma las notificaciones.
 */
export function useReminders() {
  const queryClient = useQueryClient();
  const remindersQuery = useRemindersQuery();
  const companiesQuery = useCompaniesQuery();
  const [refreshing, setRefreshing] = useState(false);

  useRefetchOnFocus([remindersQuery, companiesQuery]);

  const reminders = useMemo(() => remindersQuery.data ?? [], [remindersQuery.data]);
  const companies = useMemo(() => companiesQuery.data ?? [], [companiesQuery.data]);

  // Error de carga solo si no hay datos guardados: la pantalla lo muestra con "Reintentar"
  const loadErrorSource = remindersQuery.error ?? companiesQuery.error;
  const loadError =
    loadErrorSource && remindersQuery.data === undefined
      ? (loadErrorSource as Error).message || 'No se pudieron cargar los recordatorios.'
      : null;

  const retry = useCallback(() => {
    remindersQuery.refetch();
    companiesQuery.refetch();
  }, [remindersQuery, companiesQuery]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([remindersQuery.refetch(), companiesQuery.refetch()]);
    setRefreshing(false);
  }, [remindersQuery, companiesQuery]);

  // Recordatorios con un cambio en curso. El endpoint alterna el estado, así que una segunda
  // pulsación antes de la respuesta lo devolvería al estado anterior
  const pendingToggles = useRef(new Set<string>());
  const [togglingIds, setTogglingIds] = useState<ReadonlySet<string>>(new Set());

  const setToggling = useCallback((id: string, isToggling: boolean) => {
    if (isToggling) {
      pendingToggles.current.add(id);
    } else {
      pendingToggles.current.delete(id);
    }
    setTogglingIds(new Set(pendingToggles.current));
  }, []);

  const replaceInCache = useCallback(
    (id: string, next: Reminder) =>
      queryClient.setQueryData<Reminder[]>(queryKeys.reminders, current =>
        (current ?? []).map(r => (r.id === id ? next : r)),
      ),
    [queryClient],
  );

  /**
   * Completa o reabre un recordatorio. El cambio se ve al instante y se deshace si el
   * servidor lo rechaza.
   */
  const toggleReminder = useCallback(
    async (id: string): Promise<ActionResult> => {
      const previous = queryClient
        .getQueryData<Reminder[]>(queryKeys.reminders)
        ?.find(r => r.id === id);
      if (!previous || pendingToggles.current.has(id)) {
        return { ok: true };
      }

      setToggling(id, true);
      replaceInCache(id, toggledReminder(previous));
      try {
        const result = await remindersService.toggleStatus(id);
        replaceInCache(id, result.reminder);
        queryClient.invalidateQueries({ queryKey: queryKeys.dashboard });
        return { ok: true };
      } catch (error) {
        console.error('Error al actualizar recordatorio:', error);
        replaceInCache(id, previous);
        return failure(
          'No se pudo actualizar el recordatorio',
          error,
          'Revisa tu conexión e inténtalo de nuevo.',
        );
      } finally {
        setToggling(id, false);
      }
    },
    [queryClient, replaceInCache, setToggling],
  );

  return {
    reminders,
    companies,
    // Solo se muestra la pantalla de carga si no hay nada guardado y se está pidiendo
    loading: remindersQuery.isPending && remindersQuery.fetchStatus === 'fetching',
    isReady: remindersQuery.data !== undefined,
    loadError,
    retrying: remindersQuery.isFetching,
    retry,
    refreshing,
    onRefresh,
    togglingIds,
    toggleReminder,
  };
}
