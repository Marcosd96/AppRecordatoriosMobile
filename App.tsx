/**
 * Gesaccol
 * Aplicación móvil para gestión de recordatorios fiscales
 *
 * @format
 */

import './global.css';
import React, { useEffect } from 'react';
import { StatusBar, useColorScheme } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import notifee, { EventType } from '@notifee/react-native';
import AppNavigator from './src/navigation/AppNavigator';

function App() {
  const isDarkMode = useColorScheme() === 'dark';

  useEffect(() => {
    // Manejar eventos de notificaciones cuando la app está en primer plano
    return notifee.onForegroundEvent(({ type, detail }) => {
      switch (type) {
        case EventType.DISMISSED:
          console.log('Usuario descartó la notificación');
          break;
        case EventType.PRESS:
          console.log('Usuario presionó la notificación', detail.notification);
          // Aquí podrías navegar a la pantalla de recordatorios
          // navigationRef.current?.navigate('Reminders');
          break;
      }
    });
  }, []);

  useEffect(() => {
    // Manejar eventos de notificaciones cuando la app está en segundo plano o cerrada
    return notifee.onBackgroundEvent(async ({ type, detail }) => {
      if (type === EventType.PRESS) {
        console.log('Usuario presionó la notificación desde segundo plano', detail.notification);
        // Aquí podrías manejar la navegación cuando la app se abre desde una notificación
      }
    });
  }, []);

  return (
    <SafeAreaProvider>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <AppNavigator />
    </SafeAreaProvider>
  );
}

export default App;
