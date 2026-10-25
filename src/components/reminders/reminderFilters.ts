import { Reminder, ReminderFilter } from '../../types';
import { getDaysUntil } from '../dashboard/dashboardFormat';

const UPCOMING_DAYS = 30;

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

export type ReminderState = 'completed' | 'overdue' | 'pending';

/**
 * Estado que se muestra y se filtra (DESIGN_SYSTEM §2.2). Un pendiente con la fecha pasada
 * cuenta como vencido aunque el servidor aún no lo haya marcado: así coinciden el chip
 * "Vencidos", la insignia de la tarjeta y la sección de Inicio.
 */
export function getReminderState(reminder: Reminder, now: Date = new Date()): ReminderState {
  if (reminder.status === 'completed') {
    return 'completed';
  }
  return reminder.status === 'overdue' || getDaysUntil(reminder.dueDate, now) < 0
    ? 'overdue'
    : 'pending';
}

/** Pendiente que vence entre hoy y dentro de 30 días */
export function isUpcoming(reminder: Reminder, now: Date = new Date()): boolean {
  return (
    getReminderState(reminder, now) === 'pending' &&
    getDaysUntil(reminder.dueDate, now) <= UPCOMING_DAYS
  );
}

function matchesFilter(reminder: Reminder, filter: ReminderFilter, now: Date): boolean {
  switch (filter) {
    case 'pending':
      return getReminderState(reminder, now) === 'pending';
    case 'overdue':
      return getReminderState(reminder, now) === 'overdue';
    case 'upcoming':
      return isUpcoming(reminder, now);
    case 'all':
      return true;
  }
}

const dueTime = (reminder: Reminder) => new Date(reminder.dueDate).getTime();

/**
 * Recordatorios que cumplen los filtros. Primero los abiertos, del que vence antes al que
 * vence después; los completados van al final, el más reciente primero, para que lo ya hecho
 * no tape lo urgente.
 */
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
    .sort((a, b) => {
      const aDone = a.status === 'completed';
      const bDone = b.status === 'completed';
      if (aDone !== bDone) {
        return aDone ? 1 : -1;
      }
      return aDone ? dueTime(b) - dueTime(a) : dueTime(a) - dueTime(b);
    });
}

/** Recuentos para los chips de filtro */
export function getReminderStats(reminders: Reminder[], now: Date = new Date()): ReminderStats {
  const states = reminders.map(r => getReminderState(r, now));
  return {
    total: reminders.length,
    pending: states.filter(state => state === 'pending').length,
    overdue: states.filter(state => state === 'overdue').length,
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
  const isPastDue = getDaysUntil(reminder.dueDate, now) < 0;
  return { ...reminder, status: isPastDue ? 'overdue' : 'pending', completedAt: undefined };
}
