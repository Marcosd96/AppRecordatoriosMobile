import notifee, { AndroidImportance, TriggerType } from '@notifee/react-native';
import { Platform, PermissionsAndroid } from 'react-native';
import { Reminder } from '../types';
import AsyncStorage from '@react-native-async-storage/async-storage';

const NOTIFICATION_STORAGE_KEY = '@scheduled_notifications';

/**
 * Servicio para manejar notificaciones locales de recordatorios
 */
class NotificationsService {
  /**
   * Solicita permisos para mostrar notificaciones
   */
  async requestPermissions(): Promise<boolean> {
    try {
      if (Platform.OS === 'android') {
        // Solicitar permisos en Android 13+
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } else {
        // iOS maneja permisos automáticamente
        const settings = await notifee.requestPermission();
        return settings.authorizationStatus >= 1; // 1 = AUTHORIZED, 2 = PROVISIONAL
      }
    } catch (error) {
      console.error('Error al solicitar permisos de notificación:', error);
      return false;
    }
  }

  /**
   * Verifica si se tienen permisos para notificaciones
   */
  async checkPermissions(): Promise<boolean> {
    try {
      const settings = await notifee.getNotificationSettings();
      return settings.authorizationStatus >= 1;
    } catch (error) {
      console.error('Error al verificar permisos:', error);
      return false;
    }
  }

  /**
   * Crea un canal de notificaciones para Android
   */
  async createNotificationChannel() {
    if (Platform.OS === 'android') {
      await notifee.createChannel({
        id: 'reminders',
        name: 'Recordatorios Fiscales',
        description: 'Notificaciones para recordatorios fiscales',
        importance: AndroidImportance.HIGH,
        sound: 'default',
        vibration: true,
        vibrationPattern: [300, 500],
      });
    }
  }

  /**
   * Programa notificaciones diarias para un recordatorio desde 3 días antes hasta el día de vencimiento
   */
  async scheduleReminderNotification(reminder: Reminder): Promise<void> {
    try {
      // Solo programar notificaciones para recordatorios pendientes
      if (reminder.status !== 'pending') {
        return;
      }

      const dueDate = new Date(reminder.dueDate);
      const now = new Date();
      now.setHours(0, 0, 0, 0);

      // No programar notificaciones para fechas pasadas
      if (dueDate < now) {
        return;
      }

      // Crear canal de notificaciones si es necesario
      await this.createNotificationChannel();

      // Calcular días hasta el vencimiento
      const daysUntilDue = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      // Programar notificaciones diarias desde 3 días antes hasta el día de vencimiento
      const notificationIds: string[] = [];
      const startDaysBefore = Math.min(3, daysUntilDue); // Máximo 3 días antes, o menos si faltan menos días

      for (let daysBefore = startDaysBefore; daysBefore >= 0; daysBefore--) {
        const notificationDate = new Date(dueDate);
        notificationDate.setDate(notificationDate.getDate() - daysBefore);
        notificationDate.setHours(9, 0, 0, 0);

        // Solo programar si la fecha es futura
        if (notificationDate >= now) {
          let title: string;
          let body: string;
          let color: string;

          if (daysBefore === 0) {
            // Día de vencimiento
            title = '📅 Recordatorio Fiscal - Vence Hoy';
            body = `${reminder.description} - ${reminder.companyName}\n⚠️ Vence hoy`;
            color = '#dc2626'; // Rojo para urgencia
          } else if (daysBefore === 1) {
            // 1 día antes
            title = '⏰ Recordatorio Fiscal - Mañana';
            body = `${reminder.description} - ${reminder.companyName}\nVence mañana`;
            color = '#f59e0b'; // Amarillo/naranja
          } else if (daysBefore === 2) {
            // 2 días antes
            title = '⏰ Recordatorio Fiscal';
            body = `${reminder.description} - ${reminder.companyName}\nVence en 2 días`;
            color = '#f59e0b'; // Amarillo/naranja
          } else {
            // 3 días antes
            title = '⏰ Recordatorio Fiscal';
            body = `${reminder.description} - ${reminder.companyName}\nVence en 3 días`;
            color = '#2563eb'; // Azul
          }

          const notificationId = `reminder_${reminder.id}_${daysBefore}days`;

          await notifee.createTriggerNotification(
            {
              id: notificationId,
              title: title,
              body: body,
              data: {
                reminderId: reminder.id,
                type: daysBefore === 0 ? 'due' : 'advance',
                daysBefore: daysBefore,
              },
              android: {
                channelId: 'reminders',
                importance: AndroidImportance.HIGH,
                pressAction: {
                  id: 'default',
                },
                smallIcon: 'ic_launcher',
                color: color,
              },
              ios: {
                sound: 'default',
                foregroundPresentationOptions: {
                  alert: true,
                  badge: true,
                  sound: true,
                },
              },
            },
            {
              type: TriggerType.TIMESTAMP,
              timestamp: notificationDate.getTime(),
            }
          );

          notificationIds.push(notificationId);
        }
      }

      // Guardar IDs de notificaciones programadas
      if (notificationIds.length > 0) {
        await this.saveScheduledNotification(reminder.id, notificationIds);
      }
    } catch (error) {
      console.error(`Error al programar notificación para recordatorio ${reminder.id}:`, error);
    }
  }

  /**
   * Cancela todas las notificaciones de un recordatorio
   */
  async cancelReminderNotifications(reminderId: string): Promise<void> {
    try {
      const notificationIds = await this.getScheduledNotificationIds(reminderId);
      
      for (const id of notificationIds) {
        await notifee.cancelNotification(id);
      }

      await this.removeScheduledNotification(reminderId);
    } catch (error) {
      console.error(`Error al cancelar notificaciones del recordatorio ${reminderId}:`, error);
    }
  }

  /**
   * Programa notificaciones para todos los recordatorios pendientes
   */
  async scheduleAllReminders(reminders: Reminder[]): Promise<void> {
    try {
      // Verificar permisos primero
      const hasPermission = await this.checkPermissions();
      if (!hasPermission) {
        const granted = await this.requestPermissions();
        if (!granted) {
          console.warn('Permisos de notificación no concedidos');
          return;
        }
      }

      // Cancelar todas las notificaciones existentes
      await this.cancelAllNotifications();

      // Programar nuevas notificaciones solo para recordatorios pendientes
      const pendingReminders = reminders.filter((r) => r.status === 'pending');
      
      for (const reminder of pendingReminders) {
        await this.scheduleReminderNotification(reminder);
      }

      console.log(`Programadas ${pendingReminders.length} notificaciones de recordatorios`);
    } catch (error) {
      console.error('Error al programar notificaciones:', error);
    }
  }

  /**
   * Cancela todas las notificaciones programadas
   */
  async cancelAllNotifications(): Promise<void> {
    try {
      await notifee.cancelAllNotifications();
      await AsyncStorage.removeItem(NOTIFICATION_STORAGE_KEY);
    } catch (error) {
      console.error('Error al cancelar todas las notificaciones:', error);
    }
  }

  /**
   * Guarda los IDs de notificaciones programadas en AsyncStorage
   */
  private async saveScheduledNotification(
    reminderId: string,
    notificationIds: string[]
  ): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(NOTIFICATION_STORAGE_KEY);
      const notifications = stored ? JSON.parse(stored) : {};
      notifications[reminderId] = notificationIds;
      await AsyncStorage.setItem(NOTIFICATION_STORAGE_KEY, JSON.stringify(notifications));
    } catch (error) {
      console.error('Error al guardar notificación programada:', error);
    }
  }

  /**
   * Obtiene los IDs de notificaciones programadas para un recordatorio
   */
  private async getScheduledNotificationIds(reminderId: string): Promise<string[]> {
    try {
      const stored = await AsyncStorage.getItem(NOTIFICATION_STORAGE_KEY);
      if (!stored) return [];
      const notifications = JSON.parse(stored);
      return notifications[reminderId] || [];
    } catch (error) {
      console.error('Error al obtener IDs de notificaciones:', error);
      return [];
    }
  }

  /**
   * Elimina los IDs de notificaciones programadas para un recordatorio
   */
  private async removeScheduledNotification(reminderId: string): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(NOTIFICATION_STORAGE_KEY);
      if (!stored) return;
      const notifications = JSON.parse(stored);
      delete notifications[reminderId];
      await AsyncStorage.setItem(NOTIFICATION_STORAGE_KEY, JSON.stringify(notifications));
    } catch (error) {
      console.error('Error al eliminar notificación programada:', error);
    }
  }

  /**
   * Muestra una notificación inmediata (para pruebas)
   */
  async displayTestNotification(): Promise<void> {
    try {
      await this.createNotificationChannel();
      
      await notifee.displayNotification({
        title: '🔔 Notificación de Prueba',
        body: 'El sistema de notificaciones está funcionando correctamente',
        android: {
          channelId: 'reminders',
          importance: AndroidImportance.HIGH,
          pressAction: {
            id: 'default',
          },
        },
        ios: {
          sound: 'default',
        },
      });
    } catch (error) {
      console.error('Error al mostrar notificación de prueba:', error);
      throw error;
    }
  }

  /**
   * Obtiene el estado de los permisos de notificación
   */
  async getNotificationStatus(): Promise<{
    hasPermission: boolean;
    authorizationStatus: number;
    scheduledCount: number;
  }> {
    try {
      const settings = await notifee.getNotificationSettings();
      const scheduledNotifications = await notifee.getTriggerNotifications();
      
      return {
        hasPermission: settings.authorizationStatus >= 1,
        authorizationStatus: settings.authorizationStatus,
        scheduledCount: scheduledNotifications.length,
      };
    } catch (error) {
      console.error('Error al obtener estado de notificaciones:', error);
      return {
        hasPermission: false,
        authorizationStatus: 0,
        scheduledCount: 0,
      };
    }
  }

  /**
   * Obtiene todas las notificaciones programadas
   */
  async getScheduledNotifications(): Promise<any[]> {
    try {
      const notifications = await notifee.getTriggerNotifications();
      return notifications;
    } catch (error) {
      console.error('Error al obtener notificaciones programadas:', error);
      return [];
    }
  }

  /**
   * Obtiene la próxima notificación programada
   */
  async getNextNotification(): Promise<{
    exists: boolean;
    title?: string;
    body?: string;
    timestamp?: number;
    date?: Date;
  }> {
    try {
      const notifications = await notifee.getTriggerNotifications();
      
      if (notifications.length === 0) {
        return { exists: false };
      }

      // Ordenar por timestamp y obtener la más próxima
      const sortedNotifications = notifications.sort((a, b) => {
        // El trigger puede ser TimestampTrigger o IntervalTrigger
        const triggerA = (a.trigger as any)?.timestamp || 0;
        const triggerB = (b.trigger as any)?.timestamp || 0;
        return triggerA - triggerB;
      });

      const nextNotification = sortedNotifications[0];
      const timestamp = (nextNotification.trigger as any)?.timestamp;

      if (!timestamp) {
        return { exists: false };
      }

      return {
        exists: true,
        title: nextNotification.notification?.title,
        body: nextNotification.notification?.body,
        timestamp: timestamp,
        date: new Date(timestamp),
      };
    } catch (error) {
      console.error('Error al obtener próxima notificación:', error);
      return { exists: false };
    }
  }
}

export const notificationsService = new NotificationsService();

