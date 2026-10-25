/**
 * @format
 */

import {
  filterCompanies,
  getCompanyStats,
  summarizeCompanies,
} from '../src/components/companies/companyStats';
import { Company, Reminder } from '../src/types';

const NOW = new Date('2026-03-02T12:00:00');

const reminder = (id: string, companyId: string, status: Reminder['status'], dueDate: string): Reminder => ({
  id,
  companyId,
  companyName: companyId,
  type: 'IVA',
  period: '2026-01',
  dueDate,
  description: id,
  status,
});

describe('getCompanyStats', () => {
  it('cuenta solo los recordatorios de la empresa', () => {
    const reminders = [
      reminder('a', 'c1', 'pending', '2026-03-10'),
      reminder('b', 'c1', 'pending', '2026-05-10'),
      reminder('c', 'c1', 'overdue', '2026-02-10'),
      reminder('d', 'c1', 'completed', '2026-02-01'),
      reminder('e', 'c2', 'pending', '2026-03-05'),
    ];

    expect(getCompanyStats(reminders, 'c1', NOW)).toEqual({
      total: 4,
      pending: 2,
      overdue: 1,
      upcoming: 1,
    });
  });

  it('devuelve ceros para una empresa sin recordatorios', () => {
    expect(getCompanyStats([], 'c1', NOW)).toEqual({ total: 0, pending: 0, overdue: 0, upcoming: 0 });
  });
});

describe('filterCompanies', () => {
  const company = (id: string, name: string, nit: string) =>
    ({ id, name, nit, calendarTypes: [] } as unknown as Company);
  const companies = [
    company('c1', 'Zeta Ltda', '900111'),
    company('c2', 'Ácme SAS', '800222'),
    company('c3', 'Beta', '700333'),
  ];
  const reminders = [
    reminder('a', 'c3', 'overdue', '2026-02-10'),
    reminder('b', 'c1', 'overdue', '2026-02-11'),
    reminder('c', 'c1', 'pending', '2026-02-12'),
  ];

  it('pone primero las que tienen más vencidos y luego por nombre', () => {
    expect(filterCompanies(companies, reminders, '', NOW).map(c => c.id)).toEqual(['c1', 'c3', 'c2']);
  });

  it('busca por nombre sin tildes o por NIT', () => {
    expect(filterCompanies(companies, reminders, 'acme', NOW).map(c => c.id)).toEqual(['c2']);
    expect(filterCompanies(companies, reminders, '7003', NOW).map(c => c.id)).toEqual(['c3']);
  });
});

describe('summarizeCompanies', () => {
  const company = (id: string) => ({ id, name: id, nit: id } as unknown as Company);

  it('cuenta clientes y los que tienen vencidos', () => {
    const reminders = [reminder('a', 'c1', 'overdue', '2026-02-10')];
    expect(summarizeCompanies([company('c1'), company('c2')], reminders, NOW)).toBe(
      '2 clientes · 1 con vencidos',
    );
    expect(summarizeCompanies([company('c2')], reminders, NOW)).toBe('1 cliente');
    expect(summarizeCompanies([], reminders, NOW)).toBeUndefined();
  });
});
