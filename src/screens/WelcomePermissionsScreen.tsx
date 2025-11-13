import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { notificationsService } from '../services/notificationsService';

const { width } = Dimensions.get('window');

interface WelcomePermissionsScreenProps {
  onComplete: () => void;
}

export default function WelcomePermissionsScreen({
  onComplete,
}: WelcomePermissionsScreenProps) {
  const [isRequesting, setIsRequesting] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);

  const handleRequestPermissions = async () => {
    try {
      setIsRequesting(true);

      // Verificar si ya tiene permisos
      const alreadyHasPermission = await notificationsService.checkPermissions();
      if (alreadyHasPermission) {
        setHasPermission(true);
        setTimeout(() => {
          onComplete();
        }, 500);
        return;
      }

      // Solicitar permisos - esto mostrará el diálogo nativo del sistema
      const granted = await notificationsService.requestPermissions();

      if (granted) {
        setHasPermission(true);
        // Crear el canal de notificaciones para Android
        await notificationsService.createNotificationChannel();
        
        Alert.alert(
          '¡Permisos otorgados!',
          'Ahora recibirás notificaciones sobre tus recordatorios fiscales importantes.',
          [
            {
              text: 'Continuar',
              onPress: () => {
                setTimeout(() => {
                  onComplete();
                }, 300);
              },
            },
          ]
        );
      } else {
        Alert.alert(
          'Permisos no otorgados',
          'Puedes activar las notificaciones más tarde desde la configuración de la app para no perderte ningún recordatorio importante.',
          [
            {
              text: 'Continuar sin notificaciones',
              onPress: () => {
                onComplete();
              },
            },
            {
              text: 'Intentar de nuevo',
              onPress: handleRequestPermissions,
              style: 'cancel',
            },
          ]
        );
      }
    } catch (error) {
      console.error('Error al solicitar permisos:', error);
      Alert.alert(
        'Error',
        'Hubo un problema al solicitar los permisos. Puedes continuar y activarlos más tarde desde la configuración.',
        [
          {
            text: 'Continuar',
            onPress: () => {
              onComplete();
            },
          },
        ]
      );
    } finally {
      setIsRequesting(false);
    }
  };

  const handleSkip = () => {
    Alert.alert(
      '¿Estás seguro?',
      'Las notificaciones te ayudan a no perderte ningún recordatorio importante. Puedes activarlas más tarde desde la configuración.',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Continuar sin notificaciones',
          onPress: () => {
            onComplete();
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 items-center justify-center px-8">
        {/* Icono grande */}
        <View className="mb-8">
          <Text className="text-7xl">🔔</Text>
        </View>

        {/* Título principal */}
        <Text className="text-3xl font-bold text-gray-900 text-center mb-4">
          Activa las Notificaciones
        </Text>

        {/* Descripción */}
        <View className="mb-8">
          <Text className="text-lg text-gray-600 text-center leading-7 mb-4">
            Para que Gesaccol pueda ayudarte a no perderte ningún recordatorio fiscal importante, necesitamos tu permiso para enviarte notificaciones.
          </Text>
          
          <View className="bg-blue-50 rounded-lg p-4 mb-4">
            <Text className="text-base text-gray-800 font-semibold mb-2">
              📱 Recibirás notificaciones:
            </Text>
            <View className="ml-2">
              <Text className="text-sm text-gray-700 mb-1">
                • 3 días antes del vencimiento
              </Text>
              <Text className="text-sm text-gray-700 mb-1">
                • El día del vencimiento
              </Text>
              <Text className="text-sm text-gray-700">
                • Recordatorios importantes
              </Text>
            </View>
          </View>

          <Text className="text-sm text-gray-500 text-center">
            Puedes cambiar estos permisos en cualquier momento desde la configuración de tu dispositivo.
          </Text>
        </View>

        {/* Botón principal */}
        <View className="w-full mb-4">
          <TouchableOpacity
            onPress={handleRequestPermissions}
            disabled={isRequesting || hasPermission}
            className={`py-4 rounded-lg items-center ${
              isRequesting || hasPermission
                ? 'bg-green-500'
                : 'bg-blue-600'
            }`}
            style={{ width: width - 64 }}
          >
            {isRequesting ? (
              <View className="flex-row items-center">
                <ActivityIndicator color="white" size="small" className="mr-2" />
                <Text className="text-white text-lg font-semibold">
                  Solicitando permisos...
                </Text>
              </View>
            ) : hasPermission ? (
              <View className="flex-row items-center">
                <Text className="text-white text-lg font-semibold mr-2">
                  ✓ Permisos otorgados
                </Text>
              </View>
            ) : (
              <Text className="text-white text-lg font-semibold">
                Activar Notificaciones
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Botón secundario */}
        <TouchableOpacity
          onPress={handleSkip}
          disabled={isRequesting}
          className="py-3 rounded-lg items-center"
        >
          <Text className="text-gray-600 text-base">
            Omitir por ahora
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

