import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import fetchAPI, { API_ENDPOINTS, ApiError, setUnauthorizedHandler } from '../config/api';
import { notificationsService } from '../services/notificationsService';
import { widgetService } from '../services/widgetService';
import { clearSessionToken, getSessionToken, saveSessionToken } from '../services/sessionStorage';
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
      const storedToken = await getSessionToken();
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
        throw new Error('El inicio de sesión con Google no está disponible. Reinstala la app e inténtalo de nuevo.');
      }

      if (!googleSignInConfigured) {
        // Fallo de configuración de la app (GOOGLE_WEB_CLIENT_ID en src/config/env.ts)
        console.error('Google Sign-In no configurado');
        throw new Error('El inicio de sesión con Google no está disponible. Actualiza la app e inténtalo de nuevo.');
      }

      // Verificar si Google Play Services está disponible
      await GoogleSignin.hasPlayServices();
      
      // Iniciar sesión con Google
      const result = await GoogleSignin.signIn();
      
      
      
      // Manejar diferentes estructuras de respuesta
      // La respuesta puede venir como { data: { idToken, user }, type } o directamente { idToken, user }
      const userInfo = result?.data || result;
      
      // Verificar si el usuario canceló el flujo
      if (result?.type === 'cancel' || userInfo?.type === 'cancel') {
        throw new Error('Inicio de sesión cancelado por el usuario');
      }
      
      // Obtener el idToken de diferentes posibles ubicaciones
      const idToken = userInfo?.idToken || result?.idToken || userInfo?.data?.idToken;
      
      
      
      // Verificar que tengamos el token
      if (!idToken) {
                // Sin registrar la respuesta: puede contener datos de la cuenta
        console.error('Google Sign-In response sin idToken. Claves recibidas:', Object.keys(userInfo ?? {}));
        throw new Error('No se recibió token de Google. Por favor, intenta de nuevo.');
      }

      // Enviar el token de Google a nuestro backend (con el timeout y los mensajes de fetchAPI)
      let data: { token: string; user: User };
      try {
        data = await fetchAPI<{ token: string; user: User }>(API_ENDPOINTS.auth, {
          method: 'POST',
          body: JSON.stringify({ idToken }),
        });
      } catch (apiError) {
        if (apiError instanceof ApiError && (apiError.status === 401 || apiError.status === 403)) {
          throw new Error('No pudimos verificar tu cuenta de Google. Inténtalo de nuevo.');
        }
        if (apiError instanceof ApiError && apiError.status >= 500) {
          throw new Error('El servidor no está disponible en este momento. Inténtalo más tarde.');
        }
        throw apiError;
      }
      if (!data?.token || !data?.user) {
        throw new Error('No se pudo iniciar sesión. Inténtalo de nuevo.');
      }

      // Guardar token y usuario
      // El token va al almacén seguro; el perfil (nombre, correo) no es secreto
      await saveSessionToken(data.token);
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
    await Promise.all([clearSessionToken(), AsyncStorage.removeItem('auth_user')]).catch(error =>
      console.error('Error borrando sesión almacenada:', error),
    );
    setToken(null);
    setUser(null);

    try {
      // Quitar las alarmas del usuario saliente para que no le lleguen a otra cuenta en este dispositivo
      await notificationsService.cancelAllNotifications();
      // Borrar también los datos guardados para uso sin conexión: no deben verse con otra cuenta
      await clearQueryCache();
      widgetService.clear();
      console.log('[Auth] Sesión cerrada: notificaciones, datos guardados y widget eliminados');
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
