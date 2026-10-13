import { PersonalTask, Reminder } from '../../types';
import { isTaskOverdue } from '../personalTasks/taskForm';
import { getDaysUntil } from './dashboardFormat';

/** Lo que vence en esta ventana de días (hoy incluido) cuenta como "esta semana" */
export const THIS_WEEK_DAYS = 7;

export interface Agenda {
  /** Recordatorios vencidos, el más antiguo primero */
  overdue: Reminder[];
  /** Pendientes que vencen hoy o en los próximos días */
  thisWeek: Reminder[];
  /** Primer pendiente después de esta semana, para "Lo próximo" cuando no hay nada urgente */
  next: Reminder | null;
  /** Tareas activas para hoy o atrasadas */
  tasksToday: PersonalTask[];
}

const byDueDate = (a: Reminder, b: Reminder) =>
  new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();

const taskDate = (task: PersonalTask) => new Date(task.nextOccurrence || task.startDate);

/**
 * Qué tiene que hacer el usuario: lo vencido, lo de esta semana y las tareas de hoy.
 * Un pendiente con la fecha pasada cuenta como vencido aunque el servidor aún no lo haya marcado.
 */
export function buildAgenda(
  reminders: Reminder[],
  tasks: PersonalTask[],
  now: Date = new Date(),
): Agenda {
  const open = reminders.filter(r => r.status !== 'completed').sort(byDueDate);
  const overdue = open.filter(r => r.status === 'overdue' || getDaysUntil(r.dueDate, now) < 0);
  const upcoming = open.filter(r => !overdue.includes(r));
  const thisWeek = upcoming.filter(r => getDaysUntil(r.dueDate, now) < THIS_WEEK_DAYS);
  const next = upcoming.find(r => !thisWeek.includes(r)) ?? null;

  const endOfToday = new Date(now);
  endOfToday.setHours(23, 59, 59, 999);
  const tasksToday = tasks
    .filter(
      task =>
        task.status === 'active' &&
        (isTaskOverdue(task, now) || taskDate(task).getTime() <= endOfToday.getTime()),
    )
    .sort((a, b) => taskDate(a).getTime() - taskDate(b).getTime());

  return { overdue, thisWeek, next, tasksToday };
}

/** Resumen corto para la cabecera de Inicio */
export function summarizeAgenda({ overdue, thisWeek, tasksToday }: Agenda): string {
  const parts: string[] = [];
  if (overdue.length > 0) {
    parts.push(`${overdue.length} vencido${overdue.length === 1 ? '' : 's'}`);
  }
  if (thisWeek.length > 0) {
    parts.push(`${thisWeek.length} esta semana`);
  }
  if (tasksToday.length > 0) {
    parts.push(`${tasksToday.length} tarea${tasksToday.length === 1 ? '' : 's'} hoy`);
  }
  return parts.length > 0 ? parts.join(' · ') : 'Todo al día';
}
