import { useCallback } from 'react';
import { useSnackbar } from '../context/SnackbarContext';
import { Reminder } from '../types';
import { ActionResult, UserMessage } from './actionResult';
import { useListTransition } from './useReducedMotion';

/**
 * Completar o reabrir un recordatorio desde cualquier lista. Completar es la acción más
 * frecuente y es reversible: se aplica al momento y se ofrece "Deshacer" en lugar de pedir
 * confirmación. Los errores se entregan a `onError` para que la pantalla los muestre.
 *
 * Al completarlo, la tarjeta cambia de sitio (sale de "Vencidos", pasa al final de la lista):
 * una transición breve muestra adónde fue en lugar de un salto.
 */
export function useCompleteReminder(
  reminders: Reminder[],
  toggleReminder: (id: string) => Promise<ActionResult>,
  onError: (message: UserMessage) => void,
) {
  const { showSnackbar } = useSnackbar();
  const animateLayout = useListTransition();

  return useCallback(
    async (id: string) => {
      const completing = reminders.find(r => r.id === id)?.status !== 'completed';
      animateLayout();
      const result = await toggleReminder(id);
      if (!result.ok) {
        onError(result.error);
      } else if (completing) {
        showSnackbar({
          message: 'Recordatorio completado',
          actionLabel: 'Deshacer',
          onAction: async () => {
            animateLayout();
            const undo = await toggleReminder(id);
            if (!undo.ok) {
              onError(undo.error);
            }
          },
        });
      }
    },
    [reminders, toggleReminder, onError, showSnackbar, animateLayout],
  );
}
