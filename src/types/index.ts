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

