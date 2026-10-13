import { useCallback, useEffect, useState } from 'react';
import { notificationsService } from '../services/notificationsService';
import { useDashboardQuery, useRefetchOnFocus, useRemindersQuery } from './queries';

export interface NotificationStatus {
  hasPermission: boolean;
  scheduledCount: number;
  nextNotification?: {
    exists: boolean;
    title?: string;
    body?: string;
    date?: Date;
  };
}

export interface DashboardMessage {
  title: string;
  message: string;
}

export interface DashboardResult extends DashboardMessage {
  ok: boolean;
}

const EMPTY_STATS = { total: 0, pending: 0, overdue: 0, upcoming: 0 };

async function fetchNotificationStatus(): Promise<NotificationStatus> {
  const status = await notificationsService.getNotificationStatus();
  const nextNotification = await notificationsService.getNextNotification();
  return {
    hasPermission: status.hasPermission,
    scheduledCount: status.scheduledCount,
    nextNotification: nextNotification.exists
      ? {
          exists: true,
          title: nextNotification.title,
          body: nextNotification.body,
          date: nextNotification.date,
        }
      : { exists: false },
  };
}

/**
 * Datos del panel principal. Se muestran desde la caché (también sin conexión) y se
 * refrescan en segundo plano. Las notificaciones las sincroniza NotificationSync.
 */
export function useDashboard() {
  const dashboardQuery = useDashboardQuery();
  const remindersQuery = useRemindersQuery();
  const [refreshing, setRefreshing] = useState(false);
  const [notificationStatus, setNotificationStatus] = useState<NotificationStatus | null>(null);

  useRefetchOnFocus([dashboardQuery, remindersQuery]);

  const refreshNotificationStatus = useCallback(async () => {
    try {
      setNotificationStatus(await fetchNotificationStatus());
    } catch (statusError) {
      console.error('Error al obtener estado de notificaciones:', statusError);
    }
  }, []);

  

  // El estado de las notificaciones depende de que terminen de sincronizarse los recordatorios.
  // syncReminders va en cola detrás de la de NotificationSync y, si no hay cambios, no hace nada.
  const reminders = remindersQuery.data;
  useEffect(() => {
    if (!reminders) {
      return;
    }
    notificationsService
      .syncReminders(reminders)
      .catch(syncError => console.error('[Dashboard] Error sincronizando notificaciones:', syncError))
      .finally(refreshNotificationStatus);
  }, [reminders, refreshNotificationStatus]);

  // Error de carga solo si no hay datos guardados: la pantalla lo muestra con "Reintentar"
  const { error, data } = dashboardQuery;
  const loadError =
    error && !data ? (error as Error).message || 'Inténtalo de nuevo en unos momentos.' : null;

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([dashboardQuery.refetch(), remindersQuery.refetch()]);
    setRefreshing(false);
  }, [dashboardQuery, remindersQuery]);

  /**
   * Muestra una notificación de prueba y devuelve el mensaje para el usuario
   */
  const sendTestNotification = useCallback(async (): Promise<DashboardResult> => {
    try {
      // Verificar permisos primero
      const hasPermission = await notificationsService.checkPermissions();
      if (!hasPermission) {
        const granted = await notificationsService.requestPermissions();
        if (!granted) {
          return {
            ok: false,
            title: 'Permisos requeridos',
            message:
              'Necesitas conceder permisos de notificación para recibir recordatorios. Puedes activarlos desde la configuración de la app.',
          };
        }
      }

      await notificationsService.displayTestNotification();
      await refreshNotificationStatus();
      return {
        ok: true,
        title: 'Notificación enviada',
        message: 'Notificación de prueba enviada. Deberías verla ahora.',
      };
    } catch (testError: any) {
      console.error('Error al enviar notificación de prueba:', testError);
      return {
        ok: false,
        title: 'No se pudo enviar la notificación',
        message: testError.message || 'Inténtalo de nuevo.',
      };
    }
  }, [refreshNotificationStatus]);

  return {
    upcomingReminders: data?.upcomingReminders ?? [],
    stats: data?.stats ?? EMPTY_STATS,
    companiesCount: data?.companiesCount ?? 0,
    refreshing,
    // Solo se muestra la pantalla de carga si no hay nada guardado
    // (y se está pidiendo: sin conexión y sin datos se muestra la pantalla vacía, no un spinner eterno)
    loading: dashboardQuery.isPending && dashboardQuery.fetchStatus === 'fetching',
    notificationStatus,
    onRefresh,
    sendTestNotification,
    /** Error de carga (solo si no hay datos guardados) */
    loadError,
    retrying: dashboardQuery.isFetching,
    retry: dashboardQuery.refetch,
  };
}
