/**
 * Tests del token de sesión en el almacén seguro
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Keychain from 'react-native-keychain';
import {
  clearSessionToken,
  getSessionToken,
  resetSessionCache,
  saveSessionToken,
} from '../src/services/sessionStorage';

const keychainMock = Keychain as typeof Keychain & { __reset: () => void };

beforeEach(async () => {
  keychainMock.__reset();
  jest.clearAllMocks();
  resetSessionCache();
  await AsyncStorage.clear();
});

describe('sessionStorage', () => {
  it('guarda el token en el almacén seguro, no en AsyncStorage', async () => {
    await saveSessionToken('abc');
    resetSessionCache();

    expect(await getSessionToken()).toBe('abc');
    expect(await AsyncStorage.getItem('auth_token')).toBeNull();
  });

  it('lee del almacén seguro una sola vez', async () => {
    await saveSessionToken('abc');
    resetSessionCache();

    await getSessionToken();
    await getSessionToken();
    expect(Keychain.getGenericPassword).toHaveBeenCalledTimes(1);
  });

  it('migra el token antiguo de AsyncStorage y lo borra de allí', async () => {
    await AsyncStorage.setItem('auth_token', 'antiguo');

    expect(await getSessionToken()).toBe('antiguo');
    expect(await AsyncStorage.getItem('auth_token')).toBeNull();

    resetSessionCache();
    expect(await getSessionToken()).toBe('antiguo');
  });

  it('al cerrar sesión ya no hay token', async () => {
    await saveSessionToken('abc');
    await clearSessionToken();
    expect(await getSessionToken()).toBeNull();

    resetSessionCache();
    expect(await getSessionToken()).toBeNull();
  });
});
