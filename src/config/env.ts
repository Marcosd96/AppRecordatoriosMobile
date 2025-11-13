/**
 * Configuración de variables de entorno
 * En React Native, las variables de entorno deben manejarse de forma diferente
 */

// ⚠️ IMPORTANTE: Cambia esto por tu Google Web Client ID
// Lo puedes encontrar en Google Cloud Console > Credentials > OAuth 2.0 Client IDs
// Debe ser el Client ID de tipo "Web application", NO el de Android/iOS
export const GOOGLE_WEB_CLIENT_ID = 
  process.env.GOOGLE_WEB_CLIENT_ID || 
  '559109517807-eqnn0u1tpumaij33uv1270ss33rls7j6.apps.googleusercontent.com'; // ⬅️ Reemplaza esto
