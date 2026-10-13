import React from 'react';
import ReactTestRenderer, { act } from 'react-test-renderer';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useReminders } from '../src/hooks/useReminders';
import { queryKeys } from '../src/config/queryClient';
import { remindersService } from '../src/services/remindersService';
import { Reminder } from '../src/types';

jest.mock('@react-navigation/native', () => ({ useFocusEffect: jest.fn() }));
jest.mock('../src/services/remindersService', () => ({
  remindersService: { getAll: jest.fn(), toggleStatus: jest.fn() },
}));
jest.mock('../src/services/companiesService', () => ({
  companiesService: { getAll: jest.fn(() => Promise.resolve([])) },
}));

const service = remindersService as jest.Mocked<typeof remindersService>;

const pending: Reminder = {
  id: 'r1',
  companyId: 'c1',
  companyName: 'Acme',
  type: 'IVA',
  period: '2026-09',
  dueDate: '2099-01-01T00:00:00Z',
  description: 'Declaración de IVA',
  status: 'pending',
};

function renderRemindersHook() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Infinity } },
  });
  client.setQueryData(queryKeys.reminders, [pending]);
  client.setQueryData(queryKeys.companies, []);
  const result: { current: ReturnType<typeof useReminders> | null } = { current: null };
  function Probe() {
    result.current = useReminders();
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
  const cleanup = () => {
    act(() => renderer.unmount());
    client.clear();
  };
  return { result, client, cleanup };
}

const statusInCache = (client: QueryClient) =>
  client.getQueryData<Reminder[]>(queryKeys.reminders)?.[0].status;

describe('useReminders.toggleReminder', () => {
  beforeEach(() => jest.clearAllMocks());

  it('muestra el cambio antes de que responda el servidor', async () => {
    let respond: () => void = () => {};
    service.toggleStatus.mockImplementation(
      () =>
        new Promise(resolve => {
          respond = () => resolve({ success: true, reminder: { ...pending, status: 'completed' } });
        }),
    );
    const { result, client, cleanup } = renderRemindersHook();

    let toggle: Promise<unknown> = Promise.resolve();
    await act(async () => {
      toggle = result.current!.toggleReminder('r1');
    });
    expect(statusInCache(client)).toBe('completed');
    expect(result.current!.togglingIds.has('r1')).toBe(true);

    // Una segunda pulsación mientras tanto no llega al servidor
    await act(async () => {
      await result.current!.toggleReminder('r1');
    });
    expect(service.toggleStatus).toHaveBeenCalledTimes(1);

    await act(async () => {
      respond();
      await toggle;
    });
    expect(result.current!.togglingIds.has('r1')).toBe(false);
    cleanup();
  });

  it('si el servidor falla, vuelve al estado anterior y devuelve el error', async () => {
    service.toggleStatus.mockRejectedValueOnce(new Error('Sin conexión con el servidor'));
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
    const { result, client, cleanup } = renderRemindersHook();

    let outcome: unknown;
    await act(async () => {
      outcome = await result.current!.toggleReminder('r1');
    });

    expect(statusInCache(client)).toBe('pending');
    expect(outcome).toEqual({
      ok: false,
      error: {
        title: 'No se pudo actualizar el recordatorio',
        message: 'Sin conexión con el servidor',
      },
    });
    consoleError.mockRestore();
    cleanup();
  });
});
