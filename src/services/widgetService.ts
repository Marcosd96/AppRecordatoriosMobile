import { NativeModules, Platform } from 'react-native';
import { PersonalTask, Reminder } from '../types';

/**
 * Datos del widget de Android "Próximos vencimientos". El widget los lee del
 * almacenamiento nativo y calcula él mismo "Hoy", "Mañana", etc., para que sigan siendo
 * correctos aunque la app no se abra en días.
 */

export const MAX_WIDGET_ITEMS = 4;

export interface WidgetItem {
  kind: 'reminder' | 'task';
  id: string;
  title: string;
  subtitle: string;
  /** Fecha y hora en milisegundos */
  dueAt: number;
  /** Los recordatorios vencen en un día, sin hora concreta */
  allDay: boolean;
}

export interface WidgetData {
  items: WidgetItem[];
  /** Fechas de todos los recordatorios sin completar: el widget cuenta los vencidos al dibujarse */
  reminderDueAts: number[];
}

/**
 * Recordatorios sin completar y tareas activas, ordenados por fecha: lo vencido o atrasado
 * queda primero
 */
export function buildWidgetData(
  reminders: Reminder[],
  tasks: PersonalTask[],
): WidgetData {
  const reminderItems: WidgetItem[] = reminders
    .filter(r => r.status !== 'completed')
    .map(r => ({
      kind: 'reminder',
      id: r.id,
      title: r.description,
      subtitle: r.companyName,
      dueAt: new Date(r.dueDate).getTime(),
      allDay: true,
    }));

  const taskItems: WidgetItem[] = tasks
    .filter(t => t.status === 'active')
    .map(t => ({
      kind: 'task' as const,
      id: t.id,
      title: t.title,
      subtitle: 'Tarea personal',
      dueAt: new Date(t.nextOccurrence || t.startDate).getTime(),
      allDay: false,
    }));

  const items = [...reminderItems, ...taskItems]
    .filter(item => !isNaN(item.dueAt))
    .sort((a, b) => a.dueAt - b.dueAt);

  return {
    items: items.slice(0, MAX_WIDGET_ITEMS),
    reminderDueAts: reminderItems.map(r => r.dueAt).filter(dueAt => !isNaN(dueAt)),
  };
}

interface GesaccolWidgetModule {
  setData(json: string): void;
  clear(): void;
}

const nativeWidget: GesaccolWidgetModule | undefined =
  Platform.OS === 'android' ? NativeModules.GesaccolWidget : undefined;

let lastSent: string | null = null;

export const widgetService = {
  update(reminders: Reminder[], tasks: PersonalTask[]): void {
    if (!nativeWidget) {
      return;
    }
    // Solo se reenvía si cambia lo que se ve
    const json = JSON.stringify(buildWidgetData(reminders, tasks));
    if (json === lastSent) {
      return;
    }
    lastSent = json;
    try {
      nativeWidget.setData(json);
    } catch (error) {
      console.error('[Widget] Error al actualizar el widget:', error);
    }
  },

  /** Al cerrar sesión, el widget no debe seguir mostrando datos */
  clear(): void {
    lastSent = null;
    try {
      nativeWidget?.clear();
    } catch (error) {
      console.error('[Widget] Error al vaciar el widget:', error);
    }
  },
};
