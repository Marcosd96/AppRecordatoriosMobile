import {
  filterReminders,
  getReminderState,
  getReminderStats,
  summarizeReminders,
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
  it('ordena por fecha de vencimiento, con los completados al final', () => {
    expect(ids(filterReminders(list, { filter: 'all', companyId: null, search: '' }, now))).toEqual([
      'late',
      'soon',
      'far',
      'done',
    ]);
  });

  it('los completados van del más reciente al más antiguo', () => {
    const done = [
      reminder({ id: 'old', status: 'completed', dueDate: daysFromNow(-40) }),
      reminder({ id: 'recent', status: 'completed', dueDate: daysFromNow(-2) }),
    ];
    expect(ids(filterReminders(done, { filter: 'all', companyId: null, search: '' }, now))).toEqual([
      'recent',
      'old',
    ]);
  });

  it('un pendiente con la fecha pasada aparece en "Vencidos", no en "Pendientes"', () => {
    const items = [...list, reminder({ id: 'late-date', dueDate: daysFromNow(-1) })];
    const query = { companyId: null, search: '' };
    expect(ids(filterReminders(items, { ...query, filter: 'overdue' }, now))).toEqual([
      'late',
      'late-date',
    ]);
    expect(ids(filterReminders(items, { ...query, filter: 'pending' }, now))).toEqual(['soon', 'far']);
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

describe('getReminderState', () => {
  it('usa el estado del servidor y, si sigue pendiente, la fecha', () => {
    expect(getReminderState(list[0], now)).toBe('overdue');
    expect(getReminderState(list[1], now)).toBe('pending');
    expect(getReminderState(list[3], now)).toBe('completed');
    expect(getReminderState(reminder({ dueDate: daysFromNow(-1) }), now)).toBe('overdue');
  });

  it('lo que vence hoy aún no está vencido', () => {
    expect(getReminderState(reminder({ dueDate: now.toISOString() }), now)).toBe('pending');
  });
});

describe('getReminderStats', () => {
  it('cuenta cada estado', () => {
    expect(getReminderStats(list, now)).toEqual({ total: 4, pending: 2, overdue: 1, upcoming: 1 });
  });

  it('cuenta como vencido un pendiente con la fecha pasada', () => {
    const items = [...list, reminder({ id: 'late-date', dueDate: daysFromNow(-1) })];
    expect(getReminderStats(items, now)).toEqual({ total: 5, pending: 2, overdue: 2, upcoming: 1 });
  });
});

describe('summarizeReminders', () => {
  it('resume vencidos y pendientes, o "Todo al día"', () => {
    expect(summarizeReminders({ total: 4, pending: 2, overdue: 1, upcoming: 1 })).toBe(
      '1 vencido · 2 pendientes',
    );
    expect(summarizeReminders({ total: 3, pending: 1, overdue: 0, upcoming: 1 })).toBe('1 pendiente');
    expect(summarizeReminders({ total: 3, pending: 0, overdue: 0, upcoming: 0 })).toBe('Todo al día');
    expect(summarizeReminders({ total: 0, pending: 0, overdue: 0, upcoming: 0 })).toBeUndefined();
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
