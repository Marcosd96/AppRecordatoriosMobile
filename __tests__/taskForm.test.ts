/**
 * @format
 */

import {
  createInitialFormState,
  filterTasks,
  formStateFromTask,
  formatRecurrence,
  formatReminderLead,
  getNextRoundedHour,
  isTaskOverdue,
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
    expect(validateTaskForm(form, NOW)).toMatchObject({
      field: 'title',
      message: 'El título es obligatorio.',
    });
  });

  it('avisa de fechas a más de un año', () => {
    const form = {
      ...createInitialFormState(),
      title: 'Algo',
      startDate: new Date('2027-06-01T10:00:00'),
    };
    expect(validateTaskForm(form, NOW)).toMatchObject({ field: 'startDate', title: 'Fecha muy lejana' });
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

describe('isTaskOverdue', () => {
  const base = {
    id: 't1',
    userId: 'u1',
    title: 'Tarea',
    isRecurring: false,
    priority: 'medium',
    reminderEnabled: true,
    reminderMinutes: 60,
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
  } as const;

  it('una tarea activa con la fecha pasada está atrasada', () => {
    expect(isTaskOverdue({ ...base, status: 'active', startDate: '2026-03-01T10:00:00' }, NOW)).toBe(true);
  });

  it('no lo está si su fecha es futura o si no está activa', () => {
    expect(isTaskOverdue({ ...base, status: 'active', startDate: '2026-03-03T10:00:00' }, NOW)).toBe(false);
    expect(isTaskOverdue({ ...base, status: 'completed', startDate: '2026-03-01T10:00:00' }, NOW)).toBe(false);
  });

  it('usa la próxima ocurrencia antes que la fecha de inicio', () => {
    expect(
      isTaskOverdue(
        { ...base, status: 'active', startDate: '2026-01-01T10:00:00', nextOccurrence: '2026-03-05T10:00:00' },
        NOW,
      ),
    ).toBe(false);
  });
});

describe('formatRecurrence y formatReminderLead', () => {
  const base = {
    id: 't',
    userId: 'u',
    title: 'Revisar',
    isRecurring: true,
    recurrenceType: 'weekly' as const,
    recurrenceInterval: 1,
    startDate: '2026-10-12T10:00:00Z',
    status: 'active' as const,
    priority: 'medium' as const,
    reminderEnabled: true,
    reminderMinutes: 60,
    createdAt: '2026-10-01T00:00:00Z',
    updatedAt: '2026-10-01T00:00:00Z',
  };

  it('usa singular con intervalo 1 y plural con más', () => {
    expect(formatRecurrence(base)).toBe('Cada semana');
    expect(formatRecurrence({ ...base, recurrenceType: 'monthly', recurrenceInterval: 3 })).toBe(
      'Cada 3 meses',
    );
    expect(formatRecurrence({ ...base, isRecurring: false })).toBeNull();
  });

  it('expresa la antelación del aviso en horas cuando es exacta', () => {
    expect(formatReminderLead(base)).toBe('Aviso 1 h antes');
    expect(formatReminderLead({ ...base, reminderMinutes: 15 })).toBe('Aviso 15 min antes');
    expect(formatReminderLead({ ...base, reminderEnabled: false })).toBe('Sin aviso');
  });
});

describe('filterTasks', () => {
  const make = (id: string, status: PersonalTask['status'], date: string, description = '') => ({
    ...task,
    id,
    title: id,
    status,
    description,
    nextOccurrence: null,
    startDate: date,
  });
  const tasks = [
    make('later', 'active', '2026-03-10T10:00:00'),
    make('sooner', 'active', '2026-03-05T10:00:00', 'Llamar al CONTADOR'),
    make('paused', 'paused', '2026-03-01T10:00:00'),
  ];

  it('filtra por estado y ordena por fecha', () => {
    expect(filterTasks(tasks, 'active', '').map(t => t.id)).toEqual(['sooner', 'later']);
  });

  it('busca en título y descripción sin distinguir mayúsculas', () => {
    expect(filterTasks(tasks, 'all', ' contador ').map(t => t.id)).toEqual(['sooner']);
  });
});
