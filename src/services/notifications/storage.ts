import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  IMMEDIATE_NOTIFICATIONS_TODAY_KEY,
  PERSONAL_TASK_IDS_STORAGE_KEY,
  REMINDER_IDS_STORAGE_KEY,
} from './config';

/*
 * Registro en AsyncStorage de los IDs de notificaciones programadas por cada elemento,
 * para poder cancelarlas después, y de los avisos inmediatos ya enviados hoy.
 */

async function readMap<T>(key: string): Promise<Record<string, T>> {
  try {
    const stored = await AsyncStorage.getItem(key);
    return stored ? JSON.parse(stored) : {};
  } catch (error) {
    console.error(`Error al leer ${key}:`, error);
    return {};
  }
}

async function updateMap<T>(
  key: string,
  update: (map: Record<string, T>) => void,
): Promise<void> {
  try {
    const map = await readMap<T>(key);
    update(map);
    await AsyncStorage.setItem(key, JSON.stringify(map));
  } catch (error) {
    console.error(`Error al guardar ${key}:`, error);
  }
}

// Recordatorios: varios avisos por recordatorio (uno por día desde 3 días antes)

export function readReminderIds(): Promise<Record<string, string[]>> {
  return readMap<string[]>(REMINDER_IDS_STORAGE_KEY);
}

export async function getReminderNotificationIds(reminderId: string): Promise<string[]> {
  return (await readReminderIds())[reminderId] || [];
}

export function saveReminderNotificationIds(reminderId: string, ids: string[]): Promise<void> {
  return updateMap<string[]>(REMINDER_IDS_STORAGE_KEY, map => {
    map[reminderId] = ids;
  });
}

export function removeReminderNotificationIds(reminderId: string): Promise<void> {
  return updateMap<string[]>(REMINDER_IDS_STORAGE_KEY, map => {
    delete map[reminderId];
  });
}

export function clearReminderIds(): Promise<void> {
  return AsyncStorage.removeItem(REMINDER_IDS_STORAGE_KEY);
}

// Tareas personales: un aviso por tarea

export function readPersonalTaskIds(): Promise<Record<string, string>> {
  return readMap<string>(PERSONAL_TASK_IDS_STORAGE_KEY);
}

export async function getPersonalTaskNotificationId(taskId: string): Promise<string | null> {
  return (await readPersonalTaskIds())[taskId] || null;
}

export function savePersonalTaskNotificationId(taskId: string, id: string): Promise<void> {
  return updateMap<string>(PERSONAL_TASK_IDS_STORAGE_KEY, map => {
    map[taskId] = id;
  });
}

export function removePersonalTaskNotificationId(taskId: string): Promise<void> {
  return updateMap<string>(PERSONAL_TASK_IDS_STORAGE_KEY, map => {
    delete map[taskId];
  });
}

export function clearPersonalTaskIds(): Promise<void> {
  return AsyncStorage.removeItem(PERSONAL_TASK_IDS_STORAGE_KEY);
}

// Avisos inmediatos: se guardan por día para no repetirlos en cada sincronización

/**
 * Verifica si ya se envió hoy un aviso inmediato con esta clave
 */
export async function hasImmediateNotificationToday(key: string): Promise<boolean> {
  const sent = await readMap<string[]>(IMMEDIATE_NOTIFICATIONS_TODAY_KEY);
  return sent[new Date().toDateString()]?.includes(key) ?? false;
}

/**
 * Marca que se envió hoy un aviso inmediato con esta clave
 */
export function markImmediateNotificationSent(key: string): Promise<void> {
  return updateMap<string[]>(IMMEDIATE_NOTIFICATIONS_TODAY_KEY, sent => {
    const today = new Date().toDateString();
    sent[today] = sent[today] ?? [];
    if (!sent[today].includes(key)) {
      sent[today].push(key);
    }
  });
}

/**
 * Limpia los avisos inmediatos de días anteriores (mantener solo los de hoy)
 */
export function cleanOldImmediateNotifications(): Promise<void> {
  return updateMap<string[]>(IMMEDIATE_NOTIFICATIONS_TODAY_KEY, sent => {
    const today = new Date().toDateString();
    for (const day of Object.keys(sent)) {
      if (day !== today) {
        delete sent[day];
      }
    }
  });
}

export function clearAllNotificationRecords(): Promise<void> {
  return AsyncStorage.multiRemove([
    REMINDER_IDS_STORAGE_KEY,
    PERSONAL_TASK_IDS_STORAGE_KEY,
    IMMEDIATE_NOTIFICATIONS_TODAY_KEY,
  ]);
}
