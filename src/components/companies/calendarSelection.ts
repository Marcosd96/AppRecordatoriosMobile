import { CalendarType } from '../../config/calendarTypes';
import { MunicipalSubtype } from '../../types';

export const MUNICIPAL_CALENDAR: CalendarType = 'IMPUESTOS_MUNICIPALES';

export interface CalendarSelection {
  calendarTypes: CalendarType[];
  /**
   * Subtipos municipales: array = solo esos, null = todos los de la ciudad,
   * undefined = no se envía (sin subtipos que elegir o sin calendario municipal)
   */
  municipalSubtypeIds?: string[] | null;
}

/**
 * Subtipos marcados al abrir el selector: los que eligió la empresa o, si nunca eligió, todos
 * (es lo que recibe hoy). Se descartan los que ya no existen en su ciudad.
 */
export function initialSubtypeIds(
  saved: string[] | undefined,
  available: MunicipalSubtype[],
): string[] {
  if (!saved) {
    return available.map(subtype => subtype.id);
  }
  return available.filter(subtype => saved.includes(subtype.id)).map(subtype => subtype.id);
}

/** Lo que se guarda a partir de lo marcado en el selector */
export function buildCalendarSelection(
  calendarTypes: CalendarType[],
  subtypeIds: string[],
  available: MunicipalSubtype[],
): CalendarSelection {
  // Sin catálogo de subtipos (ciudad sin subtipos o backend antiguo) no hay nada que elegir
  if (available.length === 0 || !calendarTypes.includes(MUNICIPAL_CALENDAR)) {
    return { calendarTypes };
  }

  const chosen = available.filter(subtype => subtypeIds.includes(subtype.id));
  if (chosen.length === 0) {
    // Ningún impuesto municipal marcado equivale a no usar el calendario municipal
    return { calendarTypes: calendarTypes.filter(type => type !== MUNICIPAL_CALENDAR) };
  }
  // Todos marcados se guarda como "todos": así recibe también los que se añadan a su ciudad
  if (chosen.length === available.length) {
    return { calendarTypes, municipalSubtypeIds: null };
  }
  return { calendarTypes, municipalSubtypeIds: chosen.map(subtype => subtype.id) };
}
