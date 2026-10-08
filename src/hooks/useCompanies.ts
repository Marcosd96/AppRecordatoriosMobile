import { useCallback, useEffect, useRef, useState } from 'react';
import { Company, Reminder } from '../types';
import { companiesService } from '../services/companiesService';
import { remindersService } from '../services/remindersService';
import { notificationsService } from '../services/notificationsService';
import { CalendarType } from '../config/calendarTypes';

export interface CompaniesMessage {
  title: string;
  message: string;
}

/**
 * Empresas del usuario y sus recordatorios, con las notificaciones sincronizadas.
 * Los errores de carga se notifican con `onError`; las acciones devuelven el mensaje a mostrar.
 */
export function useCompanies(onError: (error: CompaniesMessage) => void) {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [availableCalendars, setAvailableCalendars] = useState<CalendarType[]>([]);

  const onErrorRef = useRef(onError);
  onErrorRef.current = onError;

  /**
   * @param sendImmediate Envía avisos inmediatos de los recordatorios que vencen pronto
   *   (se usa justo después de crear o regenerar recordatorios)
   */
  const loadData = useCallback(async ({ sendImmediate = false } = {}) => {
    try {
      const [companiesData, remindersData] = await Promise.all([
        companiesService.getAll(),
        remindersService.getAll(),
      ]);
      setCompanies(companiesData);
      setReminders(remindersData);

      // Programar notificaciones automáticamente para todos los recordatorios pendientes
      await notificationsService.syncReminders(remindersData, { sendImmediate });
    } catch (error: any) {
      console.error('Error al cargar datos:', error);
      onErrorRef.current({
        title: 'Error',
        message:
          error.message ||
          'No se pudieron cargar los datos. Verifica tu conexión.',
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const loadAvailableCalendars = useCallback(async () => {
    try {
      const calendars = await companiesService.getAvailableCalendars();
      console.log('[CompaniesScreen] Calendarios disponibles:', calendars.length);
      setAvailableCalendars(calendars);
    } catch (error) {
      console.error('Error al cargar calendarios disponibles:', error);
    }
  }, []);

  useEffect(() => {
    // Inicializar notificaciones al montar el componente
    const initializeNotifications = async () => {
      await notificationsService.createNotificationChannel();
      await notificationsService.requestPermissions();
    };

    initializeNotifications();
    loadData();
    loadAvailableCalendars();
  }, [loadData, loadAvailableCalendars]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
  }, [loadData]);

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
            message: { title: 'Error', message: 'No se pudo crear la empresa' },
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

        // Recargar datos para obtener los recordatorios generados (y programar sus notificaciones)
        await loadData();

        return {
          created: true,
          message: {
            title: 'Éxito',
            message:
              'Empresa agregada correctamente. Puedes gestionar los calendarios desde la configuración de la empresa.',
          },
        };
      } catch (error: any) {
        console.error('Error al crear empresa:', error);
        return {
          created: false,
          message: { title: 'Error', message: error.message || 'No se pudo crear la empresa' },
        };
      } finally {
        setCreating(false);
      }
    },
    [loadData],
  );

  const deleteCompany = useCallback(
    async (companyId: string): Promise<CompaniesMessage> => {
      try {
        // Obtener los recordatorios de la empresa antes de eliminarla
        const companyReminders = reminders.filter(r => r.companyId === companyId);

        await companiesService.delete(companyId);
        setCompanies(prev => prev.filter(c => c.id !== companyId));
        setReminders(prev => prev.filter(r => r.companyId !== companyId));

        // Cancelar todas las notificaciones de los recordatorios de esta empresa
        for (const reminder of companyReminders) {
          await notificationsService.cancelReminderNotifications(reminder.id);
        }

        return {
          title: 'Éxito',
          message:
            'Empresa eliminada correctamente. Las notificaciones asociadas han sido canceladas.',
        };
      } catch (error: any) {
        console.error('Error al eliminar empresa:', error);
        return { title: 'Error', message: error.message || 'No se pudo eliminar la empresa' };
      }
    },
    [reminders],
  );

  /**
   * Guarda los calendarios de una empresa. Lanza el error para que el selector lo muestre.
   */
  const saveCalendars = useCallback(
    async (company: Company, selectedCalendars: CalendarType[]): Promise<CompaniesMessage> => {
      try {
        await companiesService.update(company.id, {
          name: company.name,
          nit: company.nit,
          cityId: company.cityId,
          calendarTypes: selectedCalendars,
        });

        // Recargar datos (el backend regenera los recordatorios) con avisos inmediatos,
        // porque se acaban de crear/actualizar recordatorios
        await loadData({ sendImmediate: true });

        return {
          title: 'Éxito',
          message:
            'Calendarios actualizados correctamente. Los recordatorios se han regenerado.',
        };
      } catch (error: any) {
        console.error('Error al guardar calendarios:', error);
        throw error;
      }
    },
    [loadData],
  );

  return {
    companies,
    reminders,
    loading,
    refreshing,
    creating,
    availableCalendars,
    onRefresh,
    createCompany,
    deleteCompany,
    saveCalendars,
  };
}
