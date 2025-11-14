/**
 * Tipos de calendarios tributarios soportados
 */
export type CalendarType = 
  | 'IVA_BIMESTRAL'
  | 'IVA_CUATRIMESTRAL'
  | 'RETENCION_MENSUAL'
  | 'RENTA_GRANDES_CONTRIBUYENTES'
  | 'RENTA_PERSONAS_JURIDICAS'
  | 'RENTA_PERSONAS_NATURALES'
  | 'RST_ANUAL'
  | 'RST_ANTICIPO_BIMESTRAL'
  | 'PRECIOS_TRANSFERENCIA'
  | 'IMPUESTO_PATRIMONIO'
  | 'RUB'
  | 'PES'
  | 'NOMINA_ELECTRONICA'
  | 'NOMINA_QUINCENAL'
  | 'NOMINA_MENSUAL'
  | 'IMPUESTOS_MUNICIPALES';

/**
 * Configuración de cada tipo de calendario
 */
export interface CalendarConfig {
  id: CalendarType;
  name: string;
  description: string;
  expectedPeriods: number;
  periodType: 'bimestral' | 'mensual' | 'cuatrimestral' | 'trimestral' | 'anual' | 'especial';
  usesLastDigit?: boolean;
  usesLastTwoDigits?: boolean;
  usesDigitPairs?: boolean;
  requiresCity?: boolean;
  variableName: string;
  periodDescriptions?: Record<string, string>;
}

export const CALENDAR_CONFIGS: Record<CalendarType, CalendarConfig> = {
  IVA_BIMESTRAL: {
    id: 'IVA_BIMESTRAL',
    name: 'IVA Bimestral',
    description: 'Declaración y pago bimestral del IVA',
    expectedPeriods: 6,
    periodType: 'bimestral',
    usesLastDigit: true,
    variableName: 'ivaBimestralCalendar',
  },
  IVA_CUATRIMESTRAL: {
    id: 'IVA_CUATRIMESTRAL',
    name: 'IVA Cuatrimestral',
    description: 'Declaración y pago cuatrimestral del IVA',
    expectedPeriods: 3,
    periodType: 'cuatrimestral',
    usesLastDigit: true,
    variableName: 'ivaCuatrimestralCalendar',
  },
  RETENCION_MENSUAL: {
    id: 'RETENCION_MENSUAL',
    name: 'Retención en la Fuente',
    description: 'Declaración mensual y pago de retención en la fuente',
    expectedPeriods: 12,
    periodType: 'mensual',
    usesLastDigit: true,
    variableName: 'retencionMensualCalendar',
  },
  RENTA_GRANDES_CONTRIBUYENTES: {
    id: 'RENTA_GRANDES_CONTRIBUYENTES',
    name: 'Renta Grandes Contribuyentes',
    description: 'Declaración y pagos de renta para grandes contribuyentes',
    expectedPeriods: 3,
    periodType: 'especial',
    usesLastDigit: true,
    variableName: 'rentaGrandesContribuyentesCalendar',
  },
  RENTA_PERSONAS_JURIDICAS: {
    id: 'RENTA_PERSONAS_JURIDICAS',
    name: 'Renta Personas Jurídicas',
    description: 'Declaración y pagos de renta para personas jurídicas',
    expectedPeriods: 2,
    periodType: 'especial',
    usesLastDigit: true,
    variableName: 'rentaPersonasJuridicasCalendar',
  },
  RENTA_PERSONAS_NATURALES: {
    id: 'RENTA_PERSONAS_NATURALES',
    name: 'Renta Personas Naturales',
    description: 'Declaración y pago de renta para personas naturales',
    expectedPeriods: 3,
    periodType: 'especial',
    usesLastDigit: false,
    usesLastTwoDigits: true,
    variableName: 'rentaPersonasNaturalesCalendar',
  },
  RST_ANUAL: {
    id: 'RST_ANUAL',
    name: 'RST - Declaración Anual',
    description: 'Registro Simplificado del Tributario - Declaración anual',
    expectedPeriods: 2,
    periodType: 'especial',
    usesLastDigit: false,
    usesDigitPairs: true,
    variableName: 'rstAnualCalendar',
  },
  RST_ANTICIPO_BIMESTRAL: {
    id: 'RST_ANTICIPO_BIMESTRAL',
    name: 'RST - Anticipo Bimestral',
    description: 'Registro Simplificado del Tributario - Anticipo bimestral',
    expectedPeriods: 6,
    periodType: 'bimestral',
    usesLastDigit: true,
    variableName: 'rstAnticipoBimestralCalendar',
  },
  PRECIOS_TRANSFERENCIA: {
    id: 'PRECIOS_TRANSFERENCIA',
    name: 'Precios de Transferencia',
    description: 'Presentación de declaración informativa y documentación',
    expectedPeriods: 2,
    periodType: 'especial',
    usesLastDigit: true,
    variableName: 'preciosTransferenciaCalendar',
  },
  IMPUESTO_PATRIMONIO: {
    id: 'IMPUESTO_PATRIMONIO',
    name: 'Impuesto al Patrimonio',
    description: 'Declaración y pago del impuesto al patrimonio',
    expectedPeriods: 2,
    periodType: 'especial',
    usesLastDigit: true,
    variableName: 'impuestoPatrimonioCalendar',
  },
  RUB: {
    id: 'RUB',
    name: 'RUB - Registro Único de Beneficiarios',
    description: 'Actualización del Registro Único de Beneficiarios Finales',
    expectedPeriods: 4,
    periodType: 'especial',
    usesLastDigit: false,
    variableName: 'rubCalendar',
  },
  PES: {
    id: 'PES',
    name: 'PES - Presencia Económica Significativa',
    description: 'Pagos anticipados bimestrales y declaración anual',
    expectedPeriods: 7,
    periodType: 'bimestral',
    usesLastDigit: false,
    variableName: 'pesCalendar',
  },
  NOMINA_ELECTRONICA: {
    id: 'NOMINA_ELECTRONICA',
    name: 'Nómina Electrónica',
    description: 'Calendario de fechas límite de emisión de nómina electrónica',
    expectedPeriods: 12,
    periodType: 'mensual',
    usesLastDigit: false,
    variableName: 'nominaElectronicaCalendar',
  },
  NOMINA_QUINCENAL: {
    id: 'NOMINA_QUINCENAL',
    name: 'Pago de Nómina Quincenal',
    description: 'Pago de nómina quincenal (días 15 y 30 de cada mes)',
    expectedPeriods: 24,
    periodType: 'mensual',
    usesLastDigit: false,
    variableName: 'nominaQuincenalCalendar',
  },
  NOMINA_MENSUAL: {
    id: 'NOMINA_MENSUAL',
    name: 'Pago de Nómina Mensual',
    description: 'Pago de nómina mensual (día 30 de cada mes)',
    expectedPeriods: 12,
    periodType: 'mensual',
    usesLastDigit: false,
    variableName: 'nominaMensualCalendar',
  },
  IMPUESTOS_MUNICIPALES: {
    id: 'IMPUESTOS_MUNICIPALES',
    name: 'Impuestos Municipales',
    description: 'Calendario de impuestos municipales - Específico por ciudad',
    expectedPeriods: 4,
    periodType: 'trimestral',
    usesLastDigit: false,
    requiresCity: true,
    variableName: 'impuestosMunicipalesCalendar',
  },
};

