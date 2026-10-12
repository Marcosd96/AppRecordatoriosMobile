import { useEffect } from 'react';
import { usePersonalTasksQuery, useRemindersQuery } from '../hooks/queries';
import { widgetService } from '../services/widgetService';

/**
 * Mantiene al día el widget de Android con los próximos vencimientos cada vez que cambian
 * los recordatorios o las tareas en la caché. Se monta mientras hay sesión. No dibuja nada.
 */
export default function WidgetSync() {
  const { data: reminders } = useRemindersQuery();
  const { data: tasks } = usePersonalTasksQuery();

  useEffect(() => {
    // Hasta tener ambos no se envía nada, para no mostrar un widget a medias
    if (reminders && tasks) {
      widgetService.update(reminders, tasks);
    }
  }, [reminders, tasks]);

  return null;
}
