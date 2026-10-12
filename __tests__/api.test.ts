/**
 * Tests de fetchAPI: timeout de las peticiones y mensajes de error de red
 */

import fetchAPI, { ApiError, REQUEST_TIMEOUT_MS } from '../src/config/api';

const fetchMock = jest.fn();

beforeEach(() => {
  fetchMock.mockReset();
  globalThis.fetch = fetchMock as unknown as typeof fetch;
  jest.spyOn(console, 'log').mockImplementation(() => {});
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  jest.useRealTimers();
  jest.restoreAllMocks();
});

// fetch que solo termina cuando se aborta su signal, como un servidor que no responde
function hangingFetch(_url: string, init: RequestInit): Promise<Response> {
  return new Promise((_resolve, reject) => {
    init.signal?.addEventListener('abort', () => reject(new Error('Aborted')));
  });
}

describe('fetchAPI', () => {
  it('devuelve el JSON de una respuesta correcta', async () => {
    fetchMock.mockResolvedValue({ ok: true, status: 200, json: async () => ({ ok: 1 }) });

    await expect(fetchAPI('/api/test')).resolves.toEqual({ ok: 1 });
  });

  it('aborta la petición y lanza un error de red si el servidor no responde a tiempo', async () => {
    jest.useFakeTimers();
    fetchMock.mockImplementation(hangingFetch);

    // Capturar el rechazo desde el principio para que no quede sin manejar mientras avanza el reloj
    const request = fetchAPI('/api/test').catch(e => e);
    await jest.advanceTimersByTimeAsync(REQUEST_TIMEOUT_MS);

    const error = (await request) as ApiError;
    expect(error).toBeInstanceOf(ApiError);
    expect(error.isNetworkError).toBe(true);
    expect(error.message).toContain('tardó demasiado');
  });

  it('respeta la cancelación de quien llama', async () => {
    fetchMock.mockImplementation(hangingFetch);
    const controller = new AbortController();

    const request = fetchAPI('/api/test', { signal: controller.signal });
    // Esperar a que fetchAPI lea el token y llame a fetch
    await new Promise<void>(resolve => setImmediate(() => resolve()));
    controller.abort();

    await expect(request).rejects.toThrow('Aborted');
  });

  it('muestra un mensaje para el usuario sin detalles de desarrollo cuando no hay conexión', async () => {
    fetchMock.mockRejectedValue(new TypeError('Network request failed'));

    const error = (await fetchAPI('/api/test').catch(e => e)) as ApiError;

    expect(error.isNetworkError).toBe(true);
    expect(error.message).not.toContain('localhost');
    expect(error.message).toContain('conexión');
  });
});
