/**
 * Gesaccol
 * Aplicación móvil para gestión de recordatorios fiscales
 *
 * @format
 */

import './global.css';
import React, { useEffect } from 'react';
import { Linking, StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import notifee, { EventType } from '@notifee/react-native';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { PERSIST_MAX_AGE, queryClient, queryPersister } from './src/config/queryClient';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import AppNavigator from './src/navigation/AppNavigator';
import ErrorBoundary from './src/components/ErrorBoundary';
import { openFromNotification, openFromUrl } from './src/navigation/notificationNavigation';
import { handleNotificationAction } from './src/services/notificationActions';

function AppContent() {
  const { isDark } = useTheme();

  useEffect(() => {
    // Manejar eventos de notificaciones cuando la app está en primer plano
    return notifee.onForegroundEvent(({ type, detail }) => {
      switch (type) {
        case EventType.PRESS:
          console.log('Usuario presionó la notificación', detail.notification?.id);
          openFromNotification(detail.notification);
          break;
        case EventType.ACTION_PRESS:
          // "Completar" / "Posponer 1 h"
          handleNotificationAction(detail.pressAction?.id, detail.notification);
          break;
        case EventType.DELIVERED:
          console.log('✅ Notificación entregada:', detail.notification?.title);
          break;
      }
    });
  }, []);

  useEffect(() => {
    // App abierta tocando una notificación estando cerrada
    notifee
      .getInitialNotification()
      .then(initial => {
        if (initial) {
          openFromNotification(initial.notification);
        }
      })
      .catch(error => console.error('Error leyendo la notificación inicial:', error));
  }, []);

  useEffect(() => {
    // Enlaces gesaccol:// (filas del widget): con la app cerrada llegan como enlace inicial,
    // con la app abierta como evento
    Linking.getInitialURL()
      .then(openFromUrl)
      .catch(error => console.error('Error leyendo el enlace inicial:', error));
    const subscription = Linking.addEventListener('url', ({ url }) => openFromUrl(url));
    return () => subscription.remove();
  }, []);

  // Los eventos en segundo plano se registran en index.js (requisito de notifee)

  return (
    <SafeAreaProvider>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <ErrorBoundary>
        <AppNavigator />
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}

function App() {
  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{ persister: queryPersister, maxAge: PERSIST_MAX_AGE }}
    >
      <ThemeProvider>
        <AppContent />
      </ThemeProvider>
    </PersistQueryClientProvider>
  );
}

export default App;
