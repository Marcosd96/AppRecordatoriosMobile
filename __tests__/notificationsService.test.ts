/**
 * @format
 */

import notifee from '@notifee/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import {
  notificationsService,
  MAX_REMINDER_TRIGGERS,
  MAX_PERSONAL_TASK_TRIGGERS,
} from '../src/services/notificationsService';
import { PersonalTask, Reminder } from '../src/types';

const NOW = new Date('2026-03-02T08:00:00');
const DAY = 24 * 60 * 60 * 1000;

function makeReminder(id: string, daysFromNow: number): Reminder {
  return {
    id,
    companyId: 'company-1',
    companyName: 'Empresa',
    type: 'IVA',
    period: '2026-01',
    dueDate: new Date(NOW.getTime() + daysFromNow * DAY).toISOString(),
    description: `Recordatorio ${id}`,
    status: 'pending',
  };
}

function makeTask(id: string, daysFromNow: number): PersonalTask {
  return {
    id,
    userId: 'user-1',
    title: `Tarea ${id}`,
    isRecurring: false,
    startDate: new Date(NOW.getTime() + daysFromNow * DAY).toISOString(),
    status: 'active',
    priority: 'medium',
    reminderEnabled: true,
    reminderMinutes: 60,
    createdAt: NOW.toISOString(),
    updatedAt: NOW.toISOString(),
  };
}

function scheduledTriggers() {
  return (notifee.createTriggerNotification as jest.Mock).mock.calls.map(
    ([notification]) => notification,
  );
}

beforeEach(async () => {
  jest.useFakeTimers({ now: NOW, doNotFake: ['nextTick', 'setImmediate'] });
  jest.clearAllMocks();
  jest.spyOn(console, 'log').mockImplementation(() => {});
  jest.spyOn(console, 'warn').mockImplementation(() => {});
  await AsyncStorage.clear();
});

afterEach(() => {
  jest.useRealTimers();
  jest.restoreAllMocks();
});

describe('límite de notificaciones programadas', () => {
  it('usa los límites de iOS (64 pendientes por app) en este entorno', () => {
    expect(MAX_REMINDER_TRIGGERS + MAX_PERSONAL_TASK_TRIGGERS).toBeLessThanOrEqual(64);
  });

  it('no programa más recordatorios que el límite', async () => {
    // 20 recordatorios x 4 avisos (3, 2, 1 y 0 días antes) = 80 avisos
    const reminders = Array.from({ length: 20 }, (_, i) => makeReminder(`r${i}`, 5 + i));

    await notificationsService.scheduleAllReminders(reminders);

    expect(scheduledTriggers()).toHaveLength(MAX_REMINDER_TRIGGERS);
  });

  it('prioriza los recordatorios que vencen antes', async () => {
    const reminders = Array.from({ length: 20 }, (_, i) => makeReminder(`r${i}`, 5 + i)).reverse();

    await notificationsService.scheduleAllReminders(reminders);

    const remindersScheduled = new Set(scheduledTriggers().map((n) => n.data.reminderId));
    const soonest = Array.from({ length: MAX_REMINDER_TRIGGERS / 4 }, (_, i) => `r${i}`);
    expect([...remindersScheduled].sort()).toEqual(soonest.sort());
  });

  it('programa todo cuando no se alcanza el límite', async () => {
    const reminders = [makeReminder('a', 10), makeReminder('b', 20)];

    await notificationsService.scheduleAllReminders(reminders);

    expect(scheduledTriggers()).toHaveLength(8);
  });

  it('no programa más tareas personales que el límite, empezando por las más próximas', async () => {
    const tasks = Array.from({ length: 20 }, (_, i) => makeTask(`t${i}`, 1 + i)).reverse();

    await notificationsService.scheduleAllPersonalTasks(tasks);

    const taskIds = scheduledTriggers().map((n) => n.data.taskId);
    expect(taskIds).toHaveLength(MAX_PERSONAL_TASK_TRIGGERS);
    expect(taskIds).toEqual(
      Array.from({ length: MAX_PERSONAL_TASK_TRIGGERS }, (_, i) => `t${i}`),
    );
  });
});

describe('canales de Android', () => {
  it('las tareas personales usan un canal que la app crea', async () => {
    jest.replaceProperty(Platform, 'OS', 'android');

    await notificationsService.schedulePersonalTaskNotification(makeTask('t1', 2));
    await notificationsService.createNotificationChannel();

    const [notification] = scheduledTriggers();
    const createdChannels = (notifee.createChannel as jest.Mock).mock.calls.map(([c]) => c.id);
    expect(createdChannels).toContain(notification.android.channelId);
  });
});
