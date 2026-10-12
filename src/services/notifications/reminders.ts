import notifee, { TriggerType } from '@notifee/react-native';
import { Reminder } from '../../types';
import { MAX_REMINDER_TRIGGERS, REMINDERS_CHANNEL_ID, isReminderTriggerId } from './config';
import { androidOptions, iosOptions, reminderContent } from './content';
import {
  cancelSnoozes,
  createNotificationChannel,
  warnIfNoPermission,
  withTriggerIdsMatching,
} from './setup';
import {
  cleanOldImmediateNotifications,
  clearReminderIds,
  getReminderNotificationIds,
  hasImmediateNotificationToday,
  markImmediateNotificationSent,
  readReminderIds,
  removeReminderNotificationIds,
  saveReminderNotificationIds,
} from './storage';

const DAY_MS = 1000 * 60 * 60 * 24;
const REMINDER_SOUND_IOS = 'alarma_fiscal.wav';

function startOfDay(date: Date): Date {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
}

/**
 * Programa notificaciones diarias para un recordatorio desde 3 días antes hasta el día de vencimiento
 * @param sendImmediate Si es true, envía notificación inmediata si aplica. Si es false, solo programa notificaciones futuras.
 * @param maxTriggers Máximo de notificaciones programadas a crear para este recordatorio
 * @returns Cantidad de notificaciones programadas creadas
 */
export async function scheduleReminderNotification(
  reminder: Reminder,
  sendImmediate: boolean = false,
  maxTriggers: number = Infinity
): Promise<number> {
  try {
    // Solo programar notificaciones para recordatorios pendientes
    if (reminder.status !== 'pending') {
      return 0;
    }

    const dueDate = new Date(reminder.dueDate);
    const now = new Date();
    // Diferencia en días completos, comparando a medianoche
    const daysUntilDue = Math.floor(
      (startOfDay(dueDate).getTime() - startOfDay(now).getTime()) / DAY_MS,
    );

    // No programar notificaciones para fechas pasadas
    if (daysUntilDue < 0) {
      return 0;
    }

    await createNotificationChannel();

    const hasPassed9AM = now.getHours() > 9 || (now.getHours() === 9 && now.getMinutes() > 0);

    // Aviso inmediato: solo si se pide, vence en los próximos 3 días, ya pasaron las 9 AM
    // (la hora de los avisos programados) y no se ha enviado ya hoy
    const shouldSendImmediateNotification =
      sendImmediate &&
      daysUntilDue <= 3 &&
      hasPassed9AM &&
      !(await hasImmediateNotificationToday(reminder.id));

    if (shouldSendImmediateNotification) {
      const { title, body, color } = reminderContent(reminder, daysUntilDue, true);
      await notifee.displayNotification({
        id: `reminder_${reminder.id}_immediate`,
        title,
        body,
        data: {
          reminderId: reminder.id,
          type: 'immediate',
          daysUntilDue,
        },
        android: androidOptions(REMINDERS_CHANNEL_ID, color),
        ios: iosOptions(REMINDER_SOUND_IOS),
      });

      await markImmediateNotificationSent(reminder.id);
      console.log(`Notificación inmediata enviada para recordatorio ${reminder.id} (vence en ${daysUntilDue} días)`);
    }

    // Programar notificaciones diarias a las 9 AM desde 3 días antes hasta el día de vencimiento
    const notificationIds: string[] = [];

    for (let daysBefore = Math.min(3, daysUntilDue); daysBefore >= 0; daysBefore--) {
      if (notificationIds.length >= maxTriggers) {
        break;
      }

      const notificationDate = new Date(dueDate);
      notificationDate.setDate(notificationDate.getDate() - daysBefore);
      notificationDate.setHours(9, 0, 0, 0);

      // Si ya se envió el aviso inmediato, sobra el programado para hoy
      const coveredByImmediate = daysBefore === 0 && hasPassed9AM && shouldSendImmediateNotification;
      if (notificationDate.getTime() <= now.getTime() || coveredByImmediate) {
        continue;
      }

      const { title, body, color } = reminderContent(reminder, daysBefore, false);
      const notificationId = `reminder_${reminder.id}_${daysBefore}days`;

      await notifee.createTriggerNotification(
        {
          id: notificationId,
          title,
          body,
          data: {
            reminderId: reminder.id,
            type: daysBefore === 0 ? 'due' : 'advance',
            daysBefore,
          },
          android: androidOptions(REMINDERS_CHANNEL_ID, color),
          ios: iosOptions(REMINDER_SOUND_IOS),
        },
        {
          type: TriggerType.TIMESTAMP,
          timestamp: notificationDate.getTime(),
          alarmManager: true, // Usar AlarmManager de Android para precisión exacta
        }
      );

      notificationIds.push(notificationId);
    }

    if (notificationIds.length > 0) {
      await saveReminderNotificationIds(reminder.id, notificationIds);
    }
    return notificationIds.length;
  } catch (error) {
    console.error(`Error al programar notificación para recordatorio ${reminder.id}:`, error);
    return 0;
  }
}

/**
 * Cancela todas las notificaciones de un recordatorio
 */
export async function cancelReminderNotifications(reminderId: string): Promise<void> {
  try {
    for (const id of await getReminderNotificationIds(reminderId)) {
      await notifee.cancelNotification(id);
    }
    await removeReminderNotificationIds(reminderId);
  } catch (error) {
    console.error(`Error al cancelar notificaciones del recordatorio ${reminderId}:`, error);
  }
}

/**
 * Cancela solo las notificaciones de recordatorios (no toca las de tareas personales)
 */
export async function cancelAllReminderNotifications(): Promise<void> {
  try {
    const storedIds = Object.values(await readReminderIds()).flat();

    // Incluir también las que notifee tiene programadas aunque falten en el storage
    // (p. ej. por una sincronización interrumpida), para que no queden huérfanas
    const ids = await withTriggerIdsMatching(storedIds, isReminderTriggerId);
    for (const id of ids) {
      await notifee.cancelNotification(id);
    }

    await clearReminderIds();
    console.log('Canceladas todas las notificaciones de recordatorios (sin afectar tareas personales)');
  } catch (error) {
    console.error('Error al cancelar notificaciones de recordatorios:', error);
  }
}

/**
 * Reprograma las notificaciones de todos los recordatorios pendientes
 * @param sendImmediate Si es true, envía notificaciones inmediatas para recordatorios dentro de 3 días
 */
export async function scheduleAllReminders(
  reminders: Reminder[],
  sendImmediate: boolean = false,
): Promise<void> {
  try {
    // Se programan aunque falten permisos: el sistema no las muestra mientras tanto, y en
    // cuanto el usuario los conceda empiezan a llegar. Pedirlos es cosa de la interfaz.
    await warnIfNoPermission();

    await cleanOldImmediateNotifications();
    await cancelAllReminderNotifications();

    // Empezar por los que vencen antes para que no queden fuera por el límite
    const pendingReminders = reminders
      .filter(r => r.status === 'pending')
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

    let scheduledCount = 0;
    for (const reminder of pendingReminders) {
      scheduledCount += await scheduleReminderNotification(
        reminder,
        sendImmediate,
        MAX_REMINDER_TRIGGERS - scheduledCount
      );
    }

    // Los avisos pospuestos de recordatorios que ya no están pendientes sobran
    const pendingIds = new Set(pendingReminders.map(r => r.id));
    await cancelSnoozes(data => typeof data.reminderId === 'string' && !pendingIds.has(data.reminderId));

    console.log(
      `Programadas ${scheduledCount} notificaciones para ${pendingReminders.length} recordatorios ` +
      `(límite: ${MAX_REMINDER_TRIGGERS}, inmediatas: ${sendImmediate})`
    );
  } catch (error) {
    console.error('Error al programar notificaciones:', error);
  }
}
