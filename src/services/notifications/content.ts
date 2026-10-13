import { AndroidImportance } from '@notifee/react-native';
import { Reminder } from '../../types';
import { ITEM_ACTIONS_CATEGORY, androidItemActions } from '../notificationActionConfig';

const FOREGROUND_PRESENTATION = { alert: true, badge: true, sound: true };

/**
 * Opciones de Android comunes a los avisos de recordatorios y tareas: prioridad alta,
 * abrir la app al tocar y los botones de acción
 */
export function androidOptions(channelId: string, color: string) {
  return {
    channelId,
    importance: AndroidImportance.HIGH,
    pressAction: { id: 'default' },
    actions: androidItemActions,
    smallIcon: 'ic_launcher',
    color,
  };
}

/**
 * Opciones de iOS con los botones de acción. Con sonido, también se muestran
 * aunque la app esté en primer plano.
 */
export function iosOptions(sound?: string) {
  if (!sound) {
    return { categoryId: ITEM_ACTIONS_CATEGORY };
  }
  return {
    categoryId: ITEM_ACTIONS_CATEGORY,
    sound,
    foregroundPresentationOptions: FOREGROUND_PRESENTATION,
  };
}

// Índice = días que faltan para el vencimiento (0 a 3)
const REMINDER_STYLES = [
  {
    title: 'Recordatorio fiscal · vence hoy',
    dueText: 'Vence hoy',
    immediateSuffix: '¡Acción requerida!',
    color: '#dc2626', // Rojo para urgencia
  },
  {
    title: 'Recordatorio fiscal · vence mañana',
    dueText: 'Vence mañana',
    immediateSuffix: '¡No olvides completarlo!',
    color: '#f59e0b', // Amarillo/naranja
  },
  {
    title: 'Recordatorio fiscal',
    dueText: 'Vence en 2 días',
    immediateSuffix: 'Recuerda prepararlo',
    color: '#f59e0b',
  },
  {
    title: 'Recordatorio fiscal',
    dueText: 'Vence en 3 días',
    immediateSuffix: 'Nuevo recordatorio',
    color: '#2563eb', // Azul
  },
];

/**
 * Título, texto y color del aviso de un recordatorio según los días que faltan.
 * El aviso inmediato (al abrir la app) añade una frase que invita a actuar.
 */
export function reminderContent(reminder: Reminder, daysUntilDue: number, immediate: boolean) {
  const style = REMINDER_STYLES[Math.min(Math.max(daysUntilDue, 0), 3)];
  const due = immediate ? `${style.dueText} - ${style.immediateSuffix}` : style.dueText;
  return {
    title: style.title,
    body: `${reminder.description} - ${reminder.companyName}\n${due}`,
    color: style.color,
  };
}

// Sin emojis: cada fabricante los dibuja distinto y TalkBack los lee en voz alta.
// La prioridad se nota en el color y, si es urgente, en el título
const TASK_PRIORITY_STYLES: Record<string, { color: string; titlePrefix: string }> = {
  urgent: { color: '#dc2626', titlePrefix: 'Tarea urgente' }, // Rojo
  high: { color: '#f59e0b', titlePrefix: 'Tarea' }, // Naranja
  medium: { color: '#2563eb', titlePrefix: 'Tarea' }, // Azul
  low: { color: '#10b981', titlePrefix: 'Tarea' }, // Verde
};

export function taskPriorityStyle(priority: string) {
  return TASK_PRIORITY_STYLES[priority] ?? TASK_PRIORITY_STYLES.medium;
}

export function formatTaskDate(date: Date): string {
  return new Intl.DateTimeFormat('es-CO', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}
