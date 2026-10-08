/**
 * @format
 */

import { AppRegistry } from 'react-native';
import notifee, { EventType } from '@notifee/react-native';
import App from './App';
import { openFromNotification } from './src/navigation/notificationNavigation';
import { handleNotificationAction } from './src/services/notificationActions';
import { name as appName } from './app.json';

// Notifee exige registrar el manejador de segundo plano fuera de React:
// con la app cerrada no se monta ningún componente, así que un useEffect nunca se ejecutaría.
notifee.onBackgroundEvent(async ({ type, detail }) => {
  if (type === EventType.PRESS) {
    console.log('Usuario presionó la notificación desde segundo plano', detail.notification?.id);
    // Queda pendiente y se abre en cuanto la app muestre la pantalla principal
    openFromNotification(detail.notification);
  } else if (type === EventType.ACTION_PRESS) {
    // "Completar" / "Posponer 1 h" con la app cerrada: se espera a que termine
    await handleNotificationAction(detail.pressAction?.id, detail.notification);
  } else if (type === EventType.DELIVERED) {
    console.log('✅ Notificación entregada (background):', detail.notification?.title);
  }
});

AppRegistry.registerComponent(appName, () => App);
