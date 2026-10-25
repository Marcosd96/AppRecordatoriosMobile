import { useCallback } from 'react';
import { useSnackbar } from '../context/SnackbarContext';
import { PersonalTask } from '../types';
import { ActionResult, UserMessage } from './actionResult';
import { useListTransition } from './useReducedMotion';

type CompleteTask = (task: PersonalTask) => { undo: () => void; done: Promise<ActionResult> };

/**
 * Completar una tarea desde cualquier lista (Tareas, Inicio). Se ve completada al momento,
 * con "Deshacer" en el snackbar; el envío espera a que se cierre (ver `completeTask` de
 * usePersonalTasks). La tarjeta cambia de sitio, así que el cambio se anima. Los errores se
 * entregan a `onError` para que la pantalla los muestre.
 */
export function useCompleteTask(
  completeTask: CompleteTask,
  onError: (message: UserMessage) => void,
) {
  const { showSnackbar } = useSnackbar();
  const animateLayout = useListTransition();

  return useCallback(
    async (task: PersonalTask) => {
      animateLayout();
      const { undo, done } = completeTask(task);
      showSnackbar({
        message: 'Tarea completada',
        actionLabel: 'Deshacer',
        onAction: () => {
          animateLayout();
          undo();
        },
      });
      const result = await done;
      if (!result.ok) {
        onError(result.error);
      }
    },
    [completeTask, onError, showSnackbar, animateLayout],
  );
}
