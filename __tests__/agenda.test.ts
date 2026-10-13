import { buildAgenda, summarizeAgenda } from '../src/components/dashboard/agenda';
import { PersonalTask, Reminder } from '../src/types';

const now = new Date('2026-10-12T10:00:00');
const inDays = (days: number, hour = 12) => {
  const date = new Date(now);
  date.setDate(date.getDate() + days);
  date.setHours(hour, 0, 0, 0);
  return date.toISOString();
};

const reminder = (id: string, days: number, status: Reminder['status'] = 'pending'): Reminder => ({
  id,
  companyId: 'c',
  companyName: 'Acme',
  type: 'IVA',
  period: '2026-09',
  dueDate: inDays(days),
  description: id,
  status,
});

const task = (id: string, days: number, hour: number, status: PersonalTask['status'] = 'active'): PersonalTask => ({
  id,
  userId: 'u',
  title: id,
  isRecurring: false,
  startDate: inDays(days, hour),
  status,
  priority: 'medium',
  reminderEnabled: false,
  reminderMinutes: 60,
  createdAt: inDays(-30),
  updatedAt: inDays(-30),
});

const ids = (items: Array<{ id: string }>) => items.map(item => item.id);

describe('buildAgenda', () => {
  const reminders = [
    reminder('far', 20),
    reminder('late-server', 2, 'overdue'),
    reminder('late-date', -3),
    reminder('today', 0),
    reminder('in6', 6),
    reminder('in7', 7),
    reminder('done', -1, 'completed'),
  ];

  it('separa lo vencido (por estado o por fecha) de lo de esta semana', () => {
    const agenda = buildAgenda(reminders, [], now);
    expect(ids(agenda.overdue)).toEqual(['late-date', 'late-server']);
    expect(ids(agenda.thisWeek)).toEqual(['today', 'in6']);
  });

  it('"lo próximo" es el primer pendiente después de esta semana', () => {
    expect(buildAgenda(reminders, [], now).next?.id).toBe('in7');
  });

  it('las tareas de hoy incluyen las atrasadas y no las pausadas ni las de mañana', () => {
    const tasks = [
      task('tomorrow', 1, 9),
      task('tonight', 0, 21),
      task('late', -2, 9),
      task('paused', 0, 15, 'paused'),
    ];
    expect(ids(buildAgenda([], tasks, now).tasksToday)).toEqual(['late', 'tonight']);
  });
});

describe('summarizeAgenda', () => {
  it('resume solo lo que hay', () => {
    const agenda = buildAgenda([reminder('a', -1), reminder('b', 2), reminder('c', 3)], [], now);
    expect(summarizeAgenda(agenda)).toBe('1 vencido · 2 esta semana');
    expect(summarizeAgenda(buildAgenda([], [], now))).toBe('Todo al día');
  });
});
