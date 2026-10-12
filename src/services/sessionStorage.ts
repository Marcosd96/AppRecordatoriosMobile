import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Keychain from 'react-native-keychain';

/**
 * Token de sesión guardado en el almacén seguro del sistema (Keystore en Android, Keychain en
 * iOS) en vez de en AsyncStorage, que es texto plano. Se guarda también en memoria para no
 * descifrarlo en cada petición.
 */

const SERVICE = 'gesaccol.session';
const ACCOUNT = 'session';
// Versiones anteriores guardaban el token aquí; se migra al leerlo por primera vez
const LEGACY_TOKEN_KEY = 'auth_token';

// undefined = aún no leído del almacén
let cachedToken: string | null | undefined;

export async function saveSessionToken(token: string): Promise<void> {
  await Keychain.setGenericPassword(ACCOUNT, token, {
    service: SERVICE,
    // Disponible con el teléfono bloqueado tras el primer desbloqueo: los botones de las
    // notificaciones ("Completar") llaman a la API en segundo plano
    accessible: Keychain.ACCESSIBLE.AFTER_FIRST_UNLOCK,
  });
  cachedToken = token;
}

export async function getSessionToken(): Promise<string | null> {
  if (cachedToken !== undefined) {
    return cachedToken;
  }
  try {
    const credentials = await Keychain.getGenericPassword({ service: SERVICE });
    if (credentials) {
      cachedToken = credentials.password;
      return cachedToken;
    }

    const legacy = await AsyncStorage.getItem(LEGACY_TOKEN_KEY);
    if (legacy) {
      await saveSessionToken(legacy);
      await AsyncStorage.removeItem(LEGACY_TOKEN_KEY);
      return legacy;
    }

    cachedToken = null;
    return null;
  } catch (error) {
    // Sin caché: se reintenta en la siguiente lectura
    console.error('[Sesión] Error leyendo el token:', error);
    return null;
  }
}

export async function clearSessionToken(): Promise<void> {
  cachedToken = null;
  await Promise.all([
    Keychain.resetGenericPassword({ service: SERVICE }),
    AsyncStorage.removeItem(LEGACY_TOKEN_KEY),
  ]);
}

/** Solo para tests */
export function resetSessionCache(): void {
  cachedToken = undefined;
}
