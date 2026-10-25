import { Company, Reminder } from '../../types';
import { ReminderStats, getReminderStats } from '../reminders/reminderFilters';
import { normalizeText } from '../search/globalSearch';

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

/**
 * Subtítulo de la pestaña: cuántos clientes y cuántos tienen algo vencido. Sin empresas no
 * hay subtítulo (el estado vacío ya lo explica).
 */
export function summarizeCompanies(
  companies: Company[],
  reminders: Reminder[],
  now: Date = new Date(),
): string | undefined {
  if (companies.length === 0) {
    return undefined;
  }
  const total = `${companies.length} cliente${companies.length === 1 ? '' : 's'}`;
  const withOverdue = companies.filter(
    company => getCompanyStats(reminders, company.id, now).overdue > 0,
  ).length;
  return withOverdue > 0 ? `${total} · ${withOverdue} con vencidos` : total;
}

/** Con menos empresas la lista entera cabe en pantalla y el buscador solo ocupa sitio */
export const COMPANY_SEARCH_MIN = 5;

/**
 * Empresas que coinciden con la búsqueda (nombre o NIT, sin distinguir tildes). Primero las
 * que tienen más recordatorios vencidos, luego por nombre: lo que necesita atención, arriba.
 */
export function filterCompanies(
  companies: Company[],
  reminders: Reminder[],
  search: string,
  now: Date = new Date(),
): Company[] {
  const words = normalizeText(search.trim()).split(/\s+/).filter(Boolean);
  const overdue = new Map(
    companies.map(company => [company.id, getCompanyStats(reminders, company.id, now).overdue]),
  );
  return companies
    .filter(company => {
      const haystack = normalizeText(`${company.name} ${company.nit}`);
      return words.every(word => haystack.includes(word));
    })
    .sort(
      (a, b) =>
        (overdue.get(b.id) ?? 0) - (overdue.get(a.id) ?? 0) || a.name.localeCompare(b.name, 'es'),
    );
}
