import { PersonalTask, RecurrenceType, TaskPriority, TaskStatus } from '../../types';
import { CreatePersonalTaskPayload } from '../../services/personalTasksService';

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
): FormMessage | null => {
  if (!formState.title.trim()) {
    return {
      title: 'Validación',
      message: 'El título es obligatorio.',
    };
  }

  // Validar que la fecha no sea demasiado lejana (probablemente un error)
  const oneYearFromNow = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);

  if (formState.startDate > oneYearFromNow) {
    return {
      title: '⚠️ Fecha muy lejana',
      message: `La fecha seleccionada es: ${formState.startDate.toLocaleString('es-CO', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })}\n\n¿Estás seguro? Esta fecha es más de 1 año en el futuro.\n\nVerifica que el año sea correcto.`,
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

/** "Aviso 15 min antes", "Aviso 2 h antes" o "Sin aviso" */
export const formatReminderLead = (task: PersonalTask): string => {
  if (!task.reminderEnabled) return 'Sin aviso';
  const minutes = task.reminderMinutes;
  if (minutes >= 60 && minutes % 60 === 0) return `Aviso ${minutes / 60} h antes`;
  return `Aviso ${minutes} min antes`;
};
