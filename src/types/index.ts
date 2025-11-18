/**
 * Tipos para el sistema de recordatorios fiscales - React Native
 */

export interface Company {
  id: string;
  name: string;
  nit: string;
  cityId?: string;
  calendarTypes?: string[];
  createdAt: Date | string;
}

export interface City {
  id: string;
  name: string;
}

export interface Reminder {
  id: string;
  companyId: string;
  companyName: string;
  type: string;
  period: string;
  dueDate: Date | string;
  description: string;
  status: 'pending' | 'completed' | 'overdue';
  completedAt?: Date | string;
}

export type ReminderStatus = 'pending' | 'completed' | 'overdue';

export type ReminderFilter = 'all' | 'pending' | 'overdue' | 'upcoming';

export type SortBy = 'date' | 'company' | 'type';

export type TaskStatus = 'active' | 'paused' | 'completed' | 'cancelled';

export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export type RecurrenceType = 'once' | 'daily' | 'weekly' | 'monthly' | 'custom';

export interface TaskCompletion {
  id: string;
  taskId: string;
  completedAt: string | Date;
  scheduledFor: string | Date;
  notes?: string | null;
}

export interface PersonalTask {
  id: string;
  userId: string;
  title: string;
  description?: string | null;
  isRecurring: boolean;
  recurrenceType?: RecurrenceType | null;
  recurrenceInterval?: number | null;
  weekDays?: number[] | null;
  monthDay?: number | null;
  startDate: string | Date;
  endDate?: string | Date | null;
  nextOccurrence?: string | Date | null;
  status: TaskStatus;
  priority: TaskPriority;
  reminderEnabled: boolean;
  reminderMinutes: number;
  createdAt: string | Date;
  updatedAt: string | Date;
  lastCompletedAt?: string | Date | null;
  completions?: TaskCompletion[];
}

