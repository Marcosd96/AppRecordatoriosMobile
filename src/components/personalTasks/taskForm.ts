import { PersonalTask, RecurrenceType, TaskPriority, TaskStatus } from '../../types';
import { CreatePersonalTaskPayload } from '../../services/personalTasksService';
import { calculateNextValidOccurrence } from '../../services/notifications/recurrence';

export type StatusFilter = TaskStatus | 'all';

export type TaskStatusAction = 'pause' | 'resume' | 'cancel' | 'complete';

export interface TaskFormState {
  title: string;
  description: string;
  priority: TaskPriority;
  reminderEnabled: boolean;
  reminderMinutes: string;
  isRecurring: boolean;
  recurrenceType: RecurrenceType;
  recurrenceInterval: string;
  startDate: Date;
  showDatePicker: boolean;
  showTimePicker: boolean;
}

export interface FormMessage {
  title: string;
  message: string;
}

/** Campos del formulario que pueden tener un error de validación */
export type TaskFormField = 'title' | 'startDate';

/** Error de validación: se muestra bajo el campo indicado, no en un diálogo */
export interface TaskFormError extends FormMessage {
  field: TaskFormField;
}

export const priorityLabels: Record<TaskPriority, string> = {
  low: 'Baja',
  medium: 'Media',
  high: 'Alta',
  urgent: 'Urgente',
};

export const statusLabels: Record<TaskStatus, string> = {
  active: 'Activa',
  paused: 'Pausada',
  completed: 'Completada',
  cancelled: 'Cancelada',
};

// Próxima hora redondeada (ej: si son las 2:34 PM, devuelve 3:00 PM)
export const getNextRoundedHour = (now: Date = new Date()) => {
  const nextHour = new Date(now);
  nextHour.setHours(now.getHours() + 1);
  nextHour.setMinutes(0);
  nextHour.setSeconds(0);
  nextHour.setMilliseconds(0);
  return nextHour;
};

// Se calcula en cada apertura del formulario para que la fecha por defecto no quede en el pasado
export const createInitialFormState = (): TaskFormState => ({
  title: '',
  description: '',
  priority: 'medium',
  reminderEnabled: true,
  reminderMinutes: '60',
  isRecurring: false,
  recurrenceType: 'once',
  recurrenceInterval: '1',
  startDate: getNextRoundedHour(),
  showDatePicker: false,
  showTimePicker: false,
});

export const formStateFromTask = (task: PersonalTask): TaskFormState => {
  const taskStartDate = task.nextOccurrence || task.startDate;
  return {
    title: task.title,
    description: task.description || '',
    priority: task.priority,
    reminderEnabled: task.reminderEnabled,
    reminderMinutes: String(task.reminderMinutes ?? 60),
    isRecurring: task.isRecurring,
    recurrenceType: task.recurrenceType || 'once',
    recurrenceInterval: String(task.recurrenceInterval ?? 1),
    startDate: taskStartDate ? new Date(taskStartDate) : getNextRoundedHour(),
    showDatePicker: false,
    showTimePicker: false,
  };
};

/**
 * Devuelve el mensaje a mostrar si el formulario no es válido, o null si se puede guardar
 */
export const validateTaskForm = (
  formState: TaskFormState,
  now: Date = new Date(),
): TaskFormError | null => {
  if (!formState.title.trim()) {
    return {
      field: 'title',
      title: 'Falta el título',
      message: 'El título es obligatorio.',
    };
  }

  // Validar que la fecha no sea demasiado lejana (probablemente un error)
  const oneYearFromNow = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);

  if (formState.startDate > oneYearFromNow) {
    return {
      field: 'startDate',
      title: 'Fecha muy lejana',
      message: 'Es más de un año en el futuro. Revisa que el año sea correcto.',
    };
  }

  return null;
};

export const serializeTaskForm = (formState: TaskFormState): CreatePersonalTaskPayload => {
  const reminderMinutesNumber = Number(formState.reminderMinutes) || 60;
  const recurrenceIntervalNumber = Number(formState.recurrenceInterval) || 1;

  const basePayload: CreatePersonalTaskPayload = {
    title: formState.title.trim(),
    description: formState.description.trim()
      ? formState.description.trim()
      : undefined,
    startDate: formState.startDate.toISOString(),
    priority: formState.priority,
    reminderEnabled: formState.reminderEnabled,
    reminderMinutes: reminderMinutesNumber,
    isRecurring: formState.isRecurring,
  };

  if (formState.isRecurring) {
    basePayload.recurrenceType = formState.recurrenceType;
    basePayload.recurrenceInterval = recurrenceIntervalNumber;
  } else {
    basePayload.recurrenceType = 'once';
  }

  return basePayload;
};

export const formatTaskDate = (date?: Date | string | null) => {
  if (!date) return 'Sin fecha';
  try {
    return new Intl.DateTimeFormat('es-CO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(date));
  } catch {
    return String(date);
  }
};

/**
 * Tarea activa cuya fecha ya pasó sin completarse (p. ej. una tarea única que nadie marcó)
 */
export const isTaskOverdue = (task: PersonalTask, now: Date = new Date()): boolean => {
  if (task.status !== 'active') return false;
  const due = new Date(task.nextOccurrence || task.startDate).getTime();
  return !isNaN(due) && due < now.getTime();
};

const recurrenceUnits: Partial<Record<RecurrenceType, [string, string]>> = {
  daily: ['día', 'días'],
  weekly: ['semana', 'semanas'],
  monthly: ['mes', 'meses'],
};

/** "Cada semana", "Cada 2 meses"… o null si la tarea no se repite */
export const formatRecurrence = (task: PersonalTask): string | null => {
  if (!task.isRecurring) return null;
  const units = task.recurrenceType ? recurrenceUnits[task.recurrenceType] : undefined;
  if (!units) return 'Se repite';
  const interval = task.recurrenceInterval ?? 1;
  return interval <= 1
    ? `Cada ${units[0]}`
    : `Cada ${interval} ${units[1]}`;
};

const MINUTES_PER_DAY = 24 * 60;

/** Antelación en texto corto: "15 min", "2 h", "1 día", "3 días" */
export const formatLeadTime = (minutes: number): string => {
  if (minutes >= MINUTES_PER_DAY && minutes % MINUTES_PER_DAY === 0) {
    const days = minutes / MINUTES_PER_DAY;
    return `${days} día${days === 1 ? '' : 's'}`;
  }
  if (minutes >= 60 && minutes % 60 === 0) return `${minutes / 60} h`;
  return `${minutes} min`;
};

/** "Aviso 15 min antes", "Aviso 1 día antes" o "Sin aviso" */
export const formatReminderLead = (task: PersonalTask): string =>
  task.reminderEnabled ? `Aviso ${formatLeadTime(task.reminderMinutes)} antes` : 'Sin aviso';

/**
 * Antelaciones habituales del aviso, a un toque en el formulario. Un contador piensa en
 * "un día antes", no en 1440 minutos; el resto se escribe en "Otro".
 */
export const REMINDER_LEAD_PRESETS = [15, 60, MINUTES_PER_DAY] as const;

export const isPresetLead = (minutes: string): boolean =>
  (REMINDER_LEAD_PRESETS as readonly number[]).includes(Number(minutes));

/**
 * Subtítulo de la pestaña: tareas activas y atrasadas. Sin tareas no hay subtítulo (el
 * estado vacío ya lo explica).
 */
export const summarizeTasks = (tasks: PersonalTask[], now: Date = new Date()): string | undefined => {
  if (tasks.length === 0) return undefined;
  const active = tasks.filter(task => task.status === 'active').length;
  const overdue = tasks.filter(task => isTaskOverdue(task, now)).length;
  if (active === 0) return 'Sin tareas activas';
  const parts = [`${active} activa${active === 1 ? '' : 's'}`];
  if (overdue > 0) parts.push(`${overdue} atrasada${overdue === 1 ? '' : 's'}`);
  return parts.join(' · ');
};

const isClosed = (task: PersonalTask) => task.status === 'completed' || task.status === 'cancelled';

/**
 * Tareas que cumplen el filtro de estado y la búsqueda. Primero las abiertas, por fecha de la
 * próxima ejecución; las completadas y canceladas van al final, la más reciente primero.
 */
export const filterTasks = (
  tasks: PersonalTask[],
  statusFilter: StatusFilter,
  search: string,
): PersonalTask[] => {
  const query = search.trim().toLowerCase();
  const time = (task: PersonalTask) => new Date(task.nextOccurrence || task.startDate).getTime();
  return tasks
    .filter(
      task =>
        (statusFilter === 'all' || task.status === statusFilter) &&
        (!query ||
          task.title.toLowerCase().includes(query) ||
          (task.description || '').toLowerCase().includes(query)),
    )
    .sort((a, b) => {
      if (isClosed(a) !== isClosed(b)) {
        return isClosed(a) ? 1 : -1;
      }
      return isClosed(a) ? time(b) - time(a) : time(a) - time(b);
    });
};

/**
 * Cómo queda una tarea al completarla, para mostrarlo mientras aún se puede deshacer. Una
 * recurrente pasa a su siguiente ocurrencia (el servidor confirma la fecha al guardar); las
 * demás quedan completadas.
 */
export const completedTaskPreview = (task: PersonalTask): PersonalTask => {
  const current = new Date(task.nextOccurrence || task.startDate);
  const next =
    task.isRecurring && !isNaN(current.getTime())
      ? calculateNextValidOccurrence(
          current,
          task.recurrenceType ?? 'once',
          task.recurrenceInterval || 1,
          current,
          0,
        )
      : null;
  return next
    ? { ...task, nextOccurrence: next.toISOString() }
    : { ...task, status: 'completed' };
};
