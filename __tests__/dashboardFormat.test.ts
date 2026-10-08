/**
 * @format
 */

import { formatTimeUntil, getDaysUntil } from '../src/components/dashboard/dashboardFormat';

const NOW = new Date('2026-03-02T14:30:00');

describe('dashboardFormat', () => {
  it('cuenta días completos sin importar la hora', () => {
    expect(getDaysUntil('2026-03-02T23:59:00', NOW)).toBe(0);
    expect(getDaysUntil('2026-03-03T00:01:00', NOW)).toBe(1);
    expect(getDaysUntil('2026-03-01T10:00:00', NOW)).toBe(-1);
  });

  it('describe el tiempo restante con la unidad más grande', () => {
    expect(formatTimeUntil(new Date('2026-03-05T09:00:00'), NOW)).toBe('en 2 días');
    expect(formatTimeUntil(new Date('2026-03-03T13:30:00'), NOW)).toBe('en 23 horas');
    expect(formatTimeUntil(new Date('2026-03-02T15:30:00'), NOW)).toBe('en 1 hora');
    expect(formatTimeUntil(new Date('2026-03-02T14:35:00'), NOW)).toBe('en 5 minutos');
    expect(formatTimeUntil(new Date('2026-03-02T14:30:20'), NOW)).toBe('muy pronto');
  });
});
