import {
  NO_CITY_KEY,
  cityIdFromKey,
  cityKey,
  cityName,
  cityOptions,
} from '../src/components/companies/cityOptions';

const cities = [
  { id: 'c2', name: 'Medellín' },
  { id: 'c1', name: 'Bogotá' },
  { id: 'c3', name: 'Cúcuta' },
];

describe('cityOptions', () => {
  it('pone "Sin ciudad" primero y ordena las ciudades por nombre', () => {
    expect(cityOptions(cities)).toEqual([
      { key: NO_CITY_KEY, label: 'Sin ciudad' },
      { key: 'c1', label: 'Bogotá' },
      { key: 'c3', label: 'Cúcuta' },
      { key: 'c2', label: 'Medellín' },
    ]);
  });

  it('sin catálogo solo ofrece "Sin ciudad"', () => {
    expect(cityOptions([])).toEqual([{ key: NO_CITY_KEY, label: 'Sin ciudad' }]);
  });

  it('no altera la lista recibida', () => {
    const input = [...cities];
    cityOptions(input);
    expect(input).toEqual(cities);
  });
});

describe('cityKey / cityIdFromKey', () => {
  it('convierte la ausencia de ciudad en la clave "Sin ciudad" y de vuelta en null', () => {
    expect(cityKey(undefined)).toBe(NO_CITY_KEY);
    expect(cityKey(null)).toBe(NO_CITY_KEY);
    expect(cityKey('')).toBe(NO_CITY_KEY);
    expect(cityIdFromKey(NO_CITY_KEY)).toBeNull();
  });

  it('conserva el id de una ciudad', () => {
    expect(cityKey('c1')).toBe('c1');
    expect(cityIdFromKey('c1')).toBe('c1');
  });
});

describe('cityName', () => {
  it('devuelve el nombre de la ciudad', () => {
    expect(cityName(cities, 'c3')).toBe('Cúcuta');
  });

  it('devuelve undefined sin ciudad o si no está en el catálogo', () => {
    expect(cityName(cities, undefined)).toBeUndefined();
    expect(cityName(cities, null)).toBeUndefined();
    expect(cityName(cities, 'x')).toBeUndefined();
  });
});
