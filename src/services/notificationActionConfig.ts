/**
 * Botones de las notificaciones de recordatorios y tareas
 */
import { AndroidAction, IOSNotificationCategory } from '@notifee/react-native';

export const ACTION_COMPLETE = 'complete';
export const ACTION_SNOOZE = 'snooze';
export const SNOOZE_MINUTES = 60;

// iOS agrupa los botones en categorías registradas al iniciar la app
export const ITEM_ACTIONS_CATEGORY = 'item-actions';

// Sin `launchActivity`: la acción se resuelve en segundo plano, sin abrir la app
export const androidItemActions: AndroidAction[] = [
  { title: '✅ Completar', pressAction: { id: ACTION_COMPLETE } },
  { title: '⏰ Posponer 1 h', pressAction: { id: ACTION_SNOOZE } },
];

export const iosItemActionsCategory: IOSNotificationCategory = {
  id: ITEM_ACTIONS_CATEGORY,
  actions: [
    { id: ACTION_COMPLETE, title: 'Completar' },
    { id: ACTION_SNOOZE, title: 'Posponer 1 h' },
  ],
};
