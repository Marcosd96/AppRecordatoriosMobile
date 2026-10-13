import React from 'react';
import ReactTestRenderer, { act } from 'react-test-renderer';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { usePersonalTasks } from '../src/hooks/usePersonalTasks';
import { personalTasksService } from '../src/services/personalTasksService';

jest.mock('@react-navigation/native', () => ({
  useFocusEffect: jest.fn(),
}));

jest.mock('../src/services/personalTasksService', () => ({
  personalTasksService: {
    getAll: jest.fn(() => Promise.resolve([])),
    complete: jest.fn(),
    remove: jest.fn(),
  },
}));

const service = personalTasksService as jest.Mocked<typeof personalTasksService>;

const cleanups: Array<() => void> = [];

function renderTasksHook() {
  const result: { current: ReturnType<typeof usePersonalTasks> | null } = { current: null };
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  function Probe() {
    result.current = usePersonalTasks();
    return null;
  }
  let renderer: ReactTestRenderer.ReactTestRenderer;
  act(() => {
    renderer = ReactTestRenderer.create(
      <QueryClientProvider client={client}>
        <Probe />
      </QueryClientProvider>,
    );
  });
  cleanups.push(() => {
    act(() => renderer.unmount());
    client.clear();
  });
  return result;
}

describe('usePersonalTasks: acciones en curso', () => {
  beforeEach(() => jest.clearAllMocks());
  afterEach(() => cleanups.splice(0).forEach(cleanup => cleanup()));

  it('ignora una segunda pulsación de "Completar" mientras la primera no termina', async () => {
    let finish: () => void = () => {};
    service.complete.mockImplementation(
      () => new Promise(resolve => { finish = () => resolve({} as never); }),
    );
    const hook = renderTasksHook();

    let first: Promise<unknown> = Promise.resolve();
    await act(async () => {
      first = hook.current!.updateTaskStatus('t1', 'complete');
      await hook.current!.updateTaskStatus('t1', 'complete');
    });

    expect(service.complete).toHaveBeenCalledTimes(1);
    expect(hook.current!.busyTaskIds.has('t1')).toBe(true);

    await act(async () => {
      finish();
      await first;
    });
    expect(hook.current!.busyTaskIds.has('t1')).toBe(false);
  });

  it('libera la tarea aunque la acción falle', async () => {
    service.complete.mockRejectedValueOnce(new Error('sin red'));
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
    const hook = renderTasksHook();

    let result: unknown;
    await act(async () => {
      result = await hook.current!.updateTaskStatus('t2', 'complete');
    });

    expect(hook.current!.busyTaskIds.has('t2')).toBe(false);
    expect(result).toEqual({
      ok: false,
      error: { title: 'No se pudo actualizar la tarea', message: 'sin red' },
    });
    consoleError.mockRestore();
  });
});

describe('usePersonalTasks: error de carga', () => {
  afterEach(() => cleanups.splice(0).forEach(cleanup => cleanup()));

  it('expone el mensaje si falla la carga y no hay datos guardados', async () => {
    service.getAll.mockRejectedValueOnce(new Error('Sin conexión con el servidor'));
    const hook = renderTasksHook();

    // La consulta falla de forma asíncrona: se espera a que el hook lo refleje
    for (let attempt = 0; attempt < 20 && !hook.current!.loadError; attempt++) {
      await act(async () => {
        await new Promise<void>(resolve => setTimeout(resolve, 10));
      });
    }

    expect(hook.current!.loadError).toBe('Sin conexión con el servidor');
    expect(hook.current!.tasks).toEqual([]);
  });
});
