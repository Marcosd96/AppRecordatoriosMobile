const MAX_ITERATIONS = 365; // Límite de seguridad para evitar bucles infinitos

/**
 * Suma meses conservando el día del mes; si el mes de destino es más corto, se queda en su
 * último día (31 ene + 1 mes = 28/29 feb, no 3 mar)
 */
export function addMonthsClamped(date: Date, months: number): Date {
  const result = new Date(date);
  result.setDate(1);
  result.setMonth(result.getMonth() + months);
  const lastDay = new Date(result.getFullYear(), result.getMonth() + 1, 0).getDate();
  result.setDate(Math.min(date.getDate(), lastDay));
  return result;
}

/**
 * Ocurrencia número `n` contando desde la fecha base. Se calcula siempre desde la base, no
 * desde la anterior, para que un día 31 no se convierta en 28 para siempre tras febrero.
 * @returns null si el tipo no tiene siguientes ocurrencias ('once' o desconocido)
 */
function nthOccurrence(base: Date, recurrenceType: string, interval: number, n: number): Date | null {
  const result = new Date(base);
  switch (recurrenceType) {
    case 'daily':
      result.setDate(result.getDate() + n * interval);
      return result;
    case 'weekly':
      result.setDate(result.getDate() + 7 * n * interval);
      return result;
    case 'monthly':
      return addMonthsClamped(base, n * interval);
    default:
      return null;
  }
}

/**
 * Calcula la próxima ocurrencia de una tarea recurrente cuyo aviso
 * (la fecha menos reminderMinutes) todavía no ha pasado
 */
export function calculateNextValidOccurrence(
  baseDate: Date,
  recurrenceType: string,
  recurrenceInterval: number,
  now: Date,
  reminderMinutes: number,
): Date | null {
  for (let n = 1; n <= MAX_ITERATIONS; n++) {
    const occurrence = nthOccurrence(baseDate, recurrenceType, recurrenceInterval, n);
    if (!occurrence) {
      return null;
    }
    const notificationDate = new Date(occurrence);
    notificationDate.setMinutes(notificationDate.getMinutes() - reminderMinutes);
    if (notificationDate.getTime() > now.getTime()) {
      return occurrence;
    }
  }

  // No se encontró una fecha válida en el rango
  return null;
}
