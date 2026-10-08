/**
 * Caché de datos del servidor (TanStack Query), guardada en el dispositivo para poder
 * mostrar los datos sin conexión.
 */
import { AppState, AppStateStatus, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { QueryClient, focusManager, onlineManager } from '@tanstack/react-query';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import { ApiError } from './api';

const MINUTE = 60 * 1000;
const DAY = 24 * 60 * MINUTE;

// Cuánto tiempo se conservan los datos guardados para usarlos sin conexión
export const PERSIST_MAX_AGE = 7 * DAY;

export const queryKeys = {
  reminders: ['reminders'] as const,
  companies: ['companies'] as const,
  dashboard: ['dashboard'] as const,
  personalTasks: ['personalTasks'] as const,
  calendars: ['calendars'] as const,
};

/**
 * Reintenta solo los errores que pueden resolverse solos (red o servidor), nunca los 4xx
 */
export function shouldRetry(failureCount: number, error: unknown): boolean {
  if (failureCount >= 2) {
    return false;
  }
  if (error instanceof ApiError) {
    return error.isNetworkError || error.status >= 500;
  }
  return true;
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Los datos se consideran actuales durante un minuto: cambiar de pestaña no repite peticiones
      staleTime: MINUTE,
      // Deben vivir al menos tanto como la copia guardada para poder restaurarse
      gcTime: PERSIST_MAX_AGE,
      retry: shouldRetry,
      // Sin conexión se intenta igualmente una vez y se sigue mostrando lo guardado
      networkMode: 'offlineFirst',
    },
    mutations: {
      networkMode: 'offlineFirst',
    },
  },
});

export const queryPersister = createAsyncStoragePersister({
  storage: AsyncStorage,
  key: 'gesaccol-query-cache',
});

// Estado de la conexión desde NetInfo: sin red, las consultas se pausan y se reanudan al volver
onlineManager.setEventListener(setOnline =>
  NetInfo.addEventListener(state => {
    setOnline(state.isConnected !== false);
  }),
);

// Al volver la app al primer plano se refrescan los datos que hayan quedado viejos
focusManager.setEventListener(handleFocus => {
  const subscription = AppState.addEventListener('change', (status: AppStateStatus) => {
    if (Platform.OS !== 'web') {
      handleFocus(status === 'active');
    }
  });
  return () => subscription.remove();
});

/**
 * Borra los datos en memoria y la copia guardada (al cerrar sesión)
 */
export async function clearQueryCache(): Promise<void> {
  await queryClient.cancelQueries();
  queryClient.clear();
  await queryPersister.removeClient();
}
