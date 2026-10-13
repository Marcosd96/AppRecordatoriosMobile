import {
  filterReminders,
  getReminderStats,
  toggledReminder,
} from '../src/components/reminders/reminderFilters';
import { Reminder } from '../src/types';

const now = new Date('2026-10-12T12:00:00Z');
const daysFromNow = (days: number) => new Date(now.getTime() + days * 86400000).toISOString();

const reminder = (overrides: Partial<Reminder>): Reminder => ({
  id: 'r',
  companyId: 'c1',
  companyName: 'Acme',
  type: 'IVA',
  period: '2026-09',
  dueDate: daysFromNow(5),
  description: 'Declaración de IVA',
  status: 'pending',
  ...overrides,
});

const list = [
  reminder({ id: 'late', status: 'overdue', dueDate: daysFromNow(-3) }),
  reminder({ id: 'soon', dueDate: daysFromNow(5) }),
  reminder({ id: 'far', dueDate: daysFromNow(60), companyId: 'c2', companyName: 'Beta' }),
  reminder({ id: 'done', status: 'completed', dueDate: daysFromNow(-10), description: 'Retención' }),
];

const ids = (items: Reminder[]) => items.map(r => r.id);

describe('filterReminders', () => {
  it('ordena por fecha de vencimiento', () => {
    expect(ids(filterReminders(list, { filter: 'all', companyId: null, search: '' }, now))).toEqual([
      'done',
      'late',
      'soon',
      'far',
    ]);
  });

  it('"próximos" son solo pendientes de los siguientes 30 días', () => {
    expect(ids(filterReminders(list, { filter: 'upcoming', companyId: null, search: '' }, now))).toEqual([
      'soon',
    ]);
  });

  it('combina empresa y búsqueda (sin distinguir mayúsculas)', () => {
    expect(ids(filterReminders(list, { filter: 'all', companyId: 'c2', search: '' }, now))).toEqual(['far']);
    expect(ids(filterReminders(list, { filter: 'all', companyId: null, search: '  BETA ' }, now))).toEqual([
      'far',
    ]);
  });
});

describe('getReminderStats', () => {
  it('cuenta cada estado', () => {
    expect(getReminderStats(list, now)).toEqual({ total: 4, pending: 2, overdue: 1, upcoming: 1 });
  });
});

describe('toggledReminder', () => {
  it('completa un pendiente', () => {
    expect(toggledReminder(reminder({}), now).status).toBe('completed');
  });

  it('al reabrir uno con la fecha pasada queda vencido', () => {
    expect(toggledReminder(list[3], now).status).toBe('overdue');
    expect(toggledReminder(reminder({ status: 'completed' }), now).status).toBe('pending');
  });
});
