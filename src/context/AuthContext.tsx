import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL, setUnauthorizedHandler } from '../config/api';
import { notificationsService } from '../services/notificationsService';
import { clearQueryCache } from '../config/queryClient';
import { GOOGLE_WEB_CLIENT_ID } from '../config/env';

// Importación usando require para evitar problemas de resolución de módulos ES6 en Metro
let GoogleSignin: any;
try {
  const googleSignInModule = require('@react-native-google-signin/google-signin');
  GoogleSignin = googleSignInModule.GoogleSignin || googleSignInModule.default?.GoogleSignin;
} catch (error) {
  console.error('Error cargando Google Sign-In:', error);
}

interface User {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  role: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Función para configurar Google Sign-In de forma segura
function configureGoogleSignIn() {
  if (!GoogleSignin || typeof GoogleSignin.configure !== 'function') {
    return false;
  }

  if (!GOOGLE_WEB_CLIENT_ID || GOOGLE_WEB_CLIENT_ID === 'TU_GOOGLE_WEB_CLIENT_ID_AQUI.apps.googleusercontent.com') {
    console.warn('Google Sign-In no configurado: falta GOOGLE_WEB_CLIENT_ID. Edita src/config/env.ts');
    return false;
  }

  try {
    GoogleSignin.configure({
      webClientId: GOOGLE_WEB_CLIENT_ID,
      offlineAccess: true,
    });
    return true;
  } catch (error) {
    console.error('Error configurando Google Sign-In:', error);
    return false;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [googleSignInConfigured, setGoogleSignInConfigured] = useState(false);

  useEffect(() => {
    // Configurar Google Sign-In cuando el componente se monte
    const configured = configureGoogleSignIn();
    setGoogleSignInConfigured(configured);
    loadStoredAuth();
  }, []);

  const loadStoredAuth = async () => {
    try {
      const storedToken = await AsyncStorage.getItem('auth_token');
      const storedUser = await AsyncStorage.getItem('auth_user');
      
      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error('Error cargando autenticación almacenada:', error);
    } finally {
      setLoading(false);
    }
  };

  const signIn = async () => {
    try {
      if (!GoogleSignin) {
        throw new Error('Google Sign-In no está disponible. Por favor, reinstala la app.');
      }

      if (!googleSignInConfigured) {
        throw new Error('Google Sign-In no está configurado. Por favor, configura GOOGLE_WEB_CLIENT_ID en src/config/env.ts');
      }

      // Verificar si Google Play Services está disponible
      await GoogleSignin.hasPlayServices();
      
      // Iniciar sesión con Google
      const result = await GoogleSignin.signIn();
      
      // Log completo para debugging
      console.log('Google Sign-In response completo:', JSON.stringify(result, null, 2));
      
      // Manejar diferentes estructuras de respuesta
      // La respuesta puede venir como { data: { idToken, user }, type } o directamente { idToken, user }
      const userInfo = result?.data || result;
      
      // Verificar si el usuario canceló el flujo
      if (result?.type === 'cancel' || userInfo?.type === 'cancel') {
        throw new Error('Inicio de sesión cancelado por el usuario');
      }
      
      // Obtener el idToken de diferentes posibles ubicaciones
      const idToken = userInfo?.idToken || result?.idToken || userInfo?.data?.idToken;
      
      // Log para debugging
      console.log('Token extraído:', {
        hasIdToken: !!idToken,
        idTokenLength: idToken?.length,
        hasUser: !!userInfo?.user,
        userEmail: userInfo?.user?.email,
      });
      
      // Verificar que tengamos el token
      if (!idToken) {
        console.error('Google Sign-In response sin idToken. Estructura completa:', result);
        throw new Error('No se recibió token de Google. Por favor, intenta de nuevo.');
      }

      // Enviar token a nuestro backend
      const authUrl = `${API_BASE_URL}/api/mobile/auth`;
      console.log('Enviando token al backend:', authUrl);
      
      const response = await fetch(authUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          idToken: idToken,
        }),
      });

      console.log('Respuesta del backend:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        headers: Object.fromEntries(response.headers.entries()),
      });

      // Leer el contenido de la respuesta para debugging
      const responseText = await response.text();
      console.log('Contenido de la respuesta (primeros 500 caracteres):', responseText.substring(0, 500));

      if (!response.ok) {
        // Intentar parsear como JSON, si falla usar el texto
        let errorMessage = `Error ${response.status}: ${response.statusText}`;
        try {
          const errorData = JSON.parse(responseText);
          errorMessage = errorData.error || errorMessage;
        } catch {
          // Si no es JSON, podría ser HTML (página de error)
          if (responseText.includes('<html') || responseText.includes('<!DOCTYPE')) {
            errorMessage = `El servidor devolvió una página HTML. Verifica que el endpoint ${authUrl} exista.`;
          } else {
            errorMessage = responseText || errorMessage;
          }
        }
        throw new Error(errorMessage);
      }

      // Parsear la respuesta JSON
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        console.error('Error parseando respuesta JSON:', e);
        throw new Error('El servidor devolvió una respuesta inválida. Verifica que el endpoint esté funcionando correctamente.');
      }
      
      // Guardar token y usuario
      await AsyncStorage.setItem('auth_token', data.token);
      await AsyncStorage.setItem('auth_user', JSON.stringify(data.user));
      
      setToken(data.token);
      setUser(data.user);
    } catch (error: any) {
      console.error('Error en signIn:', error);
      
      // Manejar errores específicos de Google Sign-In
      if (error.code === 'SIGN_IN_CANCELLED' || error.message?.includes('cancelado')) {
        throw new Error('Inicio de sesión cancelado');
      }
      
      if (error.code === 'SIGN_IN_REQUIRED') {
        throw new Error('Por favor, inicia sesión con Google');
      }
      
      // Re-lanzar el error original si no es un error conocido
      throw error;
    }
  };

  const signOut = useCallback(async () => {
    // Primero cerrar la sesión local: las pantallas con datos se desmontan y ya no se pueden
    // hacer peticiones con el token, así nada vuelve a llenar la caché ni a programar avisos
    await AsyncStorage.multiRemove(['auth_token', 'auth_user']).catch((error) =>
      console.error('Error borrando sesión almacenada:', error),
    );
    setToken(null);
    setUser(null);

    try {
      // Quitar las alarmas del usuario saliente para que no le lleguen a otra cuenta en este dispositivo
      await notificationsService.cancelAllNotifications();
      // Borrar también los datos guardados para uso sin conexión: no deben verse con otra cuenta
      await clearQueryCache();
      console.log('[Auth] Sesión cerrada: notificaciones y datos guardados eliminados');
      if (GoogleSignin && typeof GoogleSignin.signOut === 'function') {
        await GoogleSignin.signOut();
      }
    } catch (error) {
      console.error('Error en signOut:', error);
    }
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      signOut();
    });
    return () => setUnauthorizedHandler(null);
  }, [signOut]);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        signIn,
        signOut,
        isAuthenticated: !!token && !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe usarse dentro de AuthProvider');
  }
  return context;
}
