/**
 * @format
 */

import { AppRegistry } from 'react-native';
import notifee, { EventType } from '@notifee/react-native';
import App from './App';
import { name as appName } from './app.json';

// Notifee exige registrar el manejador de segundo plano fuera de React:
// con la app cerrada no se monta ningún componente, así que un useEffect nunca se ejecutaría.
notifee.onBackgroundEvent(async ({ type, detail }) => {
  if (type === EventType.PRESS) {
    console.log('Usuario presionó la notificación desde segundo plano', detail.notification?.id);
    // Aquí podrías manejar la navegación cuando la app se abre desde una notificación
  } else if (type === EventType.DELIVERED) {
    console.log('✅ Notificación entregada (background):', detail.notification?.title);
  }
});

AppRegistry.registerComponent(appName, () => App);
