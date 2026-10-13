import { useCallback, useMemo, useState } from 'react';
import { buildAgenda, summarizeAgenda } from '../components/dashboard/agenda';
import { buildHistory } from '../components/history/historyStats';
import { usePersonalTasksQuery } from './queries';
import { useNotificationStatus } from './useNotificationStatus';
import { useReminders } from './useReminders';

/**
 * Datos de Inicio: lo que hay que hacer (vencido, esta semana, tareas de hoy), el resumen
 * del mes y si las notificaciones tienen un problema. Todo sale de la caché compartida con
 * las demás pestañas, así que las cifras coinciden con las de Recordatorios.
 */
export function useHome() {
  const reminders = useReminders();
  const tasksQuery = usePersonalTasksQuery();
  const { status: notificationStatus } = useNotificationStatus();
  const [refreshing, setRefreshing] = useState(false);

  const tasks = useMemo(() => tasksQuery.data ?? [], [tasksQuery.data]);
  const agenda = useMemo(() => buildAgenda(reminders.reminders, tasks), [reminders.reminders, tasks]);

  const completedThisMonth = useMemo(() => {
    const { months } = buildHistory(reminders.reminders, tasks);
    const month = months[months.length - 1];
    return month.remindersOnTime + month.remindersLate + month.taskCompletions;
  }, [reminders.reminders, tasks]);

  const { onRefresh: refreshReminders } = reminders;
  const { refetch: refetchTasks } = tasksQuery;
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refreshReminders(), refetchTasks()]);
    setRefreshing(false);
  }, [refreshReminders, refetchTasks]);

  return {
    agenda,
    summary: summarizeAgenda(agenda),
    hasCompanies: reminders.companies.length > 0,
    hasReminders: reminders.reminders.length > 0,
    completedThisMonth,
    /** Solo se avisa en Inicio si falta el permiso; el detalle está en Ajustes */
    notificationsBlocked: notificationStatus !== null && !notificationStatus.hasPermission,
    loading: reminders.loading,
    loadError: reminders.loadError,
    retrying: reminders.retrying,
    retry: reminders.retry,
    refreshing,
    onRefresh,
    reminders: reminders.reminders,
    togglingIds: reminders.togglingIds,
    toggleReminder: reminders.toggleReminder,
  };
}
