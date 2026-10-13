import { Reminder, ReminderFilter } from '../../types';

const UPCOMING_DAYS = 30;
const DAY_MS = 24 * 60 * 60 * 1000;

export interface ReminderQuery {
  filter: ReminderFilter;
  companyId: string | null;
  search: string;
}

export interface ReminderStats {
  total: number;
  pending: number;
  overdue: number;
  upcoming: number;
}

/** Pendiente que vence entre ahora y dentro de 30 días */
export function isUpcoming(reminder: Reminder, now: Date = new Date()): boolean {
  const due = new Date(reminder.dueDate).getTime();
  return (
    reminder.status === 'pending' &&
    due >= now.getTime() &&
    due <= now.getTime() + UPCOMING_DAYS * DAY_MS
  );
}

function matchesFilter(reminder: Reminder, filter: ReminderFilter, now: Date): boolean {
  switch (filter) {
    case 'pending':
      return reminder.status === 'pending';
    case 'overdue':
      return reminder.status === 'overdue';
    case 'upcoming':
      return isUpcoming(reminder, now);
    case 'all':
      return true;
  }
}

/** Recordatorios que cumplen los filtros, ordenados por fecha de vencimiento */
export function filterReminders(
  reminders: Reminder[],
  { filter, companyId, search }: ReminderQuery,
  now: Date = new Date(),
): Reminder[] {
  const query = search.trim().toLowerCase();
  return reminders
    .filter(
      reminder =>
        (!companyId || reminder.companyId === companyId) &&
        matchesFilter(reminder, filter, now) &&
        (!query ||
          reminder.description.toLowerCase().includes(query) ||
          reminder.companyName.toLowerCase().includes(query)),
    )
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
}

/** Recuentos para los chips de filtro */
export function getReminderStats(reminders: Reminder[], now: Date = new Date()): ReminderStats {
  return {
    total: reminders.length,
    pending: reminders.filter(r => r.status === 'pending').length,
    overdue: reminders.filter(r => r.status === 'overdue').length,
    upcoming: reminders.filter(r => isUpcoming(r, now)).length,
  };
}

/**
 * Estado que tendrá el recordatorio al alternarlo, para mostrarlo antes de que responda el
 * servidor. Al reabrir uno con la fecha pasada queda vencido.
 */
export function toggledReminder(reminder: Reminder, now: Date = new Date()): Reminder {
  if (reminder.status !== 'completed') {
    return { ...reminder, status: 'completed', completedAt: now.toISOString() };
  }
  const isPastDue = new Date(reminder.dueDate).getTime() < now.getTime();
  return { ...reminder, status: isPastDue ? 'overdue' : 'pending', completedAt: undefined };
}
