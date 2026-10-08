/**
 * Navegación al tocar una notificación: lleva al recordatorio o a la tarea que la generó.
 *
 * Al tocarla con la app cerrada todavía no existen las pantallas (y puede no haber sesión),
 * así que el destino queda pendiente y se aplica en cuanto la pantalla principal está lista.
 */
import { createNavigationContainerRef } from '@react-navigation/native';

export const navigationRef = createNavigationContainerRef<any>();

export type NotificationTarget =
  | { screen: 'Reminders'; params: { reminderId: string; highlightAt: number } }
  | { screen: 'PersonalTasks'; params: { taskId: string; highlightAt: number } };

let pendingTarget: NotificationTarget | null = null;

/**
 * Pantalla a la que lleva una notificación según sus datos (null si no lleva a ninguna,
 * como la notificación de prueba general)
 */
export function targetFromNotificationData(
  data: Record<string, unknown> | undefined,
  now: number = Date.now(),
): NotificationTarget | null {
  if (typeof data?.reminderId === 'string') {
    return { screen: 'Reminders', params: { reminderId: data.reminderId, highlightAt: now } };
  }
  if (typeof data?.taskId === 'string') {
    return { screen: 'PersonalTasks', params: { taskId: data.taskId, highlightAt: now } };
  }
  return null;
}

/**
 * Intenta ir al destino pendiente. Solo navega si la pantalla principal (con sesión) existe.
 */
export function flushPendingNavigation(): void {
  if (!pendingTarget || !navigationRef.isReady()) {
    return;
  }
  const routeNames = navigationRef.getRootState()?.routeNames ?? [];
  if (!routeNames.includes('Main')) {
    return; // Sin sesión o aún en el splash: se reintenta cuando aparezca
  }
  const target = pendingTarget;
  pendingTarget = null;
  navigationRef.navigate('Main', { screen: target.screen, params: target.params });
}

// Al abrir la app desde una notificación pueden llegar casi a la vez el evento de segundo plano
// y getInitialNotification. Solo se ignoran esas repeticiones inmediatas: los IDs se reutilizan
// (p. ej. las notificaciones de prueba), así que tocar otra vez la misma más tarde debe funcionar.
const DUPLICATE_WINDOW_MS = 3000;
let lastHandled: { id: string; at: number } | null = null;

export function openFromNotification(
  notification: { id?: string; data?: Record<string, unknown> } | undefined,
  now: number = Date.now(),
): void {
  if (notification?.id) {
    if (
      lastHandled?.id === notification.id &&
      now - lastHandled.at < DUPLICATE_WINDOW_MS
    ) {
      return;
    }
    lastHandled = { id: notification.id, at: now };
  }
  const target = targetFromNotificationData(notification?.data);
  if (!target) {
    return;
  }
  pendingTarget = target;
  flushPendingNavigation();
}

/** Solo para tests */
export function getPendingTarget(): NotificationTarget | null {
  return pendingTarget;
}
