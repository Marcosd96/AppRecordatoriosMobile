import { isKnownCalendarType } from '../src/config/calendarTypes';
import {
  MUNICIPAL_CALENDAR,
  buildCalendarSelection,
  initialSubtypeIds,
} from '../src/components/companies/calendarSelection';

const subtypes = [
  { id: 'ica', name: 'Industria y Comercio' },
  { id: 'predial', name: 'Predial' },
  { id: 'gasolina', name: 'Sobretasa a la gasolina' },
];

describe('initialSubtypeIds', () => {
  it('marca todos si la empresa nunca eligió', () => {
    expect(initialSubtypeIds(undefined, subtypes)).toEqual(['ica', 'predial', 'gasolina']);
  });

  it('marca los elegidos y descarta los que ya no existen', () => {
    expect(initialSubtypeIds(['predial', 'borrado'], subtypes)).toEqual(['predial']);
  });

  it('respeta una elección vacía', () => {
    expect(initialSubtypeIds([], subtypes)).toEqual([]);
  });
});

describe('buildCalendarSelection', () => {
  it('no envía subtipos si la ciudad no tiene', () => {
    expect(buildCalendarSelection([MUNICIPAL_CALENDAR], ['ica'], [])).toEqual({
      calendarTypes: [MUNICIPAL_CALENDAR],
    });
  });

  it('no envía subtipos si no usa el calendario municipal', () => {
    expect(buildCalendarSelection(['IVA_BIMESTRAL'], ['ica'], subtypes)).toEqual({
      calendarTypes: ['IVA_BIMESTRAL'],
    });
  });

  it('guarda solo los subtipos marcados, en el orden del catálogo', () => {
    expect(
      buildCalendarSelection(['IVA_BIMESTRAL', MUNICIPAL_CALENDAR], ['gasolina', 'ica'], subtypes),
    ).toEqual({
      calendarTypes: ['IVA_BIMESTRAL', MUNICIPAL_CALENDAR],
      municipalSubtypeIds: ['ica', 'gasolina'],
    });
  });

  it('todos marcados se guarda como "todos" (null)', () => {
    expect(
      buildCalendarSelection([MUNICIPAL_CALENDAR], ['ica', 'predial', 'gasolina'], subtypes),
    ).toEqual({ calendarTypes: [MUNICIPAL_CALENDAR], municipalSubtypeIds: null });
  });

  it('ninguno marcado quita el calendario municipal', () => {
    expect(buildCalendarSelection(['IVA_BIMESTRAL', MUNICIPAL_CALENDAR], [], subtypes)).toEqual({
      calendarTypes: ['IVA_BIMESTRAL'],
    });
  });

  it('ignora ids que no están en el catálogo', () => {
    expect(buildCalendarSelection([MUNICIPAL_CALENDAR], ['borrado'], subtypes)).toEqual({
      calendarTypes: [],
    });
  });
});

describe('isKnownCalendarType', () => {
  it('reconoce los tipos de la app, incluida la seguridad social', () => {
    expect(isKnownCalendarType('SEGURIDAD_SOCIAL')).toBe(true);
    expect(isKnownCalendarType('IVA_BIMESTRAL')).toBe(true);
  });

  it('descarta los tipos que esta versión no conoce', () => {
    expect(isKnownCalendarType('CALENDARIO_FUTURO')).toBe(false);
    expect(isKnownCalendarType('toString')).toBe(false);
  });
});
