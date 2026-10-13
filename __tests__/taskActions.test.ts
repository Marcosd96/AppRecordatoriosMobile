import { buildTaskActionGroups } from '../src/components/personalTasks/taskActions';
import { PersonalTask } from '../src/types';

const noop = () => {};
const handlers = {
  edit: noop,
  pause: noop,
  cancel: noop,
  remove: noop,
  diagnose: noop,
  reschedule: noop,
  testIn2Minutes: noop,
  testIn10Seconds: noop,
};

const task = (overrides: Partial<PersonalTask>): PersonalTask => ({
  id: 't',
  userId: 'u',
  title: 'Revisar',
  isRecurring: false,
  startDate: '2026-10-20T10:00:00Z',
  status: 'active',
  priority: 'medium',
  reminderEnabled: true,
  reminderMinutes: 60,
  createdAt: '2026-10-01T00:00:00Z',
  updatedAt: '2026-10-01T00:00:00Z',
  ...overrides,
});

const keys = (t: PersonalTask) =>
  buildTaskActionGroups(t, handlers).map(group => group.actions.map(action => action.key));

describe('buildTaskActionGroups', () => {
  it('una tarea activa con aviso ofrece pausar, cancelar y el diagnóstico', () => {
    expect(keys(task({}))).toEqual([
      ['edit', 'pause', 'cancel', 'delete'],
      ['diagnose', 'reschedule', 'test', 'quick-test'],
    ]);
  });

  it('sin aviso no hay diagnóstico', () => {
    expect(keys(task({ reminderEnabled: false }))[1]).toEqual([]);
  });

  it('una tarea pausada no se pausa otra vez (reanudar es la acción visible)', () => {
    expect(keys(task({ status: 'paused' }))[0]).toEqual(['edit', 'cancel', 'delete']);
  });

  it('una tarea cerrada solo se edita o elimina', () => {
    expect(keys(task({ status: 'completed' }))).toEqual([['edit', 'delete'], []]);
    expect(keys(task({ status: 'cancelled' }))[0]).toEqual(['edit', 'delete']);
  });
});
