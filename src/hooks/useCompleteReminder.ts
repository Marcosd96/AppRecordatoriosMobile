import { useCallback } from 'react';
import { useSnackbar } from '../context/SnackbarContext';
import { Reminder } from '../types';
import { ActionResult, UserMessage } from './actionResult';

/**
 * Completar o reabrir un recordatorio desde cualquier lista. Completar es la acción más
 * frecuente y es reversible: se aplica al momento y se ofrece "Deshacer" en lugar de pedir
 * confirmación. Los errores se entregan a `onError` para que la pantalla los muestre.
 */
export function useCompleteReminder(
  reminders: Reminder[],
  toggleReminder: (id: string) => Promise<ActionResult>,
  onError: (message: UserMessage) => void,
) {
  const { showSnackbar } = useSnackbar();

  return useCallback(
    async (id: string) => {
      const completing = reminders.find(r => r.id === id)?.status !== 'completed';
      const result = await toggleReminder(id);
      if (!result.ok) {
        onError(result.error);
      } else if (completing) {
        showSnackbar({
          message: 'Recordatorio completado',
          actionLabel: 'Deshacer',
          onAction: async () => {
            const undo = await toggleReminder(id);
            if (!undo.ok) {
              onError(undo.error);
            }
          },
        });
      }
    },
    [reminders, toggleReminder, onError, showSnackbar],
  );
}
