import fetchAPI, { API_ENDPOINTS } from '../config/api';
import { Company, City } from '../types';
import { CalendarType, isKnownCalendarType } from '../config/calendarTypes';

export interface CreateCompanyData {
  name: string;
  nit: string;
  cityId?: string;
  calendarTypes?: CalendarType[];
}

export interface UpdateCompanyData {
  name: string;
  nit: string;
  /** null quita la ciudad; si se omite, queda sin cambios */
  cityId?: string | null;
  calendarTypes?: CalendarType[];
  /** Subtipos municipales: null = todos los de la ciudad; si se omite, quedan sin cambios */
  municipalSubtypeIds?: string[] | null;
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
   * Actualizar una empresa
   */
  async update(id: string, data: UpdateCompanyData): Promise<{ success: boolean; company: Company }> {
    return fetchAPI<{ success: boolean; company: Company }>(
      API_ENDPOINTS.company(id),
      {
        method: 'PUT',
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

  /**
   * Obtener calendarios disponibles
   */
  async getAvailableCalendars(): Promise<CalendarType[]> {
    try {
      // v=2: la app ya admite los calendarios que la 1.7.x no conocía (seguridad social)
      const response = await fetchAPI<{ availableTypes: string[] }>(
        `${API_ENDPOINTS.calendars}?v=2`
      );
      // Un tipo que esta versión no conoce no tiene nombre ni descripción: se omite
      return (response.availableTypes || []).filter(isKnownCalendarType);
    } catch (error) {
      console.error('Error al obtener calendarios disponibles:', error);
      return [];
    }
  },

  /**
   * Obtener ciudades disponibles
   */
  async getCities(): Promise<City[]> {
    try {
      return await fetchAPI<City[]>(API_ENDPOINTS.cities);
    } catch (error) {
      console.error('Error al obtener ciudades:', error);
      return [];
    }
  },
};

