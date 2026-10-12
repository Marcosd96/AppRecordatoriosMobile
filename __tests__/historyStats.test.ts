/**
 * Tests del resumen del historial de completados
 */

import { buildHistory } from '../src/components/history/historyStats';
import { PersonalTask, Reminder } from '../src/types';

const NOW = new Date('2026-10-15T12:00:00');

const reminder = (id: string, dueDate: string, completedAt?: string): Reminder => ({
  id,
  companyId: 'c1',
  companyName: 'Acme',
  type: 'iva',
  period: '2026',
  dueDate,
  description: `Recordatorio ${id}`,
  status: completedAt ? 'completed' : 'pending',
  completedAt,
});

const task = (id: string, overrides: Partial<PersonalTask>): PersonalTask => ({
  id,
  userId: 'u1',
  title: `Tarea ${id}`,
  isRecurring: false,
  startDate: '2026-10-01T10:00:00',
  status: 'active',
  priority: 'medium',
  reminderEnabled: true,
  reminderMinutes: 60,
  createdAt: '2026-01-01',
  updatedAt: '2026-01-01',
  ...overrides,
});

describe('buildHistory', () => {
  it('crea los últimos 6 meses terminando en el actual', () => {
    const history = buildHistory([], [], NOW);
    expect(history.months.map(m => m.key)).toEqual([
      '2026-05',
      '2026-06',
      '2026-07',
      '2026-08',
      '2026-09',
      '2026-10',
    ]);
    expect(history.onTimeRate).toBeNull();
  });

  it('separa los recordatorios completados a tiempo de los tardíos', () => {
    const history = buildHistory(
      [
        // Completado el mismo día del vencimiento, por la noche: a tiempo
        reminder('a', '2026-10-10T00:00:00', '2026-10-10T22:00:00'),
        reminder('b', '2026-10-01T00:00:00', '2026-10-03T09:00:00'),
        reminder('c', '2026-09-20T00:00:00', '2026-09-18T09:00:00'),
        reminder('pendiente', '2026-10-20T00:00:00'),
      ],
      [],
      NOW,
    );
    const october = history.months[5];
    expect(october.remindersOnTime).toBe(1);
    expect(october.remindersLate).toBe(1);
    expect(history.months[4].remindersOnTime).toBe(1);
    expect(history.remindersCompleted).toBe(3);
    expect(history.onTimeRate).toBe(67);
    expect(history.entries.map(e => e.id)).toEqual(['a', 'b', 'c']);
    expect(history.entries.find(e => e.id === 'b')?.onTime).toBe(false);
  });

  it('ignora lo completado fuera del periodo', () => {
    const history = buildHistory([reminder('viejo', '2026-01-01', '2026-01-01T10:00:00')], [], NOW);
    expect(history.entries).toHaveLength(0);
  });

  it('cuenta cada completado de una tarea recurrente y, sin detalle, el último', () => {
    const history = buildHistory(
      [],
      [
        task('recurrente', {
          completions: [
            { id: '1', taskId: 'recurrente', completedAt: '2026-10-01T10:00:00', scheduledFor: '2026-10-01' },
            { id: '2', taskId: 'recurrente', completedAt: '2026-10-08T10:00:00', scheduledFor: '2026-10-08' },
          ],
        }),
        task('simple', { lastCompletedAt: '2026-09-05T10:00:00' }),
      ],
      NOW,
    );
    expect(history.months[5].taskCompletions).toBe(2);
    expect(history.months[4].taskCompletions).toBe(1);
    expect(history.taskCompletions).toBe(3);
  });
});
