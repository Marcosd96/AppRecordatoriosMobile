import notifee, { AndroidImportance } from '@notifee/react-native';
import { Platform, PermissionsAndroid, Linking } from 'react-native';
import { iosItemActionsCategory } from '../notificationActionConfig';
import { PERSONAL_TASKS_CHANNEL_ID, REMINDERS_CHANNEL_ID } from './config';

/*
 * Permisos, canales y ajustes del sistema para las notificaciones
 */

/**
 * Solicita permisos para mostrar notificaciones
 * Esto mostrará el diálogo nativo del sistema operativo
 */
export async function requestPermissions(): Promise<boolean> {
  try {
    // Android 13+ (API 33+) requiere solicitar el permiso explícitamente
    if (Platform.OS === 'android' && Platform.Version >= 33) {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
        {
          title: 'Permisos de Notificaciones',
          message: 'Gesaccol necesita permisos para enviarte notificaciones sobre tus recordatorios fiscales importantes.',
          buttonNeutral: 'Preguntar más tarde',
          buttonNegative: 'Cancelar',
          buttonPositive: 'Permitir',
        }
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    }

    // iOS y Android anterior: notifee muestra el diálogo nativo si hace falta
    const settings = await notifee.requestPermission();
    return settings.authorizationStatus >= 1; // 1 = AUTHORIZED, 2 = PROVISIONAL
  } catch (error) {
    console.error('Error al solicitar permisos de notificación:', error);
    return false;
  }
}

/**
 * Verifica si se tienen permisos para notificaciones
 */
export async function checkPermissions(): Promise<boolean> {
  try {
    const settings = await notifee.getNotificationSettings();
    return settings.authorizationStatus >= 1;
  } catch (error) {
    console.error('Error al verificar permisos:', error);
    return false;
  }
}

export async function warnIfNoPermission(): Promise<void> {
  if (!(await checkPermissions())) {
    console.warn(
      '[Notificaciones] Sin permisos: se programan igualmente y se mostrarán cuando se concedan',
    );
  }
}

/**
 * Crea los canales de notificaciones (Android) y la categoría con los botones (iOS)
 */
export async function createNotificationChannel(): Promise<void> {
  if (Platform.OS === 'ios') {
    // En iOS los botones de las notificaciones se definen por categoría
    await notifee.setNotificationCategories([iosItemActionsCategory]);
  }
  if (Platform.OS === 'android') {
    await notifee.createChannel({
      id: REMINDERS_CHANNEL_ID,
      name: 'Recordatorios Fiscales',
      description: 'Notificaciones para recordatorios fiscales',
      importance: AndroidImportance.HIGH,
      sound: 'alarma_fiscal',
      vibration: true,
      vibrationPattern: [300, 500],
    });

    await notifee.createChannel({
      id: PERSONAL_TASKS_CHANNEL_ID,
      name: 'Tareas Personales',
      description: 'Notificaciones para tareas personales',
      importance: AndroidImportance.HIGH,
      sound: 'alarma_fiscal',
      vibration: true,
      vibrationPattern: [300, 500],
    });
  }
}

/**
 * Abre la configuración de notificaciones de la app
 */
export async function openNotificationSettings(): Promise<void> {
  try {
    await notifee.openNotificationSettings();
  } catch (error) {
    console.error('Error al abrir configuración de notificaciones:', error);
    // Fallback a configuración general de la app
    Linking.openSettings();
  }
}

/**
 * Solicita desactivar la optimización de batería
 * Esto es crucial para que las notificaciones lleguen a tiempo en algunos dispositivos
 */
export async function requestBatteryOptimization(): Promise<void> {
  try {
    if (Platform.OS === 'android') {
      await notifee.openBatteryOptimizationSettings();
    }
  } catch (error) {
    console.error('Error al solicitar optimización de batería:', error);
  }
}

/**
 * Une los IDs indicados con los que notifee tiene programados y cumplen el filtro
 */
export async function withTriggerIdsMatching(
  ids: string[],
  matches: (id: string) => boolean,
): Promise<string[]> {
  try {
    const triggerIds = await notifee.getTriggerNotificationIds();
    return [...new Set([...ids, ...triggerIds.filter(matches)])];
  } catch (error) {
    console.error('Error al consultar notificaciones programadas:', error);
    return ids;
  }
}

/**
 * Cancela los avisos pospuestos ("Posponer 1 h") cuyos datos cumplen el filtro, p. ej. los de
 * un recordatorio o tarea que ya se completó
 */
export async function cancelSnoozes(
  matches: (data: Record<string, unknown>) => boolean,
): Promise<void> {
  try {
    const triggers = await notifee.getTriggerNotifications();
    for (const { notification } of triggers) {
      if (notification.id?.startsWith('snooze_') && matches(notification.data ?? {})) {
        await notifee.cancelNotification(notification.id);
      }
    }
  } catch (error) {
    console.error('Error al cancelar avisos pospuestos:', error);
  }
}
