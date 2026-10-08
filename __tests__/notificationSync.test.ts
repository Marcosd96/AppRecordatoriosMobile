/**
 * @format
 */

import notifee from '@notifee/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  isSyncFresh,
  notificationsService,
  reminderFingerprint,
} from '../src/services/notificationsService';
import { PersonalTask, Reminder } from '../src/types';

const NOW = new Date('2026-03-02T08:00:00');
const DAY = 24 * 60 * 60 * 1000;

function makeReminder(id: string, daysFromNow: number, status: Reminder['status'] = 'pending'): Reminder {
  return {
    id,
    companyId: 'company-1',
    companyName: 'Empresa',
    type: 'IVA',
    period: '2026-01',
    dueDate: new Date(NOW.getTime() + daysFromNow * DAY).toISOString(),
    description: `Recordatorio ${id}`,
    status,
  };
}

// Simula el almacén de notificaciones programadas de notifee, con latencia para que
// dos sincronizaciones simultáneas puedan intercalarse si no se serializan
let scheduled: Set<string>;
const tick = () => new Promise<void>(resolve => setImmediate(() => resolve()));

beforeEach(async () => {
  jest.useFakeTimers({ now: NOW, doNotFake: ['nextTick', 'setImmediate'] });
  jest.spyOn(console, 'log').mockImplementation(() => {});
  jest.spyOn(console, 'warn').mockImplementation(() => {});
  await AsyncStorage.clear();
  await notificationsService.cancelAllNotifications(); // también olvida las sincronizaciones previas

  scheduled = new Set();
  jest.clearAllMocks();
  (notifee.createTriggerNotification as jest.Mock).mockImplementation(async ({ id }) => {
    await tick();
    scheduled.add(id);
    return id;
  });
  (notifee.cancelNotification as jest.Mock).mockImplementation(async (id: string) => {
    await tick();
    scheduled.delete(id);
  });
  (notifee.getTriggerNotificationIds as jest.Mock).mockImplementation(async () => [...scheduled]);
});

afterEach(() => {
  jest.useRealTimers();
  jest.restoreAllMocks();
});

describe('syncReminders', () => {
  it('no reprograma si los recordatorios no cambiaron', async () => {
    const reminders = [makeReminder('a', 10)];

    await notificationsService.syncReminders(reminders);
    await notificationsService.syncReminders(reminders);

    expect(notifee.createTriggerNotification).toHaveBeenCalledTimes(4);
  });

  it('reprograma cuando cambian los recordatorios', async () => {
    await notificationsService.syncReminders([makeReminder('a', 10)]);
    await notificationsService.syncReminders([makeReminder('a', 10, 'completed')]);

    expect(scheduled.size).toBe(0);
  });

  it('reprograma pasada una hora aunque no haya cambios', async () => {
    const reminders = [makeReminder('a', 10)];
    await notificationsService.syncReminders(reminders);

    jest.setSystemTime(new Date(NOW.getTime() + 61 * 60 * 1000));
    await notificationsService.syncReminders(reminders);

    expect(notifee.createTriggerNotification).toHaveBeenCalledTimes(8);
  });

  it('serializa sincronizaciones simultáneas: queda exactamente lo de la última', async () => {
    const first = [makeReminder('a', 10), makeReminder('b', 12)];
    const second = [makeReminder('c', 15)];

    await Promise.all([
      notificationsService.syncReminders(first),
      notificationsService.syncReminders(second),
    ]);

    expect([...scheduled].sort()).toEqual([
      'reminder_c_0days',
      'reminder_c_1days',
      'reminder_c_2days',
      'reminder_c_3days',
    ]);
    const stored = JSON.parse((await AsyncStorage.getItem('@scheduled_notifications')) || '{}');
    expect(Object.keys(stored)).toEqual(['c']);
  });

  it('cancela notificaciones huérfanas que no estaban en el storage', async () => {
    scheduled.add('reminder_viejo_0days');
    scheduled.add('personal_task_t1');

    await notificationsService.syncReminders([makeReminder('a', 10)], { force: true });

    expect(scheduled.has('reminder_viejo_0days')).toBe(false);
    expect(scheduled.has('personal_task_t1')).toBe(true);
  });
});

describe('permisos', () => {
  it('sin permisos programa igualmente y no muestra el diálogo del sistema', async () => {
    (notifee.getNotificationSettings as jest.Mock).mockResolvedValue({ authorizationStatus: 0 });

    await notificationsService.syncReminders([makeReminder('a', 10)]);
    await notificationsService.syncPersonalTasks([]);

    expect(notifee.requestPermission).not.toHaveBeenCalled();
    expect(scheduled.size).toBe(4);
  });
});

describe('acciones sobre un solo elemento', () => {
  it('esperan a que termine la sincronización en curso', async () => {
    // Si la cancelación se ejecutara en mitad de la sincronización, la sincronización
    // volvería a crear las notificaciones del recordatorio "a" después de cancelarlas
    await Promise.all([
      notificationsService.syncReminders([makeReminder('a', 10)]),
      notificationsService.cancelReminderNotifications('a'),
    ]);

    expect(scheduled.size).toBe(0);
  });

  it('obligan a la siguiente sincronización a reprogramar', async () => {
    const reminders = [makeReminder('a', 10)];
    await notificationsService.syncReminders(reminders);
    await notificationsService.cancelReminderNotifications('a');

    await notificationsService.syncReminders(reminders);

    expect(scheduled.size).toBe(4);
  });
});

describe('aviso de recordatorio pasado de una tarea futura', () => {
  // Tarea dentro de 30 minutos con aviso 60 minutos antes: el aviso ya pasó
  const task: PersonalTask = {
    id: 't1',
    userId: 'u1',
    title: 'Llamar',
    isRecurring: false,
    startDate: new Date(NOW.getTime() + 30 * 60 * 1000).toISOString(),
    status: 'active',
    priority: 'medium',
    reminderEnabled: true,
    reminderMinutes: 60,
    createdAt: NOW.toISOString(),
    updatedAt: NOW.toISOString(),
  };

  it('se envía una sola vez aunque se sincronice varias veces el mismo día', async () => {
    await notificationsService.syncPersonalTasks([task], { force: true });
    await notificationsService.syncPersonalTasks([task], { force: true });

    expect(notifee.displayNotification).toHaveBeenCalledTimes(1);
  });

  it('se vuelve a enviar al día siguiente', async () => {
    await notificationsService.syncPersonalTasks([task], { force: true });
    jest.setSystemTime(new Date(NOW.getTime() + DAY));
    const tomorrowTask = {
      ...task,
      startDate: new Date(NOW.getTime() + DAY + 30 * 60 * 1000).toISOString(),
    };
    await notificationsService.syncPersonalTasks([tomorrowTask], { force: true });

    expect(notifee.displayNotification).toHaveBeenCalledTimes(2);
  });
});

describe('avisos pospuestos', () => {
  it('al sincronizar se cancelan los de recordatorios que ya no están pendientes', async () => {
    scheduled.add('snooze_reminder_a_1days');
    scheduled.add('snooze_reminder_b_1days');
    (notifee.getTriggerNotifications as jest.Mock).mockResolvedValue([
      { notification: { id: 'snooze_reminder_a_1days', data: { reminderId: 'a' } } },
      { notification: { id: 'snooze_reminder_b_1days', data: { reminderId: 'b' } } },
    ]);

    // "a" sigue pendiente, "b" se completó
    await notificationsService.syncReminders([
      makeReminder('a', 10),
      makeReminder('b', 12, 'completed'),
    ]);

    expect(scheduled.has('snooze_reminder_a_1days')).toBe(true);
    expect(scheduled.has('snooze_reminder_b_1days')).toBe(false);
  });
});

describe('syncPersonalTasks', () => {
  it('no cancela las notificaciones de prueba', async () => {
    scheduled.add('personal_task_t1_test');
    scheduled.add('personal_task_huerfana');

    await notificationsService.syncPersonalTasks([]);

    expect([...scheduled]).toEqual(['personal_task_t1_test']);
  });
});

describe('isSyncFresh', () => {
  const fingerprint = reminderFingerprint([makeReminder('a', 10)]);
  const at = NOW.getTime();

  it('es vigente con la misma huella dentro de la hora', () => {
    expect(isSyncFresh({ fingerprint, at }, fingerprint, at + 30 * 60 * 1000)).toBe(true);
  });

  it('caduca al cambiar de día aunque no haya pasado una hora', () => {
    const lateNight = new Date('2026-03-02T23:50:00').getTime();
    const afterMidnight = new Date('2026-03-03T00:10:00').getTime();
    expect(isSyncFresh({ fingerprint, at: lateNight }, fingerprint, afterMidnight)).toBe(false);
  });

  it('no depende del orden de los recordatorios', () => {
    const a = makeReminder('a', 10);
    const b = makeReminder('b', 12);
    expect(reminderFingerprint([a, b])).toBe(reminderFingerprint([b, a]));
  });
});
