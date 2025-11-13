import fetchAPI, { API_ENDPOINTS } from '../config/api';
import { Reminder } from '../types';

export interface DashboardStats {
  total: number;
  pending: number;
  overdue: number;
  completed: number;
  upcoming: number;
}

export interface DashboardData {
  stats: DashboardStats;
  upcomingReminders: Reminder[];
  companiesCount: number;
}

export const dashboardService = {
  /**
   * Obtener datos del dashboard
   */
  async getDashboard(): Promise<DashboardData> {
    return fetchAPI<DashboardData>(API_ENDPOINTS.dashboard);
  },
};

