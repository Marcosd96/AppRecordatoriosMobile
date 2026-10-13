import { useCallback, useEffect, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { notificationsService } from '../services/notificationsService';
import { useRemindersQuery } from './queries';

export interface NotificationStatus {
  hasPermission: boolean;
  scheduledCount: number;
}

/**
 * Permiso de notificaciones y avisos programados. Se actualiza al volver a la pantalla
 * (el usuario puede haber cambiado el permiso en Ajustes del sistema) y al cambiar los
 * recordatorios, cuando NotificationSync termina de reprogramarlos.
 */
export function useNotificationStatus() {
  const [status, setStatus] = useState<NotificationStatus | null>(null);
  const reminders = useRemindersQuery().data;

  const refresh = useCallback(async () => {
    try {
      const current = await notificationsService.getNotificationStatus();
      setStatus({ hasPermission: current.hasPermission, scheduledCount: current.scheduledCount });
    } catch (error) {
      console.error('Error al obtener estado de notificaciones:', error);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  // syncReminders va en cola detrás de la de NotificationSync y, si no hay cambios, no hace nada
  useEffect(() => {
    if (!reminders) {
      return;
    }
    notificationsService
      .syncReminders(reminders)
      .catch(error => console.error('Error sincronizando notificaciones:', error))
      .finally(refresh);
  }, [reminders, refresh]);

  return { status, refresh };
}
