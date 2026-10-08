/**
 * @format
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { ApiError } from '../src/config/api';
import {
  clearQueryCache,
  queryClient,
  queryKeys,
  shouldRetry,
} from '../src/config/queryClient';

describe('shouldRetry', () => {
  it('reintenta errores de red y del servidor', () => {
    expect(shouldRetry(0, new ApiError('sin conexión', 0))).toBe(true);
    expect(shouldRetry(1, new ApiError('caído', 503))).toBe(true);
  });

  it('no reintenta errores del cliente, como la sesión caducada', () => {
    expect(shouldRetry(0, new ApiError('sesión caducada', 401))).toBe(false);
    expect(shouldRetry(0, new ApiError('no encontrado', 404))).toBe(false);
  });

  it('se rinde tras dos intentos', () => {
    expect(shouldRetry(2, new ApiError('sin conexión', 0))).toBe(false);
  });
});

describe('clearQueryCache', () => {
  it('borra los datos en memoria y la copia guardada en el dispositivo', async () => {
    queryClient.setQueryData(queryKeys.reminders, [{ id: 'r1' }]);
    await AsyncStorage.setItem('gesaccol-query-cache', '{"clientState":{}}');

    await clearQueryCache();

    expect(queryClient.getQueryData(queryKeys.reminders)).toBeUndefined();
    expect(await AsyncStorage.getItem('gesaccol-query-cache')).toBeNull();
  });
});
