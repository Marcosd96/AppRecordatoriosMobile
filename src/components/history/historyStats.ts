import { PersonalTask, Reminder } from '../../types';

export const HISTORY_MONTHS = 6;

export interface MonthSummary {
  /** "2026-10" */
  key: string;
  /** "oct" */
  label: string;
  remindersOnTime: number;
  remindersLate: number;
  taskCompletions: number;
}

export interface HistoryEntry {
  kind: 'reminder' | 'task';
  /** ID del recordatorio o de la tarea (una tarea recurrente aparece una vez por completado) */
  id: string;
  title: string;
  subtitle?: string;
  completedAt: Date;
  /** Solo recordatorios: si se completó antes de terminar el día de vencimiento */
  onTime?: boolean;
}

export interface History {
  months: MonthSummary[];
  /** Completados dentro del periodo, del más reciente al más antiguo */
  entries: HistoryEntry[];
  remindersCompleted: number;
  /** Porcentaje de recordatorios completados a tiempo (null si no hay ninguno) */
  onTimeRate: number | null;
  taskCompletions: number;
}

const monthKey = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

const endOfDay = (date: Date) => {
  const result = new Date(date);
  result.setHours(23, 59, 59, 999);
  return result;
};

/**
 * Fechas en que se completó una tarea. Si el servidor no envía el detalle de completados,
 * se usa al menos la última vez que se completó.
 */
function taskCompletionDates(task: PersonalTask): Date[] {
  if (task.completions?.length) {
    return task.completions.map(c => new Date(c.completedAt));
  }
  return task.lastCompletedAt ? [new Date(task.lastCompletedAt)] : [];
}

/**
 * Resume lo completado en los últimos meses (el actual incluido)
 */
export function buildHistory(
  reminders: Reminder[],
  tasks: PersonalTask[],
  now: Date = new Date(),
  monthsCount: number = HISTORY_MONTHS,
): History {
  const start = new Date(now.getFullYear(), now.getMonth() - (monthsCount - 1), 1);
  const monthFormat = new Intl.DateTimeFormat('es-CO', { month: 'short' });

  const months: MonthSummary[] = [];
  for (let i = 0; i < monthsCount; i++) {
    const date = new Date(start.getFullYear(), start.getMonth() + i, 1);
    months.push({
      key: monthKey(date),
      label: monthFormat.format(date).replace('.', ''),
      remindersOnTime: 0,
      remindersLate: 0,
      taskCompletions: 0,
    });
  }
  const byKey = new Map(months.map(m => [m.key, m]));
  const inRange = (date: Date) =>
    !isNaN(date.getTime()) && date >= start && date.getTime() <= now.getTime();

  const entries: HistoryEntry[] = [];

  for (const reminder of reminders) {
    if (reminder.status !== 'completed' || !reminder.completedAt) {
      continue;
    }
    const completedAt = new Date(reminder.completedAt);
    if (!inRange(completedAt)) {
      continue;
    }
    const onTime = completedAt <= endOfDay(new Date(reminder.dueDate));
    const month = byKey.get(monthKey(completedAt))!;
    if (onTime) {
      month.remindersOnTime++;
    } else {
      month.remindersLate++;
    }
    entries.push({
      kind: 'reminder',
      id: reminder.id,
      title: reminder.description,
      subtitle: reminder.companyName,
      completedAt,
      onTime,
    });
  }

  for (const task of tasks) {
    for (const completedAt of taskCompletionDates(task)) {
      if (!inRange(completedAt)) {
        continue;
      }
      byKey.get(monthKey(completedAt))!.taskCompletions++;
      entries.push({ kind: 'task', id: task.id, title: task.title, completedAt });
    }
  }

  entries.sort((a, b) => b.completedAt.getTime() - a.completedAt.getTime());

  const onTime = months.reduce((sum, m) => sum + m.remindersOnTime, 0);
  const late = months.reduce((sum, m) => sum + m.remindersLate, 0);
  const remindersCompleted = onTime + late;

  return {
    months,
    entries,
    remindersCompleted,
    onTimeRate: remindersCompleted > 0 ? Math.round((onTime / remindersCompleted) * 100) : null,
    taskCompletions: months.reduce((sum, m) => sum + m.taskCompletions, 0),
  };
}
