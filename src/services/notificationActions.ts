/**
 * Resuelve los botones de las notificaciones ("Completar", "Posponer 1 h") sin abrir la app.
 * Funciona también con la app cerrada: notifee la ejecuta en segundo plano.
 */
import notifee, { Notification, TriggerType } from '@notifee/react-native';
import { queryClient, queryKeys } from '../config/queryClient';
import { remindersService } from './remindersService';
import { personalTasksService } from './personalTasksService';
import { notificationsService } from './notificationsService';
import { ACTION_COMPLETE, ACTION_SNOOZE, SNOOZE_MINUTES } from './notificationActionConfig';

// Prefijo propio: las sincronizaciones cancelan los avisos "reminder_*" y "personal_task_*",
// y un aviso pospuesto no debe desaparecer por eso
const SNOOZE_PREFIX = 'snooze_';

export function snoozedNotificationId(id: string | undefined): string {
  const baseId = (id ?? `${Date.now()}`).replace(new RegExp(`^(${SNOOZE_PREFIX})+`), '');
  return `${SNOOZE_PREFIX}${baseId}`;
}

async function completeReminder(reminderId: string): Promise<void> {
  // El backend solo permite alternar el estado: si ya estaba completado, el cambio
  // lo habría reabierto, así que se deshace
  const { reminder } = await remindersService.toggleStatus(reminderId);
  if (reminder.status !== 'completed') {
    await remindersService.toggleStatus(reminderId);
  }
  await notificationsService.cancelReminderNotifications(reminderId);
  await notificationsService.cancelSnoozes(data => data.reminderId === reminderId);
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: queryKeys.reminders }),
    queryClient.invalidateQueries({ queryKey: queryKeys.dashboard }),
  ]);
}

async function completeTask(taskId: string): Promise<void> {
  await personalTasksService.complete(taskId);
  await notificationsService.cancelPersonalTaskNotifications(taskId);
  await notificationsService.cancelSnoozes(data => data.taskId === taskId);
  // Si es recurrente, el backend ya calculó la próxima ocurrencia: programar su aviso
  const updated = await personalTasksService.getOne(taskId);
  if (updated.status === 'active' && updated.reminderEnabled) {
    await notificationsService.schedulePersonalTaskNotification(updated);
  }
  await queryClient.invalidateQueries({ queryKey: queryKeys.personalTasks });
}

async function snooze(notification: Notification, now: number): Promise<void> {
  await notifee.createTriggerNotification(
    { ...notification, id: snoozedNotificationId(notification.id) },
    {
      type: TriggerType.TIMESTAMP,
      timestamp: now + SNOOZE_MINUTES * 60 * 1000,
      alarmManager: true,
    },
  );
}

async function notifyActionFailed(notification: Notification, error: unknown): Promise<void> {
  const offline = (error as { isNetworkError?: boolean })?.isNetworkError;
  await notifee.displayNotification({
    title: 'No se pudo completar',
    body: offline
      ? 'Sin conexión. Abre Gesaccol para intentarlo de nuevo.'
      : 'Abre Gesaccol para intentarlo de nuevo.',
    data: notification.data,
    android: {
      channelId: notification.android?.channelId ?? 'reminders_v2',
      pressAction: { id: 'default' },
      smallIcon: 'ic_launcher',
    },
  });
}

/**
 * @returns true si la acción se resolvió (la notificación original se retira)
 */
export async function handleNotificationAction(
  actionId: string | undefined,
  notification: Notification | undefined,
  now: number = Date.now(),
): Promise<boolean> {
  if (!notification || (actionId !== ACTION_COMPLETE && actionId !== ACTION_SNOOZE)) {
    return false;
  }
  const data = notification.data ?? {};

  try {
    if (actionId === ACTION_SNOOZE) {
      await snooze(notification, now);
    } else if (typeof data.reminderId === 'string') {
      await completeReminder(data.reminderId);
    } else if (typeof data.taskId === 'string') {
      await completeTask(data.taskId);
    } else {
      return false;
    }
    console.log(`[Notificaciones] Acción "${actionId}" resuelta para ${notification.id}`);
  } catch (error) {
    console.error(`[Notificaciones] Error en la acción "${actionId}":`, error);
    await notifyActionFailed(notification, error);
  }

  // Retirar la notificación también si falló: el aviso de error la sustituye
  if (notification.id) {
    await notifee.cancelDisplayedNotification(notification.id);
  }
  return true;
}
