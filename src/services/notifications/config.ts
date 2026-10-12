import { Platform } from 'react-native';

export const REMINDERS_CHANNEL_ID = 'reminders_v2';
export const PERSONAL_TASKS_CHANNEL_ID = 'personal-tasks_v2';

export const REMINDER_IDS_STORAGE_KEY = '@scheduled_notifications';
export const PERSONAL_TASK_IDS_STORAGE_KEY = '@scheduled_personal_task_notifications';
export const IMMEDIATE_NOTIFICATIONS_TODAY_KEY = '@immediate_notifications_today';

/**
 * Máximo de notificaciones programadas por tipo.
 * iOS solo conserva 64 pendientes por app y descarta el resto sin avisar; Android admite
 * unas 500 alarmas por app. Se dejan huecos libres para las de prueba. Como la app
 * reprograma todo al abrirse, las que quedan fuera se programarán más adelante.
 */
export const MAX_REMINDER_TRIGGERS = Platform.OS === 'ios' ? 48 : 400;
export const MAX_PERSONAL_TASK_TRIGGERS = Platform.OS === 'ios' ? 12 : 50;

export const isReminderTriggerId = (id: string) => id.startsWith('reminder_');

// Las notificaciones de prueba ("..._test") no se tocan al sincronizar
export const isPersonalTaskTriggerId = (id: string) =>
  id.startsWith('personal_task_') && !id.includes('_test');
