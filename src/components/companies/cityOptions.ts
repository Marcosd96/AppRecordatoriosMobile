import { City } from '../../types';

/** Clave de la opción "Sin ciudad" (los chips necesitan una clave de texto, no null) */
export const NO_CITY_KEY = 'none';

/** Opciones del selector: "Sin ciudad" primero y luego las ciudades por nombre */
export function cityOptions(cities: City[]): Array<{ key: string; label: string }> {
  return [
    { key: NO_CITY_KEY, label: 'Sin ciudad' },
    ...[...cities]
      .sort((a, b) => a.name.localeCompare(b.name, 'es'))
      .map(city => ({ key: city.id, label: city.name })),
  ];
}

/** Clave del chip para una ciudad (null o vacía = sin ciudad) */
export const cityKey = (cityId?: string | null): string => cityId || NO_CITY_KEY;

/** Ciudad que representa una clave de chip; null = sin ciudad */
export const cityIdFromKey = (key: string): string | null => (key === NO_CITY_KEY ? null : key);

/** Nombre de la ciudad de una empresa, o undefined si no tiene o no está en el catálogo */
export const cityName = (cities: City[], cityId?: string | null): string | undefined =>
  cityId ? cities.find(city => city.id === cityId)?.name : undefined;
