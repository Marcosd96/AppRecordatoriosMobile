import React, { useState } from 'react';
import { View, Text, ActivityIndicator, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { notificationsService } from '../services/notificationsService';
import { useTheme } from '../context/ThemeContext';
import AnimatedView from '../components/AnimatedView';
import AnimatedButton from '../components/AnimatedButton';
import StyledModal from '../components/StyledModal';
import { BellIcon } from '../components/icons/ActionIcons';

interface WelcomePermissionsScreenProps {
  onComplete: () => void;
}

type PermissionDialog = 'granted' | 'denied' | 'error' | 'skip';

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
        openDialog('granted');
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
    granted: {
      title: '¡Notificaciones activadas!',
      message: 'Te avisaremos de tus recordatorios fiscales importantes.',
      buttons: [{ text: 'Continuar', onPress: () => setTimeout(onComplete, 300) }],
    },
    denied: {
      title: 'Permiso no concedido',
      message:
        'Puedes activar las notificaciones más tarde desde la configuración de la app para no perderte ningún recordatorio importante.',
      buttons: [
        continueWithoutNotifications,
        { text: 'Intentar de nuevo', onPress: handleRequestPermissions },
      ],
    },
    error: {
      title: 'No se pudo solicitar el permiso',
      message:
        'Hubo un problema al solicitar los permisos. Puedes continuar y activarlos más tarde desde la configuración.',
      buttons: [{ text: 'Continuar', onPress: onComplete }],
    },
    skip: {
      title: '¿Continuar sin notificaciones?',
      message:
        'Las notificaciones te ayudan a no perderte ningún vencimiento. Puedes activarlas más tarde desde la configuración.',
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
        <AnimatedView animationType="scale" delay={0} duration={600}>
          <View className="items-center mb-8">
            <View
              className={`h-24 w-24 rounded-3xl items-center justify-center ${
                isDark ? 'bg-blue-500/15' : 'bg-blue-50'
              }`}
            >
              <BellIcon color={isDark ? '#93c5fd' : '#2563eb'} size={48} />
            </View>
          </View>
        </AnimatedView>

        <AnimatedView animationType="slideUp" delay={150} duration={600}>
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
        </AnimatedView>

        <AnimatedView animationType="fadeIn" delay={300} duration={600}>
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
        </AnimatedView>
      </ScrollView>

      <View className="px-8 pb-6">
        <AnimatedButton
          onPress={handleRequestPermissions}
          disabled={isRequesting || hasPermission}
          accessibilityState={{ disabled: isRequesting || hasPermission, busy: isRequesting }}
        >
          <View
            className={`py-4 rounded-xl flex-row items-center justify-center ${
              hasPermission ? 'bg-green-600' : 'bg-blue-600'
            } ${isRequesting ? 'opacity-70' : ''}`}
          >
            {isRequesting && <ActivityIndicator color="white" size="small" className="mr-2" />}
            <Text className="text-white text-lg font-semibold">
              {isRequesting
                ? 'Solicitando...'
                : hasPermission
                ? '✓ Notificaciones activadas'
                : 'Activar notificaciones'}
            </Text>
          </View>
        </AnimatedButton>

        <AnimatedButton onPress={() => openDialog('skip')} disabled={isRequesting}>
          <View className="py-3 mt-2 items-center">
            <Text className={`text-base ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              Omitir por ahora
            </Text>
          </View>
        </AnimatedButton>
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
