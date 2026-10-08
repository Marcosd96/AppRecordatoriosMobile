/**
 * @format
 */

import notifee from '@notifee/react-native';
import { ApiError } from '../src/config/api';
import { remindersService } from '../src/services/remindersService';
import { personalTasksService } from '../src/services/personalTasksService';
import {
  handleNotificationAction,
  snoozedNotificationId,
} from '../src/services/notificationActions';

jest.mock('../src/services/remindersService', () => ({
  remindersService: { toggleStatus: jest.fn() },
}));
jest.mock('../src/services/personalTasksService', () => ({
  personalTasksService: { complete: jest.fn(), getOne: jest.fn() },
}));

const toggleStatus = remindersService.toggleStatus as jest.Mock;
const completeTask = personalTasksService.complete as jest.Mock;
const getTask = personalTasksService.getOne as jest.Mock;

const reminderNotification = {
  id: 'reminder_r1_1days',
  title: 'Recordatorio Fiscal - Mañana',
  body: 'IVA - Empresa',
  data: { reminderId: 'r1', type: 'advance' },
  android: { channelId: 'reminders_v2' },
};

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(console, 'log').mockImplementation(() => {});
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => jest.restoreAllMocks());

describe('Completar un recordatorio', () => {
  it('lo marca como completado y retira la notificación', async () => {
    toggleStatus.mockResolvedValue({ reminder: { status: 'completed' } });

    expect(await handleNotificationAction('complete', reminderNotification)).toBe(true);

    expect(toggleStatus).toHaveBeenCalledTimes(1);
    expect(notifee.cancelDisplayedNotification).toHaveBeenCalledWith('reminder_r1_1days');
  });

  it('si ya estaba completado, deshace el cambio para no reabrirlo', async () => {
    toggleStatus.mockResolvedValueOnce({ reminder: { status: 'pending' } });
    toggleStatus.mockResolvedValueOnce({ reminder: { status: 'completed' } });

    await handleNotificationAction('complete', reminderNotification);

    expect(toggleStatus).toHaveBeenCalledTimes(2);
  });
});

describe('Completar una tarea', () => {
  it('la completa y programa el aviso de la próxima ocurrencia si es recurrente', async () => {
    completeTask.mockResolvedValue(undefined);
    getTask.mockResolvedValue({
      id: 't1',
      status: 'active',
      reminderEnabled: true,
      reminderMinutes: 60,
      isRecurring: true,
      recurrenceType: 'daily',
      startDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
      priority: 'medium',
      title: 'Regar',
    });

    await handleNotificationAction('complete', {
      id: 'personal_task_t1',
      data: { taskId: 't1', type: 'personal-task' },
    });

    expect(completeTask).toHaveBeenCalledWith('t1');
    expect(notifee.createTriggerNotification).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'personal_task_t1' }),
      expect.anything(),
    );
  });
});

describe('Posponer', () => {
  it('la vuelve a programar una hora después con un ID que la sincronización no toca', async () => {
    const now = new Date('2026-03-02T09:00:00').getTime();

    await handleNotificationAction('snooze', reminderNotification, now);

    expect(notifee.createTriggerNotification).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'snooze_reminder_r1_1days', data: reminderNotification.data }),
      expect.objectContaining({ timestamp: now + 60 * 60 * 1000 }),
    );
    expect(notifee.cancelDisplayedNotification).toHaveBeenCalledWith('reminder_r1_1days');
  });

  it('posponer otra vez no acumula prefijos', () => {
    expect(snoozedNotificationId('snooze_reminder_r1_1days')).toBe('snooze_reminder_r1_1days');
  });
});

describe('Errores', () => {
  it('sin conexión avisa con otra notificación y retira la original', async () => {
    toggleStatus.mockRejectedValue(new ApiError('sin conexión', 0));

    await handleNotificationAction('complete', reminderNotification);

    expect(notifee.displayNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'No se pudo completar',
        body: expect.stringContaining('Sin conexión'),
      }),
    );
    expect(notifee.cancelDisplayedNotification).toHaveBeenCalledWith('reminder_r1_1days');
  });

  it('ignora acciones desconocidas', async () => {
    expect(await handleNotificationAction('otra', reminderNotification)).toBe(false);
    expect(await handleNotificationAction('default', reminderNotification)).toBe(false);
  });
});
