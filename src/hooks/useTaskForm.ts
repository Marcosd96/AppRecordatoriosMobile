import { useCallback, useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';
import { PersonalTask } from '../types';
import {
  TaskFormField,
  TaskFormState,
  createInitialFormState,
  formStateFromTask,
  serializeTaskForm,
  validateTaskForm,
} from '../components/personalTasks/taskForm';
import { CreatePersonalTaskPayload } from '../services/personalTasksService';
import { ActionResult } from './actionResult';

type SaveTask = (
  payload: CreatePersonalTaskPayload,
  editingTask: PersonalTask | null,
) => Promise<ActionResult>;

/**
 * Estado de la hoja de crear/editar tarea: qué se edita, los valores, los errores por campo
 * y el guardado. Los errores de validación se muestran junto al campo, no en un diálogo.
 */
export function useTaskForm(saveTask: SaveTask) {
  const [visible, setVisible] = useState(false);
  const [formState, setFormState] = useState<TaskFormState>(createInitialFormState);
  const [editingTask, setEditingTask] = useState<PersonalTask | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<TaskFormField, string>>>({});

  // El error de un campo desaparece en cuanto el usuario lo cambia
  useEffect(() => {
    setErrors(current => (current.title ? { ...current, title: undefined } : current));
  }, [formState.title]);
  useEffect(() => {
    setErrors(current => (current.startDate ? { ...current, startDate: undefined } : current));
  }, [formState.startDate]);

  const open = useCallback((task: PersonalTask | null) => {
    setErrors({});
    setEditingTask(task);
    setFormState(task ? formStateFromTask(task) : createInitialFormState());
    setVisible(true);
  }, []);

  const reset = useCallback(() => {
    setErrors({});
    setVisible(false);
    setEditingTask(null);
    setFormState(createInitialFormState());
  }, []);

  const close = useCallback(() => {
    if (!submitting) {
      reset();
    }
  }, [submitting, reset]);

  /**
   * Valida y guarda. Devuelve null si el formulario no es válido (el error ya se ve junto al
   * campo); si el guardado falla, la hoja sigue abierta con lo que se escribió.
   */
  const submit = useCallback(async (): Promise<ActionResult | null> => {
    const validationError = validateTaskForm(formState);
    if (validationError) {
      setErrors({ [validationError.field]: validationError.message });
      AccessibilityInfo.announceForAccessibility(validationError.message);
      return null;
    }

    setSubmitting(true);
    const result = await saveTask(serializeTaskForm(formState), editingTask);
    setSubmitting(false);
    if (result.ok) {
      reset();
    }
    return result;
  }, [formState, editingTask, saveTask, reset]);

  return {
    visible,
    formState,
    setFormState,
    isEditing: editingTask !== null,
    submitting,
    errors,
    openCreate: () => open(null),
    openEdit: open,
    close,
    submit,
  };
}
