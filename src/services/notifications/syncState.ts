import { Reminder, PersonalTask } from '../../types';

// Una sincronización se considera vigente durante una hora y dentro del mismo día,
// porque qué avisos quedan en el futuro depende de la hora actual
const SYNC_MAX_AGE_MS = 60 * 60 * 1000;

export interface SyncRecord {
  fingerprint: string;
  at: number;
}

export function isSyncFresh(
  last: SyncRecord | null,
  fingerprint: string,
  now: number = Date.now(),
): boolean {
  return (
    last !== null &&
    last.fingerprint === fingerprint &&
    now - last.at < SYNC_MAX_AGE_MS &&
    new Date(now).toDateString() === new Date(last.at).toDateString()
  );
}

// Solo cuentan los datos que afectan a qué notificaciones se programan y cuándo
export function reminderFingerprint(reminders: Reminder[]): string {
  return reminders
    .map(r => `${r.id}|${r.status}|${new Date(r.dueDate).getTime()}|${r.description}|${r.companyName}`)
    .sort()
    .join('\n');
}

export function personalTaskFingerprint(tasks: PersonalTask[]): string {
  return tasks
    .map(t =>
      [
        t.id,
        t.status,
        t.reminderEnabled,
        t.reminderMinutes,
        new Date(t.nextOccurrence || t.startDate).getTime(),
        t.recurrenceType,
        t.recurrenceInterval,
        t.title,
        t.description,
        t.priority,
      ].join('|'),
    )
    .sort()
    .join('\n');
}
