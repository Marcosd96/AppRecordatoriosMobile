import { Reminder } from '../../types';

export interface CompanyStats {
  total: number;
  pending: number;
  overdue: number;
  upcoming: number;
}

/**
 * Resumen de los recordatorios de una empresa ("upcoming" = pendientes en los próximos 30 días)
 */
export function getCompanyStats(
  reminders: Reminder[],
  companyId: string,
  now: Date = new Date(),
): CompanyStats {
  const companyReminders = reminders.filter(r => r.companyId === companyId);
  const next30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  return {
    total: companyReminders.length,
    pending: companyReminders.filter(r => r.status === 'pending').length,
    overdue: companyReminders.filter(r => r.status === 'overdue').length,
    upcoming: companyReminders.filter(r => {
      if (r.status !== 'pending') return false;
      const dueDate = new Date(r.dueDate);
      return dueDate >= now && dueDate <= next30Days;
    }).length,
  };
}
