/**
 * Consultas compartidas entre pantallas. Cada recurso se pide una sola vez aunque lo usen
 * varias pantallas, y queda guardado para mostrarlo sin conexión.
 */
import React, { useRef, useSyncExternalStore } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { onlineManager, useQuery } from '@tanstack/react-query';
import { queryKeys } from '../config/queryClient';
import { remindersService } from '../services/remindersService';
import { companiesService } from '../services/companiesService';
import { dashboardService } from '../services/dashboardService';
import { personalTasksService } from '../services/personalTasksService';

export const useRemindersQuery = () =>
  useQuery({ queryKey: queryKeys.reminders, queryFn: () => remindersService.getAll() });

export const useCompaniesQuery = () =>
  useQuery({ queryKey: queryKeys.companies, queryFn: () => companiesService.getAll() });

export const useDashboardQuery = () =>
  useQuery({ queryKey: queryKeys.dashboard, queryFn: () => dashboardService.getDashboard() });

export const usePersonalTasksQuery = () =>
  useQuery({ queryKey: queryKeys.personalTasks, queryFn: () => personalTasksService.getAll() });

export const useCalendarsQuery = () =>
  useQuery({
    queryKey: queryKeys.calendars,
    queryFn: () => companiesService.getAvailableCalendars(),
    // El catálogo de calendarios casi nunca cambia
    staleTime: 24 * 60 * 60 * 1000,
  });

/**
 * Las pestañas siguen montadas al cambiar de una a otra, así que la caché no se entera de que
 * la pantalla vuelve a verse. Al recuperar el foco se refrescan las consultas que estén viejas.
 */
export function useRefetchOnFocus(queries: Array<{ isStale: boolean; refetch: () => unknown }>) {
  const isFirstFocus = useRef(true);
  const queriesRef = useRef(queries);
  queriesRef.current = queries;

  useFocusEffect(
    React.useCallback(() => {
      if (isFirstFocus.current) {
        isFirstFocus.current = false;
        return;
      }
      queriesRef.current.filter(q => q.isStale).forEach(q => q.refetch());
    }, []),
  );
}

export function useIsOnline(): boolean {
  return useSyncExternalStore(
    callback => onlineManager.subscribe(callback),
    () => onlineManager.isOnline(),
  );
}
