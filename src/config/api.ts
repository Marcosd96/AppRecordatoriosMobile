import { getSessionToken } from '../services/sessionStorage';

/**
 * Configuración de la API
 * Cambia esta URL según tu entorno (desarrollo, producción)
 */

// Para desarrollo local:
// - Android Emulator: usa 'http://10.0.2.2:3000'
// - iOS Simulator: usa 'http://localhost:3000'
// - Dispositivo físico: usa tu IP local, ej: 'http://192.168.1.100:3000'
//   Para encontrar tu IP: Windows (ipconfig) o Mac/Linux (ifconfig)

// IMPORTANTE: Si estás probando en dispositivo físico o emulador Android,
// cambia localhost por tu IP local o usa la URL de producción directamente
export const API_BASE_URL = __DEV__
  ? 'https://app-recordatorios.vercel.app' // Usando producción en desarrollo por ahora
  : 'https://app-recordatorios.vercel.app'; // URL de producción

export const API_ENDPOINTS = {
  auth: '/api/mobile/auth',
  health: '/api/mobile/health',
  reminders: '/api/mobile/reminders',
  reminderToggle: (id: string) => `/api/mobile/reminders/${id}/toggle`,
  companies: '/api/mobile/companies',
  company: (id: string) => `/api/mobile/companies/${id}`,
  dashboard: '/api/mobile/dashboard',
  calendars: '/api/mobile/calendars',
  cities: '/api/mobile/cities',
  personalTasks: '/api/mobile/tasks',
  personalTask: (id: string) => `/api/mobile/tasks/${id}`,
  personalTaskComplete: (id: string) => `/api/mobile/tasks/${id}/complete`,
  personalTasksUpcoming: '/api/mobile/tasks/upcoming',
};

/**
 * Error de la API con el código HTTP (0 = sin conexión con el servidor)
 */
export class ApiError extends Error {
  constructor(message: string, public readonly status: number) {
    super(message);
    this.name = 'ApiError';
  }

  get isNetworkError(): boolean {
    return this.status === 0;
  }
}

/**
 * Tiempo máximo de espera de una petición. Pasado este tiempo se aborta y se
 * trata como un error de red, para que la app use los datos guardados.
 */
export const REQUEST_TIMEOUT_MS = 15000;

const NETWORK_ERROR_MESSAGE =
  'No se pudo conectar al servidor. Revisa tu conexión a internet e inténtalo de nuevo.';

let unauthorizedHandler: (() => void) | null = null;

/**
 * Registra la acción a ejecutar cuando el backend responde 401 (token inválido o caducado).
 * AuthContext lo usa para cerrar la sesión automáticamente.
 */
export function setUnauthorizedHandler(handler: (() => void) | null): void {
  unauthorizedHandler = handler;
}

/**
 * Función helper para hacer peticiones HTTP
 */
async function fetchAPI<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  // Obtener token de autenticación
  const token = await getSessionToken();

  // Abortar la petición si el servidor no responde a tiempo (o si quien llama la cancela)
  const controller = new AbortController();
  let timedOut = false;
  const timeoutId = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, REQUEST_TIMEOUT_MS);
  const callerSignal = options?.signal;
  const abortFromCaller = () => controller.abort();
  if (callerSignal?.aborted) {
    controller.abort();
  } else {
    callerSignal?.addEventListener('abort', abortFromCaller);
  }

  try {
    console.log(`[API] Fetching: ${url}`);
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Copiar headers existentes si los hay
    if (options?.headers) {
      Object.entries(options.headers).forEach(([key, value]) => {
        if (typeof value === 'string') {
          headers[key] = value;
        }
      });
    }
    
    // Agregar token de autenticación si existe
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    
    const response = await fetch(url, {
      ...options,
      headers,
      signal: controller.signal,
    });

    console.log(`[API] Response status: ${response.status}`);

    if (!response.ok) {
      // Sesión inválida o caducada: cerrar sesión para volver al login
      if (response.status === 401) {
        if (token) {
          unauthorizedHandler?.();
        }
        throw new ApiError('Tu sesión ha expirado. Inicia sesión de nuevo.', 401);
      }

      let errorMessage = `Error ${response.status}: ${response.statusText}`;

      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorMessage;
      } catch {
        // Si no se puede parsear el JSON, usar el mensaje por defecto
      }

      throw new ApiError(errorMessage, response.status);
    }

    return await response.json();
  } catch (error: any) {
    console.error(`[API] Error fetching ${url}:`, error);

    if (timedOut) {
      throw new ApiError(
        'El servidor tardó demasiado en responder. Inténtalo de nuevo en unos momentos.',
        0,
      );
    }

    // Mejorar mensajes de error
    if (error.message?.includes('Network request failed')) {
      throw new ApiError(NETWORK_ERROR_MESSAGE, 0);
    }

    throw error;
  } finally {
    clearTimeout(timeoutId);
    callerSignal?.removeEventListener('abort', abortFromCaller);
  }
}

export default fetchAPI;

