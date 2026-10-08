export const formatDate = (date: Date | string): string => {
  return new Intl.DateTimeFormat('es-CO', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(date));
};

/**
 * Días completos que faltan hasta la fecha (0 = hoy, negativo = vencida)
 */
export const getDaysUntil = (dueDate: Date | string, today: Date = new Date()): number => {
  const now = new Date(today);
  now.setHours(0, 0, 0, 0);
  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);
  return Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
};

/**
 * Tiempo restante en texto ("en 2 días", "en 3 horas", "muy pronto")
 */
export const formatTimeUntil = (date: Date, now: Date = new Date()): string => {
  const notificationDate = new Date(date);
  const diffMs = notificationDate.getTime() - now.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffHours = Math.floor(
    (diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60),
  );
  const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

  if (diffDays > 0) {
    return `en ${diffDays} día${diffDays > 1 ? 's' : ''}`;
  } else if (diffHours > 0) {
    return `en ${diffHours} hora${diffHours > 1 ? 's' : ''}`;
  } else if (diffMinutes > 0) {
    return `en ${diffMinutes} minuto${diffMinutes > 1 ? 's' : ''}`;
  } else {
    return 'muy pronto';
  }
};
