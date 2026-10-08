/**
 * @format
 */

import {
  getPendingTarget,
  openFromNotification,
  targetFromNotificationData,
} from '../src/navigation/notificationNavigation';

describe('targetFromNotificationData', () => {
  it('las notificaciones de recordatorios llevan a Recordatorios', () => {
    expect(targetFromNotificationData({ reminderId: 'r1', type: 'due' }, 123)).toEqual({
      screen: 'Reminders',
      params: { reminderId: 'r1', highlightAt: 123 },
    });
  });

  it('las de tareas llevan a Tareas', () => {
    expect(targetFromNotificationData({ taskId: 't1', type: 'personal-task' }, 123)).toEqual({
      screen: 'PersonalTasks',
      params: { taskId: 't1', highlightAt: 123 },
    });
  });

  it('las que no son de un elemento (prueba general) no llevan a ninguna parte', () => {
    expect(targetFromNotificationData({ type: 'test' })).toBeNull();
    expect(targetFromNotificationData(undefined)).toBeNull();
  });
});

describe('openFromNotification', () => {
  it('sin navegación lista, el destino queda pendiente', () => {
    openFromNotification({ id: 'n1', data: { reminderId: 'r1' } });

    expect(getPendingTarget()).toMatchObject({
      screen: 'Reminders',
      params: { reminderId: 'r1' },
    });
  });

  it('ignora el aviso repetido de un mismo toque', () => {
    openFromNotification({ id: 'n2', data: { reminderId: 'r2' } }, 1000);
    openFromNotification({ id: 'n2', data: { reminderId: 'r2' } }, 1500);

    expect(getPendingTarget()?.params).toMatchObject({ reminderId: 'r2', highlightAt: expect.any(Number) });
  });

  it('vuelve a abrir la misma notificación si se toca de nuevo más tarde', () => {
    openFromNotification({ id: 'n4', data: { taskId: 't4' } }, 10_000);
    openFromNotification({ id: 'n5', data: { reminderId: 'r5' } }, 11_000);
    // Los IDs se reutilizan (p. ej. las pruebas): n4 otra vez, pasados unos segundos
    openFromNotification({ id: 'n4', data: { taskId: 't4' } }, 20_000);

    expect(getPendingTarget()).toMatchObject({ screen: 'PersonalTasks', params: { taskId: 't4' } });
  });
});
