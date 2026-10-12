/**
 * Tests del cálculo de la próxima ocurrencia de una tarea recurrente
 */

import {
  addMonthsClamped,
  calculateNextValidOccurrence,
} from '../src/services/notifications/recurrence';

const NOW = new Date('2026-03-10T12:00:00');

describe('calculateNextValidOccurrence', () => {
  it('salta ocurrencias diarias hasta la primera con aviso en el futuro', () => {
    const base = new Date('2026-03-01T13:00:00');

    // Aviso 30 min antes: la ocurrencia de hoy a las 13:00 avisa a las 12:30, todavía a tiempo
    expect(calculateNextValidOccurrence(base, 'daily', 1, NOW, 30)).toEqual(
      new Date('2026-03-10T13:00:00'),
    );
    // Aviso 2 h antes: el de hoy (11:00) ya pasó, así que toca mañana
    expect(calculateNextValidOccurrence(base, 'daily', 1, NOW, 120)).toEqual(
      new Date('2026-03-11T13:00:00'),
    );
  });

  it('respeta el intervalo semanal y mensual', () => {
    const base = new Date('2026-03-02T09:00:00');

    expect(calculateNextValidOccurrence(base, 'weekly', 2, NOW, 0)).toEqual(
      new Date('2026-03-16T09:00:00'),
    );
    expect(calculateNextValidOccurrence(base, 'monthly', 1, NOW, 0)).toEqual(
      new Date('2026-04-02T09:00:00'),
    );
  });

  it('una tarea mensual del día 31 cae en el último día de los meses cortos sin desplazarse', () => {
    const base = new Date('2026-01-31T09:00:00');

    expect(calculateNextValidOccurrence(base, 'monthly', 1, new Date('2026-02-01T00:00:00'), 0)).toEqual(
      new Date('2026-02-28T09:00:00'),
    );
    // Tras febrero vuelve al 31, no se queda en el 28 (ni en el 3, como antes)
    expect(calculateNextValidOccurrence(base, 'monthly', 1, new Date('2026-03-01T00:00:00'), 0)).toEqual(
      new Date('2026-03-31T09:00:00'),
    );
    expect(calculateNextValidOccurrence(base, 'monthly', 1, new Date('2026-04-01T00:00:00'), 0)).toEqual(
      new Date('2026-04-30T09:00:00'),
    );
  });

  it('respeta el 29 de febrero en años bisiestos', () => {
    expect(addMonthsClamped(new Date('2027-12-31T09:00:00'), 2)).toEqual(new Date('2028-02-29T09:00:00'));
  });

  it('no devuelve ocurrencia para tareas únicas o tipos desconocidos', () => {
    const base = new Date('2026-03-01T09:00:00');

    expect(calculateNextValidOccurrence(base, 'once', 1, NOW, 0)).toBeNull();
    expect(calculateNextValidOccurrence(base, 'yearly', 1, NOW, 0)).toBeNull();
  });
});
