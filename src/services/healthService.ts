import fetchAPI, { API_ENDPOINTS } from '../config/api';

export interface HealthResponse {
  status: string;
  message: string;
  timestamp: string;
}

export const healthService = {
  /**
   * Verificar conectividad con el servidor
   */
  async check(): Promise<HealthResponse> {
    return fetchAPI<HealthResponse>(API_ENDPOINTS.health);
  },
};

