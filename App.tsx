/**
 * Gesaccol
 * Aplicación móvil para gestión de recordatorios fiscales
 *
 * @format
 */

import './global.css';
import React, { useEffect } from 'react';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import notifee, { EventType } from '@notifee/react-native';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import AppNavigator from './src/navigation/AppNavigator';

function AppContent() {
  const { isDark } = useTheme();

  useEffect(() => {
    // Manejar eventos de notificaciones cuando la app está en primer plano
    return notifee.onForegroundEvent(({ type, detail }) => {
      console.log('🔔 Evento de notificación (foreground):', { type, detail });
      switch (type) {
        case EventType.DISMISSED:
          console.log('Usuario descartó la notificación');
          break;
        case EventType.PRESS:
          console.log('Usuario presionó la notificación', detail.notification);
          // Aquí podrías navegar a la pantalla de recordatorios
          // navigationRef.current?.navigate('Reminders');
          break;
        case EventType.DELIVERED:
          console.log('✅ Notificación entregada:', detail.notification?.title);
          break;
        case EventType.TRIGGER_NOTIFICATION_CREATED:
          console.log('📅 Notificación programada creada:', detail.notification?.id);
          break;
      }
    });
  }, []);

  // Los eventos en segundo plano se registran en index.js (requisito de notifee)

  return (
    <SafeAreaProvider>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <AppNavigator />
    </SafeAreaProvider>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}

export default App;
