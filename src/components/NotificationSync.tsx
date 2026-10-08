import { useEffect } from 'react';
import { notificationsService } from '../services/notificationsService';
import { usePersonalTasksQuery, useRemindersQuery } from '../hooks/queries';

/**
 * Único lugar que mantiene las notificaciones al día: cada vez que cambian los recordatorios
 * o las tareas en la caché (venga el cambio de la pantalla que venga), se sincronizan.
 * Se monta una sola vez mientras hay sesión iniciada. No dibuja nada.
 */
export default function NotificationSync() {
  const { data: reminders } = useRemindersQuery();
  const { data: tasks } = usePersonalTasksQuery();

  useEffect(() => {
    notificationsService.createNotificationChannel().catch(error =>
      console.error('[Notificaciones] Error creando canales:', error),
    );
  }, []);

  useEffect(() => {
    if (reminders) {
      notificationsService.syncReminders(reminders).catch(error =>
        console.error('[Notificaciones] Error sincronizando recordatorios:', error),
      );
    }
  }, [reminders]);

  useEffect(() => {
    if (tasks) {
      notificationsService.syncPersonalTasks(tasks).catch(error =>
        console.error('[Notificaciones] Error sincronizando tareas:', error),
      );
    }
  }, [tasks]);

  return null;
}
