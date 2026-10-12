import notifee, { TriggerType } from '@notifee/react-native';
import { PersonalTask } from '../../types';
import {
  MAX_PERSONAL_TASK_TRIGGERS,
  PERSONAL_TASKS_CHANNEL_ID,
  isPersonalTaskTriggerId,
} from './config';
import { androidOptions, formatTaskDate, iosOptions, taskPriorityStyle } from './content';
import { calculateNextValidOccurrence } from './recurrence';
import {
  cancelSnoozes,
  createNotificationChannel,
  warnIfNoPermission,
  withTriggerIdsMatching,
} from './setup';
import {
  clearPersonalTaskIds,
  getPersonalTaskNotificationId,
  hasImmediateNotificationToday,
  markImmediateNotificationSent,
  readPersonalTaskIds,
  removePersonalTaskNotificationId,
  savePersonalTaskNotificationId,
} from './storage';

const DEFAULT_REMINDER_MINUTES = 60;

function minutesBefore(date: Date, minutes: number): Date {
  const result = new Date(date);
  result.setMinutes(result.getMinutes() - minutes);
  return result;
}

/**
 * Envía una notificación inmediata para una tarea personal
 * Se usa cuando el tiempo de recordatorio ya pasó pero la tarea es futura
 */
async function sendImmediatePersonalTaskNotification(task: PersonalTask): Promise<void> {
  try {
    await notifee.displayNotification({
      title: `⚠️ Recordatorio: ${task.title}`,
      body: `Este recordatorio estaba pendiente. ${task.description || ''}`,
      data: {
        taskId: task.id,
        type: 'personal-task',
        isImmediate: 'true',
      },
      android: androidOptions(PERSONAL_TASKS_CHANNEL_ID, taskPriorityStyle(task.priority).color),
      ios: iosOptions(),
    });
  } catch (error) {
    console.error('Error al enviar notificación inmediata de tarea personal:', error);
  }
}

/**
 * Programa la notificación de una tarea personal (reminderMinutes antes de la tarea)
 * @returns true si se creó una notificación programada
 */
export async function schedulePersonalTaskNotification(task: PersonalTask): Promise<boolean> {
  try {
    // Solo programar notificaciones para tareas activas con recordatorio
    if (!task.reminderEnabled || task.status !== 'active') {
      return false;
    }

    // Determinar fecha objetivo (nextOccurrence tiene prioridad)
    let targetDate = new Date(task.nextOccurrence || task.startDate);
    if (isNaN(targetDate.getTime())) {
      return false;
    }

    const now = new Date();
    const reminderMinutes = task.reminderMinutes || DEFAULT_REMINDER_MINUTES;
    let notificationDate = minutesBefore(targetDate, reminderMinutes);

    if (notificationDate.getTime() <= now.getTime()) {
      // Caso 1: La tarea es recurrente -> Buscar la siguiente ocurrencia válida
      if (task.isRecurring && task.recurrenceType && task.recurrenceType !== 'once') {
        const nextValidDate = calculateNextValidOccurrence(
          targetDate,
          task.recurrenceType,
          task.recurrenceInterval || 1,
          now,
          reminderMinutes
        );
        if (!nextValidDate) {
          console.warn(`⚠️ No se encontró una ocurrencia futura válida para la tarea ${task.id}`);
          return false;
        }
        targetDate = nextValidDate;
        notificationDate = minutesBefore(targetDate, reminderMinutes);
        console.log(`🔄 Tarea recurrente ${task.id} reprogramada para: ${notificationDate.toISOString()}`);
      }
      // Caso 2: La tarea no es recurrente pero la fecha de la tarea es futura
      // Ejemplo: Tarea para mañana a las 8am, recordatorio 24h antes (hoy 8am), pero son las 9am
      else if (targetDate.getTime() > now.getTime()) {
        // Avisar de que el recordatorio se pasó, pero solo una vez al día por ocurrencia:
        // cada sincronización completa (p. ej. al abrir la app) volvería a enviarlo
        const immediateKey = `task:${task.id}:${targetDate.getTime()}`;
        if (!(await hasImmediateNotificationToday(immediateKey))) {
          console.log(`⚠️ Recordatorio pasado para tarea futura ${task.id}. Enviando inmediata.`);
          await sendImmediatePersonalTaskNotification(task);
          await markImmediateNotificationSent(immediateKey);
        }
        return false;
      }
      // Caso 3: La tarea ya pasó y no es recurrente -> No hacer nada
      else {
        return false;
      }
    }

    await createNotificationChannel();

    const { color, emoji } = taskPriorityStyle(task.priority);
    const notificationId = `personal_task_${task.id}`;

    await notifee.createTriggerNotification(
      {
        id: notificationId,
        title: `${emoji} Tarea: ${task.title}`,
        body: task.description
          ? task.description.substring(0, 100)
          : `Tarea programada para ${formatTaskDate(targetDate)}`,
        data: {
          taskId: task.id,
          type: 'personal-task',
        },
        android: androidOptions(PERSONAL_TASKS_CHANNEL_ID, color),
        ios: iosOptions('default'),
      },
      {
        type: TriggerType.TIMESTAMP,
        timestamp: notificationDate.getTime(),
        alarmManager: true, // Usar AlarmManager de Android para precisión exacta
      }
    );

    await savePersonalTaskNotificationId(task.id, notificationId);

    console.log(
      `✅ Notificación programada para tarea personal ${task.id} ` +
      `(${task.title}) en ${notificationDate.toISOString()}`
    );
    return true;
  } catch (error) {
    console.error(`Error al programar notificación para tarea personal ${task.id}:`, error);
    return false;
  }
}

/**
 * Cancela la notificación de una tarea personal
 */
export async function cancelPersonalTaskNotifications(taskId: string): Promise<void> {
  try {
    const notificationId = await getPersonalTaskNotificationId(taskId);
    if (notificationId) {
      await notifee.cancelNotification(notificationId);
    }
    await removePersonalTaskNotificationId(taskId);
  } catch (error) {
    console.error(`Error al cancelar notificaciones de la tarea personal ${taskId}:`, error);
  }
}

/**
 * Cancela todas las notificaciones de tareas personales (no toca las de prueba)
 */
export async function cancelAllPersonalTaskNotifications(): Promise<void> {
  try {
    const stored = Object.values(await readPersonalTaskIds());
    const ids = await withTriggerIdsMatching(stored, isPersonalTaskTriggerId);
    for (const id of ids) {
      await notifee.cancelNotification(id);
    }
    await clearPersonalTaskIds();
  } catch (error) {
    console.error('Error al cancelar todas las notificaciones de tareas personales:', error);
  }
}

/**
 * Reprograma las notificaciones de todas las tareas personales activas con recordatorio
 */
export async function scheduleAllPersonalTasks(tasks: PersonalTask[]): Promise<void> {
  try {
    // Se programan aunque falten permisos (ver scheduleAllReminders)
    await warnIfNoPermission();

    await cancelAllPersonalTaskNotifications();

    // Empezar por las más próximas para que no queden fuera por el límite
    const taskDate = (t: PersonalTask) => new Date(t.nextOccurrence || t.startDate).getTime();
    const activeTasksWithReminders = tasks
      .filter(t => t.status === 'active' && t.reminderEnabled)
      .sort((a, b) => taskDate(a) - taskDate(b));

    let scheduledCount = 0;
    for (const task of activeTasksWithReminders) {
      if (scheduledCount >= MAX_PERSONAL_TASK_TRIGGERS) {
        break;
      }
      if (await schedulePersonalTaskNotification(task)) {
        scheduledCount++;
      }
    }

    // Los avisos pospuestos de tareas que ya no están activas sobran
    const activeIds = new Set(activeTasksWithReminders.map(t => t.id));
    await cancelSnoozes(data => typeof data.taskId === 'string' && !activeIds.has(data.taskId));

    console.log(
      `Programadas ${scheduledCount} notificaciones para ${activeTasksWithReminders.length} tareas personales ` +
      `(límite: ${MAX_PERSONAL_TASK_TRIGGERS})`
    );
  } catch (error) {
    console.error('Error al programar notificaciones de tareas personales:', error);
  }
}
