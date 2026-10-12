/**
 * Tests de los datos que la app envía al widget de Android
 */

import { MAX_WIDGET_ITEMS, buildWidgetData } from '../src/services/widgetService';
import { PersonalTask, Reminder } from '../src/types';

const reminder = (id: string, dueDate: string, status: Reminder['status'] = 'pending'): Reminder => ({
  id,
  companyId: 'c1',
  companyName: 'Acme',
  type: 'iva',
  period: '2026',
  dueDate,
  description: `Recordatorio ${id}`,
  status,
});

const task = (id: string, startDate: string, status: PersonalTask['status'] = 'active'): PersonalTask => ({
  id,
  userId: 'u1',
  title: `Tarea ${id}`,
  isRecurring: false,
  startDate,
  status,
  priority: 'medium',
  reminderEnabled: true,
  reminderMinutes: 60,
  createdAt: '2026-01-01',
  updatedAt: '2026-01-01',
});

describe('buildWidgetData', () => {
  it('ordena por fecha (lo vencido y atrasado primero) y descarta lo completado o inactivo', () => {
    const data = buildWidgetData(
      [
        reminder('vencido', '2026-10-10T00:00:00'),
        reminder('hecho', '2026-10-16T00:00:00', 'completed'),
        reminder('manana', '2026-10-16T00:00:00'),
      ],
      [
        task('hoy', '2026-10-15T18:00:00'),
        task('ayer', '2026-10-14T18:00:00'),
        task('pausada', '2026-10-15T19:00:00', 'paused'),
      ],
    );

    expect(data.items.map(i => i.id)).toEqual(['vencido', 'ayer', 'hoy', 'manana']);
    expect(data.items[0]).toMatchObject({ kind: 'reminder', subtitle: 'Acme', allDay: true });
    expect(data.items[1]).toMatchObject({ kind: 'task', allDay: false });
    // El widget cuenta los vencidos a partir de todas las fechas pendientes
    expect(data.reminderDueAts).toHaveLength(2);
  });

  it('muestra como mucho MAX_WIDGET_ITEMS', () => {
    const reminders = Array.from({ length: 10 }, (_, i) => reminder(`r${i}`, `2026-10-${20 + i}T00:00:00`));
    expect(buildWidgetData(reminders, []).items).toHaveLength(MAX_WIDGET_ITEMS);
  });
});
