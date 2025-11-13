import fetchAPI, { API_ENDPOINTS } from '../config/api';
import { Company } from '../types';

export interface CreateCompanyData {
  name: string;
  nit: string;
  cityId?: string;
}

export const companiesService = {
  /**
   * Obtener todas las empresas
   */
  async getAll(): Promise<Company[]> {
    return fetchAPI<Company[]>(API_ENDPOINTS.companies);
  },

  /**
   * Crear una nueva empresa
   */
  async create(data: CreateCompanyData): Promise<{ success: boolean; company: Company }> {
    return fetchAPI<{ success: boolean; company: Company }>(
      API_ENDPOINTS.companies,
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    );
  },

  /**
   * Eliminar una empresa
   */
  async delete(id: string): Promise<{ success: boolean }> {
    return fetchAPI<{ success: boolean }>(API_ENDPOINTS.company(id), {
      method: 'DELETE',
    });
  },
};

