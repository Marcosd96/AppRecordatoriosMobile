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
 * Obtener token de autenticación almacenado
 */
async function getAuthToken(): Promise<string | null> {
  try {
    const { default: AsyncStorage } = await import('@react-native-async-storage/async-storage');
    return await AsyncStorage.getItem('auth_token');
  } catch {
    return null;
  }
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
  const token = await getAuthToken();
  
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
    });

    console.log(`[API] Response status: ${response.status}`);

    if (!response.ok) {
      let errorMessage = `Error ${response.status}: ${response.statusText}`;
      
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorMessage;
        
        // Manejar errores de autenticación específicamente
        if (response.status === 401) {
          errorMessage = 'No autorizado. Las APIs requieren autenticación.';
        }
      } catch {
        // Si no se puede parsear el JSON, usar el mensaje por defecto
      }
      
      throw new Error(errorMessage);
    }

    return response.json();
  } catch (error: any) {
    console.error(`[API] Error fetching ${url}:`, error);
    
    // Mejorar mensajes de error
    if (error.message?.includes('Network request failed')) {
      throw new Error(
        `No se pudo conectar al servidor. Verifica:\n` +
        `1. Que la URL sea correcta: ${API_BASE_URL}\n` +
        `2. Que tengas conexión a internet\n` +
        `3. Si estás en desarrollo local, usa tu IP local en lugar de localhost`
      );
    }
    
    throw error;
  }
}

export default fetchAPI;

