import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Reminder } from '../types';
import { dashboardService } from '../services/dashboardService';
import { healthService } from '../services/healthService';
import { remindersService } from '../services/remindersService';
import { notificationsService } from '../services/notificationsService';

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
 * Datos del panel principal. Además mantiene programadas las notificaciones de todos
 * los recordatorios (importante si hay empresas creadas desde el proyecto web).
 */
export function useDashboard() {
  const [upcomingReminders, setUpcomingReminders] = useState<Reminder[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    overdue: 0,
    upcoming: 0,
  });
  const [companiesCount, setCompaniesCount] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [notificationStatus, setNotificationStatus] = useState<NotificationStatus | null>(null);
  const isInitialMount = useRef(true);

  const refreshNotificationStatus = useCallback(async () => {
    try {
      setNotificationStatus(await fetchNotificationStatus());
    } catch (error) {
      console.error('Error al obtener estado de notificaciones:', error);
    }
  }, []);

  const loadData = useCallback(async () => {
    try {
      // Primero verificar conectividad
      try {
        await healthService.check();
        console.log('[Dashboard] Conexión con servidor OK');
      } catch (healthError: any) {
        console.error('[Dashboard] Error de conectividad:', healthError);
        Alert.alert(
          'Error de Conexión',
          `No se pudo conectar al servidor:\n\n${healthError.message}\n\n` +
            `Verifica:\n` +
            `1. Tu conexión a internet\n` +
            `2. Que la URL sea correcta\n` +
            `3. Que el servidor esté funcionando`,
        );
        return;
      }

      // Luego cargar datos del dashboard
      const dashboardData = await dashboardService.getDashboard();
      setStats(dashboardData.stats);
      setUpcomingReminders(dashboardData.upcomingReminders);
      setCompaniesCount(dashboardData.companiesCount);

      // Asegurar que las notificaciones estén programadas después de cargar datos
      try {
        const allReminders = await remindersService.getAll();
        await notificationsService.syncReminders(allReminders);
      } catch (notifError) {
        console.error('[Dashboard] Error programando notificaciones:', notifError);
        // No interrumpir el flujo si falla la programación de notificaciones
      }
    } catch (error: any) {
      console.error('Error al cargar datos del dashboard:', error);
      Alert.alert('Error', error.message || 'No se pudieron cargar los datos.');
    } finally {
      await refreshNotificationStatus();
      setLoading(false);
      setRefreshing(false);
    }
  }, [refreshNotificationStatus]);

  useEffect(() => {
    const initialize = async () => {
      try {
        await notificationsService.createNotificationChannel();
        const hasPermission = await notificationsService.checkPermissions();
        if (!hasPermission) {
          await notificationsService.requestPermissions();
        }
      } catch (error) {
        console.error('[Dashboard] Error inicializando notificaciones:', error);
      }
      await loadData();
      // Marcar que la carga inicial se completó después de que termine
      isInitialMount.current = false;
    };

    initialize();
  }, [loadData]);

  // Recargar datos cuando la pantalla recibe el foco (evitar doble carga al inicio)
  useFocusEffect(
    React.useCallback(() => {
      if (!isInitialMount.current) {
        loadData();
      }
    }, [loadData]),
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
  }, [loadData]);

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
    } catch (error: any) {
      console.error('Error al enviar notificación de prueba:', error);
      return {
        title: 'Error',
        message: error.message || 'No se pudo enviar la notificación de prueba',
      };
    }
  }, [refreshNotificationStatus]);

  return {
    upcomingReminders,
    stats,
    companiesCount,
    refreshing,
    loading,
    notificationStatus,
    onRefresh,
    sendTestNotification,
  };
}
