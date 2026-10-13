import React from 'react';
import ReactTestRenderer, { act } from 'react-test-renderer';
import { useTaskForm } from '../src/hooks/useTaskForm';

type Hook = ReturnType<typeof useTaskForm>;

function renderForm(saveTask: Parameters<typeof useTaskForm>[0]) {
  const result: { current: Hook | null } = { current: null };
  function Probe() {
    result.current = useTaskForm(saveTask);
    return null;
  }
  let renderer: ReactTestRenderer.ReactTestRenderer;
  act(() => {
    renderer = ReactTestRenderer.create(<Probe />);
  });
  return { result, unmount: () => act(() => renderer.unmount()) };
}

describe('useTaskForm', () => {
  it('sin título no guarda y marca el error en el campo', async () => {
    const saveTask = jest.fn();
    const { result, unmount } = renderForm(saveTask);
    act(() => result.current!.openCreate());

    let outcome: unknown;
    await act(async () => {
      outcome = await result.current!.submit();
    });

    expect(outcome).toBeNull();
    expect(saveTask).not.toHaveBeenCalled();
    expect(result.current!.errors.title).toBe('El título es obligatorio.');
    expect(result.current!.visible).toBe(true);

    // Al escribir, el error desaparece
    act(() => result.current!.setFormState(prev => ({ ...prev, title: 'Revisar' })));
    expect(result.current!.errors.title).toBeUndefined();
    unmount();
  });

  it('si el guardado falla, la hoja sigue abierta con lo escrito', async () => {
    const saveTask = jest.fn().mockResolvedValue({
      ok: false,
      error: { title: 'No se pudo guardar la tarea', message: 'Sin conexión' },
    });
    const { result, unmount } = renderForm(saveTask);
    act(() => result.current!.openCreate());
    act(() => result.current!.setFormState(prev => ({ ...prev, title: 'Revisar' })));

    await act(async () => {
      await result.current!.submit();
    });

    expect(result.current!.visible).toBe(true);
    expect(result.current!.formState.title).toBe('Revisar');
    unmount();
  });

  it('al guardar bien, cierra y limpia el formulario', async () => {
    const saveTask = jest.fn().mockResolvedValue({ ok: true });
    const { result, unmount } = renderForm(saveTask);
    act(() => result.current!.openCreate());
    act(() => result.current!.setFormState(prev => ({ ...prev, title: 'Revisar' })));

    await act(async () => {
      await result.current!.submit();
    });

    expect(saveTask).toHaveBeenCalledTimes(1);
    expect(result.current!.visible).toBe(false);
    expect(result.current!.formState.title).toBe('');
    unmount();
  });
});
