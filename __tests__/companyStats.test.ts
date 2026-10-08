/**
 * @format
 */

import { getCompanyStats } from '../src/components/companies/companyStats';
import { Reminder } from '../src/types';

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
