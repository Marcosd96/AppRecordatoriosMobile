import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert } from 'react-native';
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
  const lastAlertedError = useRef<unknown>(null);

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

  // Avisar del error solo si no hay datos guardados que mostrar
  const { error, data } = dashboardQuery;
  useEffect(() => {
    if (error && !data && lastAlertedError.current !== error) {
      lastAlertedError.current = error;
      console.error('Error al cargar datos del dashboard:', error);
      Alert.alert(
        'Error',
        (error as Error).message || 'No se pudieron cargar los datos.',
      );
    }
  }, [error, data]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([dashboardQuery.refetch(), remindersQuery.refetch()]);
    setRefreshing(false);
  }, [dashboardQuery, remindersQuery]);

  /**
   * Muestra una notificación de prueba y devuelve el mensaje para el usuario
   */
  const sendTestNotification = useCallback(async (): Promise<DashboardMessage> => {
    try {
      // Verificar permisos primero
      const hasPermission = await notificationsService.checkPermissions();
      if (!hasPermission) {
        const granted = await notificationsService.requestPermissions();
        if (!granted) {
          return {
            title: 'Permisos requeridos',
            message:
              'Necesitas conceder permisos de notificación para recibir recordatorios. Puedes activarlos desde la configuración de la app.',
          };
        }
      }

      await notificationsService.displayTestNotification();
      await refreshNotificationStatus();
      return {
        title: 'Éxito',
        message: 'Se envió una notificación de prueba. Deberías verla ahora.',
      };
    } catch (testError: any) {
      console.error('Error al enviar notificación de prueba:', testError);
      return {
        title: 'Error',
        message: testError.message || 'No se pudo enviar la notificación de prueba',
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
  };
}
