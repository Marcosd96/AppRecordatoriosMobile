import notifee, { AndroidImportance, TriggerNotification, TriggerType } from '@notifee/react-native';
import { AppState, Platform } from 'react-native';
import { PersonalTask } from '../../types';
import { PERSONAL_TASKS_CHANNEL_ID, REMINDERS_CHANNEL_ID } from './config';
import { androidOptions, formatTaskDate, iosOptions, taskPriorityStyle } from './content';
import { checkPermissions, createNotificationChannel, requestPermissions } from './setup';
import { savePersonalTaskNotificationId } from './storage';

/*
 * Herramientas de la pantalla de diagnóstico: notificaciones de prueba y estado del sistema
 */

const triggerTimestamp = (n: TriggerNotification): number =>
  (n.trigger as { timestamp?: number })?.timestamp || 0;

/**
 * Muestra una notificación inmediata (para pruebas)
 */
export async function displayTestNotification(): Promise<void> {
  try {
    await createNotificationChannel();

    await notifee.displayNotification({
      title: '🔔 Notificación de Prueba',
      body: 'El sistema de notificaciones está funcionando correctamente',
      android: {
        channelId: REMINDERS_CHANNEL_ID,
        importance: AndroidImportance.HIGH,
        pressAction: { id: 'default' },
      },
      ios: {
        sound: 'alarma_fiscal.wav',
      },
    });
  } catch (error) {
    console.error('Error al mostrar notificación de prueba:', error);
    throw error;
  }
}

async function logPersonalTasksChannelState(): Promise<void> {
  if (Platform.OS !== 'android') {
    return;
  }
  try {
    const channel = (await notifee.getChannels()).find(c => c.id === PERSONAL_TASKS_CHANNEL_ID);
    if (!channel) {
      console.warn('⚠️ No se encontró el canal personal-tasks');
    } else if (channel.blocked) {
      console.warn('⚠️ El canal de notificaciones está bloqueado. El usuario debe habilitarlo en la configuración.');
    }
  } catch (error) {
    console.error('Error al verificar canales:', error);
  }
}

/**
 * Programa una notificación de prueba para una tarea personal en X minutos
 * Útil para probar notificaciones sin esperar a la fecha real
 * @param minutesFromNow Minutos desde ahora para programar la notificación (default: 2)
 * @param cancelExisting Cancela la notificación ya programada de la tarea
 */
export async function scheduleTestNotificationForTask(
  task: PersonalTask,
  minutesFromNow: number,
  cancelExisting: (taskId: string) => Promise<void>,
): Promise<void> {
  try {
    if (!(await checkPermissions()) && !(await requestPermissions())) {
      throw new Error('Permisos de notificación no concedidos. Por favor, activa las notificaciones en la configuración de la app.');
    }

    if (!task.reminderEnabled || task.status !== 'active') {
      console.log(
        `No se puede programar notificación de prueba para tarea ${task.id}: ` +
        `reminderEnabled=${task.reminderEnabled}, status=${task.status}`
      );
      return;
    }

    await cancelExisting(task.id);

    const testNotificationDate = new Date(Date.now() + minutesFromNow * 60 * 1000);
    await createNotificationChannel();
    await logPersonalTasksChannelState();

    const { color, emoji } = taskPriorityStyle(task.priority);
    const notificationId = `personal_task_${task.id}_test`;
    const android = { ...androidOptions(PERSONAL_TASKS_CHANNEL_ID, color), showTimestamp: true };

    // En una prueba rápida (menos de 30 segundos) se envía también una inmediata
    // para comprobar que el sistema funciona
    if (minutesFromNow <= 0.5) {
      try {
        const inForeground = Platform.OS === 'android' && AppState.currentState === 'active';
        await notifee.displayNotification({
          id: `${notificationId}_immediate`,
          title: `${emoji} [INMEDIATA] Tarea: ${task.title}`,
          body: 'Esta es una notificación inmediata para verificar que el sistema funciona. La notificación programada llegará en breve.',
          data: {
            taskId: task.id,
            type: 'personal-task',
            isTest: 'true',
            isImmediate: 'true',
          },
          // Con la app en primer plano se fuerza que sea visible
          android: inForeground ? { ...android, visibility: 1, autoCancel: true } : android,
          ios: inForeground ? iosOptions() : iosOptions('alarma_fiscal.wav'),
        });
      } catch (error) {
        console.error('❌ Error al enviar notificación inmediata:', error);
      }
    }

    await notifee.createTriggerNotification(
      {
        id: notificationId,
        title: `${emoji} [PRUEBA] Tarea: ${task.title}`,
        body: task.description
          ? `${task.description.substring(0, 80)}... (Notificación de prueba)`
          : `Tarea programada para ${formatTaskDate(testNotificationDate)} (Notificación de prueba)`,
        data: {
          taskId: task.id,
          type: 'personal-task',
          isTest: 'true',
        },
        android: {
          ...android,
          timestamp: testNotificationDate.getTime(),
          autoCancel: true,
          ongoing: false,
        },
        ios: iosOptions('alarma_fiscal.wav'),
      },
      {
        type: TriggerType.TIMESTAMP,
        timestamp: testNotificationDate.getTime(),
        alarmManager: true, // Usar AlarmManager de Android para precisión exacta
      }
    );

    await savePersonalTaskNotificationId(task.id, notificationId);

    // Verificar que la notificación quedó programada
    const scheduled = await notifee.getTriggerNotifications();
    const found = scheduled.find(n => n.notification?.id === notificationId);
    if (found) {
      const secondsUntilTrigger = Math.round((triggerTimestamp(found) - Date.now()) / 1000);
      console.log(
        `✅ Notificación de PRUEBA programada para tarea ${task.id} en ${secondsUntilTrigger} s. ` +
        `Si no llega, revisa la optimización de batería y que el canal "Tareas Personales" esté habilitado.`
      );
    } else {
      console.warn(
        `⚠️ La notificación se creó pero no aparece en las programadas (ID: ${notificationId}, ` +
        `total programadas: ${scheduled.length})`
      );
    }
  } catch (error) {
    console.error(`❌ Error al programar notificación de prueba para tarea personal ${task.id}:`, error);
    throw error;
  }
}

/**
 * Obtiene el estado de los permisos de notificación
 */
export async function getNotificationStatus(): Promise<{
  hasPermission: boolean;
  authorizationStatus: number;
  scheduledCount: number;
  batteryOptimization: boolean;
}> {
  try {
    const settings = await notifee.getNotificationSettings();
    const scheduledNotifications = await notifee.getTriggerNotifications();
    const batteryOptimization = await notifee.isBatteryOptimizationEnabled();

    return {
      hasPermission: settings.authorizationStatus >= 1,
      authorizationStatus: settings.authorizationStatus,
      scheduledCount: scheduledNotifications.length,
      batteryOptimization,
    };
  } catch (error) {
    console.error('Error al obtener estado de notificaciones:', error);
    return {
      hasPermission: false,
      authorizationStatus: 0,
      scheduledCount: 0,
      batteryOptimization: false,
    };
  }
}

/**
 * Obtiene todas las notificaciones programadas
 */
export async function getScheduledNotifications(): Promise<TriggerNotification[]> {
  try {
    return await notifee.getTriggerNotifications();
  } catch (error) {
    console.error('Error al obtener notificaciones programadas:', error);
    return [];
  }
}

/**
 * Obtiene la próxima notificación programada
 */
export async function getNextNotification(): Promise<{
  exists: boolean;
  title?: string;
  body?: string;
  timestamp?: number;
  date?: Date;
}> {
  try {
    const notifications = await notifee.getTriggerNotifications();
    const next = notifications.sort((a, b) => triggerTimestamp(a) - triggerTimestamp(b))[0];
    const timestamp = next ? triggerTimestamp(next) : 0;

    if (!timestamp) {
      return { exists: false };
    }

    return {
      exists: true,
      title: next.notification?.title,
      body: next.notification?.body,
      timestamp,
      date: new Date(timestamp),
    };
  } catch (error) {
    console.error('Error al obtener próxima notificación:', error);
    return { exists: false };
  }
}
