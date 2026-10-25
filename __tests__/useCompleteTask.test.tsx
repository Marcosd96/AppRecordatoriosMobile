import React from 'react';
import ReactTestRenderer, { act } from 'react-test-renderer';
import { LayoutAnimation } from 'react-native';
import { useCompleteTask } from '../src/hooks/useCompleteTask';
import { PersonalTask } from '../src/types';

const mockShowSnackbar = jest.fn();
jest.mock('../src/context/SnackbarContext', () => ({
  useSnackbar: () => ({ showSnackbar: mockShowSnackbar }),
}));

const task = { id: 't1', title: 'Enviar soportes' } as PersonalTask;

function renderCompleteTask(
  completeTask: Parameters<typeof useCompleteTask>[0],
  onError: Parameters<typeof useCompleteTask>[1],
) {
  const result: { current: ReturnType<typeof useCompleteTask> | null } = { current: null };
  function Probe() {
    result.current = useCompleteTask(completeTask, onError);
    return null;
  }
  act(() => {
    ReactTestRenderer.create(<Probe />);
  });
  return result;
}

describe('useCompleteTask', () => {
  beforeEach(() => jest.clearAllMocks());

  it('anima el cambio y ofrece "Deshacer", que cancela el completado', async () => {
    const configureNext = jest.spyOn(LayoutAnimation, 'configureNext');
    const undo = jest.fn();
    const onError = jest.fn();
    const complete = renderCompleteTask(
      () => ({ undo, done: Promise.resolve({ ok: true }) }),
      onError,
    );

    await act(async () => {
      await complete.current!(task);
    });

    expect(configureNext).toHaveBeenCalledTimes(1);
    const snackbar = mockShowSnackbar.mock.calls[0][0];
    expect(snackbar).toMatchObject({ message: 'Tarea completada', actionLabel: 'Deshacer' });

    snackbar.onAction();
    expect(undo).toHaveBeenCalledTimes(1);
    expect(configureNext).toHaveBeenCalledTimes(2);
    expect(onError).not.toHaveBeenCalled();
    configureNext.mockRestore();
  });

  it('entrega el error a la pantalla si el servidor lo rechaza', async () => {
    const error = { title: 'No se pudo completar la tarea', message: 'sin red' };
    const onError = jest.fn();
    const complete = renderCompleteTask(
      () => ({ undo: jest.fn(), done: Promise.resolve({ ok: false, error }) }),
      onError,
    );

    await act(async () => {
      await complete.current!(task);
    });

    expect(onError).toHaveBeenCalledWith(error);
  });
});
