import { Reminder } from '../../types';
import { ReminderStats, getReminderStats } from '../reminders/reminderFilters';

export type CompanyStats = ReminderStats;

/**
 * Resumen de los recordatorios de una empresa, con los mismos criterios que los chips de
 * Recordatorios ("upcoming" = pendientes en los próximos 30 días)
 */
export function getCompanyStats(
  reminders: Reminder[],
  companyId: string,
  now: Date = new Date(),
): CompanyStats {
  return getReminderStats(
    reminders.filter(r => r.companyId === companyId),
    now,
  );
}
