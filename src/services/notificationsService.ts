import notifee from '@notifee/react-native';
import { Reminder, PersonalTask } from '../types';
import * as diagnostics from './notifications/diagnostics';
import * as personalTasks from './notifications/personalTasks';
import * as reminders from './notifications/reminders';
import * as setup from './notifications/setup';
import { clearAllNotificationRecords } from './notifications/storage';
import {
  SyncRecord,
  isSyncFresh,
  personalTaskFingerprint,
  reminderFingerprint,
} from './notifications/syncState';

export { MAX_REMINDER_TRIGGERS, MAX_PERSONAL_TASK_TRIGGERS } from './notifications/config';
export { isSyncFresh, reminderFingerprint, personalTaskFingerprint };

/**
 * Punto de entrada de las notificaciones locales de recordatorios y tareas personales.
 * La lógica vive en ./notifications; esta clase coordina las sincronizaciones para que
 * no se pisen entre sí y evita reprogramar cuando los datos no han cambiado.
 */
class NotificationsService {
  // Las sincronizaciones se encadenan para que dos pantallas no cancelen y reprogramen a la vez
  private syncQueue: Promise<unknown> = Promise.resolve();
  private lastReminderSync: SyncRecord | null = null;
  private lastPersonalTaskSync: SyncRecord | null = null;

  private runExclusive<T>(task: () => Promise<T>): Promise<T> {
    const result = this.syncQueue.then(task, task);
    this.syncQueue = result.catch(() => undefined);
    return result;
  }

  /**
   * Punto de entrada único para mantener programadas las notificaciones de recordatorios.
   * Si los datos no cambiaron desde la última sincronización reciente, no hace nada.
   * @param options.sendImmediate Envía avisos inmediatos (fuerza la sincronización)
   * @param options.force Reprograma aunque los datos no hayan cambiado
   */
  syncReminders(
    items: Reminder[],
    { sendImmediate = false, force = false }: { sendImmediate?: boolean; force?: boolean } = {},
  ): Promise<void> {
    return this.runExclusive(async () => {
      const fingerprint = reminderFingerprint(items);
      if (!sendImmediate && !force && isSyncFresh(this.lastReminderSync, fingerprint)) {
        console.log('[Notificaciones] Recordatorios sin cambios: no se reprograman');
        return;
      }
      await reminders.scheduleAllReminders(items, sendImmediate);
      this.lastReminderSync = { fingerprint, at: Date.now() };
    });
  }

  /**
   * Punto de entrada único para mantener programadas las notificaciones de tareas personales.
   * Si los datos no cambiaron desde la última sincronización reciente, no hace nada.
   */
  syncPersonalTasks(
    tasks: PersonalTask[],
    { force = false }: { force?: boolean } = {},
  ): Promise<void> {
    return this.runExclusive(async () => {
      const fingerprint = personalTaskFingerprint(tasks);
      if (!force && isSyncFresh(this.lastPersonalTaskSync, fingerprint)) {
        console.log('[Notificaciones] Tareas sin cambios: no se reprograman');
        return;
      }
      await personalTasks.scheduleAllPersonalTasks(tasks);
      this.lastPersonalTaskSync = { fingerprint, at: Date.now() };
    });
  }

  /*
   * Acciones sobre un solo elemento. Pasan por la misma cola que las sincronizaciones para no
   * intercalarse con ellas, y olvidan la última sincronización para que la siguiente compare
   * de nuevo con lo que hay realmente programado.
   */

  /**
   * Programa las notificaciones de un recordatorio (desde 3 días antes hasta el vencimiento)
   * @returns Cantidad de notificaciones programadas creadas
   */
  scheduleReminderNotification(
    reminder: Reminder,
    sendImmediate: boolean = false,
    maxTriggers: number = Infinity
  ): Promise<number> {
    return this.runExclusive(async () => {
      this.lastReminderSync = null;
      return reminders.scheduleReminderNotification(reminder, sendImmediate, maxTriggers);
    });
  }

  /**
   * Cancela todas las notificaciones de un recordatorio
   */
  cancelReminderNotifications(reminderId: string): Promise<void> {
    return this.runExclusive(async () => {
      this.lastReminderSync = null;
      await reminders.cancelReminderNotifications(reminderId);
    });
  }

  /**
   * Programa la notificación de una tarea personal
   * @returns true si se creó una notificación programada
   */
  schedulePersonalTaskNotification(task: PersonalTask): Promise<boolean> {
    return this.runExclusive(async () => {
      this.lastPersonalTaskSync = null;
      return personalTasks.schedulePersonalTaskNotification(task);
    });
  }

  /**
   * Cancela las notificaciones de una tarea personal
   */
  cancelPersonalTaskNotifications(taskId: string): Promise<void> {
    return this.runExclusive(async () => {
      this.lastPersonalTaskSync = null;
      await personalTasks.cancelPersonalTaskNotifications(taskId);
    });
  }

  /**
   * Cancela todas las notificaciones programadas (TODOS LOS TIPOS)
   * ⚠️ CUIDADO: Esto cancela notificaciones de recordatorios Y tareas personales
   * Usar solo cuando sea necesario limpiar todo
   */
  cancelAllNotifications(): Promise<void> {
    // En la cola: una sincronización en curso no puede volver a crear avisos después de esto
    return this.runExclusive(async () => {
      try {
        // En Android las alarmas siguen apareciendo en `dumpsys alarm`, pero notifee borra su
        // registro y, al dispararse, no muestra nada.
        await notifee.cancelAllNotifications();
        this.lastReminderSync = null;
        this.lastPersonalTaskSync = null;
        await clearAllNotificationRecords();
      } catch (error) {
        console.error('Error al cancelar todas las notificaciones:', error);
      }
    });
  }

  /**
   * Programa una notificación de prueba para una tarea personal en X minutos
   */
  scheduleTestNotificationForTask(task: PersonalTask, minutesFromNow: number = 2): Promise<void> {
    return diagnostics.scheduleTestNotificationForTask(task, minutesFromNow, taskId =>
      this.cancelPersonalTaskNotifications(taskId),
    );
  }

  // Reprogramación completa sin pasar por la cola; la app usa syncReminders/syncPersonalTasks
  scheduleAllReminders = reminders.scheduleAllReminders;
  scheduleAllPersonalTasks = personalTasks.scheduleAllPersonalTasks;

  cancelSnoozes = setup.cancelSnoozes;
  requestPermissions = setup.requestPermissions;
  checkPermissions = setup.checkPermissions;
  createNotificationChannel = setup.createNotificationChannel;
  openNotificationSettings = setup.openNotificationSettings;
  requestBatteryOptimization = setup.requestBatteryOptimization;
  displayTestNotification = diagnostics.displayTestNotification;
  getNotificationStatus = diagnostics.getNotificationStatus;
  getScheduledNotifications = diagnostics.getScheduledNotifications;
  getNextNotification = diagnostics.getNextNotification;
}

export const notificationsService = new NotificationsService();
