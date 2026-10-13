import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { notificationsService } from '../services/notificationsService';
import { useTheme } from '../context/ThemeContext';
import Button from '../components/Button';
import StyledModal from '../components/StyledModal';
import { BellIcon } from '../components/icons/ActionIcons';

interface WelcomePermissionsScreenProps {
  onComplete: () => void;
}

type PermissionDialog = 'denied' | 'error' | 'skip';

// Coincide con lo que programa notificationsService para cada recordatorio fiscal
const notificationMoments = [
  'Cada día desde 3 días antes del vencimiento, a las 9:00',
  'El mismo día del vencimiento',
  'Antes de tus tareas personales, si activas su recordatorio',
];

export default function WelcomePermissionsScreen({
  onComplete,
}: WelcomePermissionsScreenProps) {
  const { isDark } = useTheme();
  const [isRequesting, setIsRequesting] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  // El contenido del diálogo se conserva al cerrar para que no se vacíe durante la animación
  const [dialog, setDialog] = useState<PermissionDialog>('skip');
  const [dialogVisible, setDialogVisible] = useState(false);

  const openDialog = (next: PermissionDialog) => {
    setDialog(next);
    setDialogVisible(true);
  };
  const closeDialog = () => setDialogVisible(false);

  const handleRequestPermissions = async () => {
    try {
      setIsRequesting(true);

      // Si ya tiene permisos, continuar directamente
      const alreadyHasPermission = await notificationsService.checkPermissions();
      if (alreadyHasPermission) {
        setHasPermission(true);
        setTimeout(onComplete, 500);
        return;
      }

      // Muestra el diálogo nativo del sistema
      const granted = await notificationsService.requestPermissions();

      if (granted) {
        setHasPermission(true);
        // Crear el canal de notificaciones para Android
        await notificationsService.createNotificationChannel();
        // El diálogo del sistema ya confirmó el permiso: no hace falta otro que lo repita
        onComplete();
      } else {
        openDialog('denied');
      }
    } catch (error) {
      console.error('Error al solicitar permisos:', error);
      openDialog('error');
    } finally {
      setIsRequesting(false);
    }
  };

  const continueWithoutNotifications = {
    text: 'Continuar sin notificaciones',
    style: 'cancel' as const,
    onPress: () => {
      closeDialog();
      onComplete();
    },
  };

  const dialogs: Record<
    PermissionDialog,
    { title: string; message: string; buttons: React.ComponentProps<typeof StyledModal>['buttons'] }
  > = {
    denied: {
      title: 'Permiso no concedido',
      message:
        'Puedes activar las notificaciones más tarde desde Ajustes para no perderte ningún recordatorio importante.',
      buttons: [
        continueWithoutNotifications,
        { text: 'Intentar de nuevo', onPress: handleRequestPermissions },
      ],
    },
    error: {
      title: 'No se pudo solicitar el permiso',
      message:
        'Hubo un problema al solicitar los permisos. Puedes continuar y activarlos más tarde desde Ajustes.',
      buttons: [{ text: 'Continuar', onPress: onComplete }],
    },
    skip: {
      title: '¿Continuar sin notificaciones?',
      message:
        'Las notificaciones te ayudan a no perderte ningún vencimiento. Puedes activarlas más tarde desde Ajustes.',
      buttons: [
        { text: 'Volver', style: 'cancel', onPress: closeDialog },
        { text: 'Omitir', onPress: onComplete },
      ],
    },
  };
  const currentDialog = dialogs[dialog];

  return (
    <SafeAreaView className={`flex-1 ${isDark ? 'bg-gray-900' : 'bg-white'}`}>
      <ScrollView
        contentContainerStyle={styles.content}
        className="px-8"
      >
        <View>
          <View className="items-center mb-8">
            <View
              className={`h-24 w-24 rounded-3xl items-center justify-center ${
                isDark ? 'bg-blue-500/15' : 'bg-blue-50'
              }`}
            >
              <BellIcon color={isDark ? '#93c5fd' : '#2563eb'} size={48} />
            </View>
          </View>
        </View>

        <View>
          <Text
            accessibilityRole="header"
            className={`text-3xl font-bold text-center mb-4 ${
              isDark ? 'text-white' : 'text-gray-900'
            }`}
          >
            Activa las notificaciones
          </Text>
          <Text
            className={`text-base text-center leading-6 mb-6 ${
              isDark ? 'text-gray-400' : 'text-gray-600'
            }`}
          >
            Así Gesaccol puede avisarte antes de cada vencimiento fiscal.
          </Text>
        </View>

        <View>
          <View
            className={`rounded-2xl p-4 mb-4 border ${
              isDark ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'
            }`}
          >
            <Text
              className={`text-sm font-semibold mb-3 ${
                isDark ? 'text-gray-200' : 'text-gray-800'
              }`}
            >
              Te avisaremos:
            </Text>
            {notificationMoments.map(moment => (
              <View key={moment} className="flex-row items-start mb-2">
                <View className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 mr-3" />
                <Text className={`flex-1 text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                  {moment}
                </Text>
              </View>
            ))}
          </View>
          <Text
            className="text-xs text-center mb-8 text-gray-500"
          >
            Puedes cambiarlo en cualquier momento desde la configuración del dispositivo.
          </Text>
        </View>
      </ScrollView>

      <View className="px-8 pb-6">
        <Button
          label={hasPermission ? 'Notificaciones activadas' : 'Activar notificaciones'}
          onPress={handleRequestPermissions}
          busy={isRequesting || hasPermission}
          size="large"
          fullWidth
        />

        <View className="mt-2">
          <Button
            label="Omitir por ahora"
            onPress={() => openDialog('skip')}
            variant="text"
            size="large"
            disabled={isRequesting}
            fullWidth
          />
        </View>
      </View>

      <StyledModal
        visible={dialogVisible}
        onClose={closeDialog}
        title={currentDialog.title}
        message={currentDialog.message}
        buttons={currentDialog.buttons}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, justifyContent: 'center' },
});
