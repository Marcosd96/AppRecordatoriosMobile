/**
 * @format
 */

import {
  createInitialFormState,
  formStateFromTask,
  getNextRoundedHour,
  serializeTaskForm,
  validateTaskForm,
} from '../src/components/personalTasks/taskForm';
import { PersonalTask } from '../src/types';

const NOW = new Date('2026-03-02T14:34:00');

const task: PersonalTask = {
  id: 't1',
  userId: 'u1',
  title: 'Pagar arriendo',
  description: null,
  isRecurring: true,
  recurrenceType: 'monthly',
  recurrenceInterval: 1,
  startDate: '2026-03-05T09:00:00.000Z',
  nextOccurrence: '2026-04-05T09:00:00.000Z',
  status: 'active',
  priority: 'high',
  reminderEnabled: true,
  reminderMinutes: 30,
  createdAt: NOW.toISOString(),
  updatedAt: NOW.toISOString(),
};

describe('taskForm', () => {
  afterEach(() => jest.useRealTimers());

  it('redondea a la próxima hora en punto', () => {
    expect(getNextRoundedHour(NOW)).toEqual(new Date('2026-03-02T15:00:00'));
  });

  it('calcula la fecha por defecto cada vez que se abre el formulario', () => {
    jest.useFakeTimers({ now: NOW });
    const first = createInitialFormState().startDate;
    jest.setSystemTime(new Date('2026-03-02T18:10:00'));
    const later = createInitialFormState().startDate;

    expect(first).toEqual(new Date('2026-03-02T15:00:00'));
    expect(later).toEqual(new Date('2026-03-02T19:00:00'));
  });

  it('carga la próxima ocurrencia al editar una tarea', () => {
    const form = formStateFromTask(task);
    expect(form.startDate).toEqual(new Date('2026-04-05T09:00:00.000Z'));
    expect(form.reminderMinutes).toBe('30');
    expect(form.description).toBe('');
  });

  it('exige título', () => {
    const form = { ...createInitialFormState(), title: '   ' };
    expect(validateTaskForm(form, NOW)?.message).toBe('El título es obligatorio.');
  });

  it('avisa de fechas a más de un año', () => {
    const form = {
      ...createInitialFormState(),
      title: 'Algo',
      startDate: new Date('2027-06-01T10:00:00'),
    };
    expect(validateTaskForm(form, NOW)?.title).toBe('⚠️ Fecha muy lejana');
  });

  it('acepta un formulario válido', () => {
    const form = { ...createInitialFormState(), title: 'Algo', startDate: new Date('2026-03-03T10:00:00') };
    expect(validateTaskForm(form, NOW)).toBeNull();
  });

  it('serializa una tarea única sin intervalo de recurrencia', () => {
    const payload = serializeTaskForm({
      ...createInitialFormState(),
      title: '  Llamar  ',
      description: '  ',
      reminderMinutes: '',
      recurrenceInterval: '3',
    });
    expect(payload).toMatchObject({
      title: 'Llamar',
      description: undefined,
      reminderMinutes: 60,
      isRecurring: false,
      recurrenceType: 'once',
    });
    expect(payload.recurrenceInterval).toBeUndefined();
  });

  it('serializa la recurrencia cuando la tarea se repite', () => {
    const payload = serializeTaskForm(formStateFromTask(task));
    expect(payload).toMatchObject({ isRecurring: true, recurrenceType: 'monthly', recurrenceInterval: 1 });
  });
});
