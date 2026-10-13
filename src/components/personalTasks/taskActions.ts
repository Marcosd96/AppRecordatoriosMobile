import type { SheetActionGroup } from '../ActionSheet';
import { PersonalTask } from '../../types';

export interface TaskActionHandlers {
  edit: () => void;
  pause: () => void;
  cancel: () => void;
  remove: () => void;
  diagnose: () => void;
  reschedule: () => void;
  testIn2Minutes: () => void;
  testIn10Seconds: () => void;
}

/**
 * Acciones secundarias de una tarea (hoja ⋮). Completar y reanudar no están aquí: son la
 * acción visible de la tarjeta.
 */
export function buildTaskActionGroups(
  task: PersonalTask,
  handlers: TaskActionHandlers,
): SheetActionGroup[] {
  const isOpen = task.status !== 'cancelled' && task.status !== 'completed';

  return [
    {
      actions: [
        { key: 'edit', label: 'Editar', onPress: handlers.edit },
        ...(task.status === 'active'
          ? [{ key: 'pause', label: 'Pausar', onPress: handlers.pause }]
          : []),
        ...(isOpen ? [{ key: 'cancel', label: 'Cancelar tarea', onPress: handlers.cancel }] : []),
        { key: 'delete', label: 'Eliminar', destructive: true, onPress: handlers.remove },
      ],
    },
    {
      // Herramientas para cuando un aviso no llega: fuera de la tarjeta, pero disponibles
      title: 'Diagnóstico del aviso',
      actions:
        task.status === 'active' && task.reminderEnabled
          ? [
              { key: 'diagnose', label: 'Comprobar aviso', onPress: handlers.diagnose },
              { key: 'reschedule', label: 'Reprogramar aviso', onPress: handlers.reschedule },
              { key: 'test', label: 'Aviso de prueba en 2 minutos', onPress: handlers.testIn2Minutes },
              { key: 'quick-test', label: 'Aviso de prueba en 10 segundos', onPress: handlers.testIn10Seconds },
            ]
          : [],
    },
  ];
}
