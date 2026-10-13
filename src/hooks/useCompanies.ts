import { useCallback, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Company } from '../types';
import { companiesService } from '../services/companiesService';
import { remindersService } from '../services/remindersService';
import { notificationsService } from '../services/notificationsService';
import { CalendarType } from '../config/calendarTypes';
import { queryKeys } from '../config/queryClient';
import {
  useCalendarsQuery,
  useCompaniesQuery,
  useRefetchOnFocus,
  useRemindersQuery,
} from './queries';

export interface CompaniesMessage {
  title: string;
  message: string;
}

export interface CompaniesResult {
  ok: boolean;
  message: CompaniesMessage;
}

/**
 * Empresas del usuario y sus recordatorios, desde la caché (también sin conexión).
 * Las notificaciones las sincroniza NotificationSync al cambiar los recordatorios.
 * El error de carga se expone en `loadError`. Las acciones devuelven si salieron bien y el
 * mensaje: los éxitos se confirman con un snackbar y los errores con un diálogo.
 */
export function useCompanies() {
  const queryClient = useQueryClient();
  const companiesQuery = useCompaniesQuery();
  const remindersQuery = useRemindersQuery();
  const calendarsQuery = useCalendarsQuery();
  const [refreshing, setRefreshing] = useState(false);
  const [creating, setCreating] = useState(false);

  useRefetchOnFocus([companiesQuery, remindersQuery]);

  // Error de carga solo si no hay datos guardados: la pantalla lo muestra con "Reintentar"
  const loadErrorSource = companiesQuery.error ?? remindersQuery.error;
  const hasData = companiesQuery.data !== undefined && remindersQuery.data !== undefined;
  const loadError =
    loadErrorSource && !hasData
      ? (loadErrorSource as Error).message || 'No se pudieron cargar las empresas.'
      : null;

  /**
   * Vuelve a pedir empresas, recordatorios y panel (el backend genera o borra recordatorios
   * al cambiar empresas)
   */
  const refreshAfterChange = useCallback(
    () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.companies }),
        queryClient.invalidateQueries({ queryKey: queryKeys.reminders }),
        queryClient.invalidateQueries({ queryKey: queryKeys.dashboard }),
      ]),
    [queryClient],
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([companiesQuery.refetch(), remindersQuery.refetch()]);
    setRefreshing(false);
  }, [companiesQuery, remindersQuery]);

  /**
   * Crea una empresa sin calendarios preseleccionados.
   * @returns el mensaje a mostrar y si se creó
   */
  const createCompany = useCallback(
    async (name: string, nit: string): Promise<{ created: boolean; message: CompaniesMessage }> => {
      setCreating(true);
      try {
        const result = await companiesService.create({
          name,
          nit,
          calendarTypes: [], // No preseleccionar calendarios
        });

        if (!result.success || !result.company) {
          return {
            created: false,
            message: { title: 'No se pudo crear la empresa', message: 'Inténtalo de nuevo.' },
          };
        }

        // Si el backend asignó calendarios por defecto, limpiarlos
        const company = result.company;
        if (company.calendarTypes && company.calendarTypes.length > 0) {
          try {
            await companiesService.update(company.id, {
              name: company.name,
              nit: company.nit,
              cityId: company.cityId,
              calendarTypes: [], // Limpiar calendarios preseleccionados
            });
          } catch (updateError) {
            console.error('Error al limpiar calendarios preseleccionados:', updateError);
            // Continuar aunque falle la actualización
          }
        }

        await refreshAfterChange();

        return {
          created: true,
          message: {
            title: 'Empresa creada',
            message: 'Empresa creada. Elige sus calendarios para generar los recordatorios.',
          },
        };
      } catch (error: any) {
        console.error('Error al crear empresa:', error);
        return {
          created: false,
          message: {
            title: 'No se pudo crear la empresa',
            message: error.message || 'Inténtalo de nuevo.',
          },
        };
      } finally {
        setCreating(false);
      }
    },
    [refreshAfterChange],
  );

  const deleteCompany = useCallback(
    async (companyId: string): Promise<CompaniesResult> => {
      try {
        await companiesService.delete(companyId);
        // Al recargar, la empresa y sus recordatorios desaparecen y NotificationSync
        // cancela sus notificaciones
        await refreshAfterChange();

        return {
          ok: true,
          message: { title: 'Empresa eliminada', message: 'Empresa eliminada y sus avisos cancelados.' },
        };
      } catch (error: any) {
        console.error('Error al eliminar empresa:', error);
        return {
          ok: false,
          message: {
            title: 'No se pudo eliminar la empresa',
            message: error.message || 'Inténtalo de nuevo.',
          },
        };
      }
    },
    [refreshAfterChange],
  );

  /**
   * Guarda los calendarios de una empresa. Lanza el error para que el selector lo muestre.
   */
  const saveCalendars = useCallback(
    async (company: Company, selectedCalendars: CalendarType[]): Promise<string> => {
      try {
        await companiesService.update(company.id, {
          name: company.name,
          nit: company.nit,
          cityId: company.cityId,
          calendarTypes: selectedCalendars,
        });

        // El backend regenera los recordatorios: pedirlos ya y programarlos con avisos
        // inmediatos, porque se acaban de crear/actualizar
        const reminders = await queryClient.fetchQuery({
          queryKey: queryKeys.reminders,
          queryFn: () => remindersService.getAll(),
          staleTime: 0,
        });
        await notificationsService.syncReminders(reminders, { sendImmediate: true });
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: queryKeys.companies }),
          queryClient.invalidateQueries({ queryKey: queryKeys.dashboard }),
        ]);

        return 'Calendarios guardados. Los recordatorios se regeneraron.';
      } catch (error: any) {
        console.error('Error al guardar calendarios:', error);
        throw error;
      }
    },
    [queryClient],
  );

  return {
    companies: companiesQuery.data ?? [],
    reminders: remindersQuery.data ?? [],
    // Solo se muestra la pantalla de carga si no hay nada guardado y se está pidiendo
    loading: companiesQuery.isPending && companiesQuery.fetchStatus === 'fetching',
    loadError,
    retrying: companiesQuery.isFetching || remindersQuery.isFetching,
    retry: () => {
      companiesQuery.refetch();
      remindersQuery.refetch();
    },
    refreshing,
    creating,
    availableCalendars: calendarsQuery.data ?? [],
    onRefresh,
    createCompany,
    deleteCompany,
    saveCalendars,
  };
}
