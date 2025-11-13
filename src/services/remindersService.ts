import fetchAPI, { API_ENDPOINTS } from '../config/api';
import { Reminder } from '../types';

export const remindersService = {
  /**
   * Obtener todos los recordatorios
   */
  async getAll(): Promise<Reminder[]> {
    return fetchAPI<Reminder[]>(API_ENDPOINTS.reminders);
  },

  /**
   * Cambiar el estado de un recordatorio (completado/pendiente)
   */
  async toggleStatus(
    id: string,
    currentStatus: 'pending' | 'completed' | 'overdue'
  ): Promise<{ success: boolean; reminder: Reminder }> {
    return fetchAPI<{ success: boolean; reminder: Reminder }>(
      API_ENDPOINTS.reminderToggle(id),
      {
        method: 'POST',
      }
    );
  },
};

