/**
 * Tests de la búsqueda global en recordatorios, tareas y empresas
 */

import {
  MAX_RESULTS_PER_GROUP,
  normalizeText,
  searchAll,
} from '../src/components/search/globalSearch';
import { Company, PersonalTask, Reminder } from '../src/types';

const reminder = (id: string, overrides: Partial<Reminder> = {}): Reminder => ({
  id,
  companyId: 'c1',
  companyName: 'Panadería Núñez',
  type: 'renta',
  period: '2026',
  dueDate: '2026-04-10T00:00:00',
  description: 'Declaración de renta',
  status: 'pending',
  ...overrides,
});

const task = (id: string, overrides: Partial<PersonalTask> = {}): PersonalTask => ({
  id,
  userId: 'u1',
  title: 'Revisar extractos',
  description: null,
  isRecurring: false,
  startDate: '2026-04-01T10:00:00',
  status: 'active',
  priority: 'medium',
  reminderEnabled: true,
  reminderMinutes: 60,
  createdAt: '2026-01-01',
  updatedAt: '2026-01-01',
  ...overrides,
});

const company = (id: string, name: string, nit: string): Company => ({
  id,
  name,
  nit,
  createdAt: '2026-01-01',
});

describe('normalizeText', () => {
  it('quita tildes y mayúsculas', () => {
    expect(normalizeText('Declaración NÚÑEZ')).toBe('declaracion nunez');
  });
});

describe('searchAll', () => {
  it('no devuelve nada con la búsqueda vacía', () => {
    expect(searchAll('   ', { reminders: [reminder('r1')] }).total).toBe(0);
  });

  it('encuentra sin importar tildes y con las palabras en cualquier orden', () => {
    const results = searchAll('nunez declaracion', { reminders: [reminder('r1')] });
    expect(results.reminders.map(r => r.id)).toEqual(['r1']);
  });

  it('exige todas las palabras', () => {
    expect(searchAll('renta iva', { reminders: [reminder('r1')] }).total).toBe(0);
  });

  it('busca en tareas y empresas (también por NIT)', () => {
    const results = searchAll('900', {
      tasks: [task('t1', { description: 'Cuenta 900' })],
      companies: [company('c1', 'Acme', '900123456'), company('c2', 'Otra', '800')],
    });
    expect(results.tasks.map(t => t.id)).toEqual(['t1']);
    expect(results.companies.map(c => c.id)).toEqual(['c1']);
    expect(results.total).toBe(2);
  });

  it('pone primero lo pendiente, ordenado por fecha', () => {
    const results = searchAll('renta', {
      reminders: [
        reminder('hecho', { status: 'completed', dueDate: '2026-01-01' }),
        reminder('tarde', { dueDate: '2026-05-01' }),
        reminder('pronto', { dueDate: '2026-03-01' }),
      ],
    });
    expect(results.reminders.map(r => r.id)).toEqual(['pronto', 'tarde', 'hecho']);
  });

  it('limita los resultados por grupo pero cuenta el total', () => {
    const reminders = Array.from({ length: MAX_RESULTS_PER_GROUP + 5 }, (_, i) => reminder(`r${i}`));
    const results = searchAll('renta', { reminders });
    expect(results.reminders).toHaveLength(MAX_RESULTS_PER_GROUP);
    expect(results.total).toBe(MAX_RESULTS_PER_GROUP + 5);
  });
});
