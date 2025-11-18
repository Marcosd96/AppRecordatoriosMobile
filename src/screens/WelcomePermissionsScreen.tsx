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
import { useTheme } from '../context/ThemeContext';
import AnimatedView from '../components/AnimatedView';
import AnimatedButton from '../components/AnimatedButton';
import StyledModal from '../components/StyledModal';

const { width } = Dimensions.get('window');

interface WelcomePermissionsScreenProps {
  onComplete: () => void;
}

export default function WelcomePermissionsScreen({
  onComplete,
}: WelcomePermissionsScreenProps) {
  const { isDark } = useTheme();
  const [isRequesting, setIsRequesting] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  const [showPermissionsGrantedModal, setShowPermissionsGrantedModal] = useState(false);

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
        
        // Mostrar modal de permisos otorgados
        setShowPermissionsGrantedModal(true);
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
    <SafeAreaView className={`flex-1 ${isDark ? 'bg-gray-900' : 'bg-white'}`}>
      <View className="flex-1 items-center justify-center px-8">
        {/* Icono grande */}
        <AnimatedView animationType="scale" delay={0} duration={600}>
          <View className="mb-8">
            <Text className="text-7xl">🔔</Text>
          </View>
        </AnimatedView>

        {/* Título principal */}
        <AnimatedView animationType="slideUp" delay={150} duration={600}>
          <Text className={`text-3xl font-bold text-center mb-4 ${
            isDark ? 'text-white' : 'text-gray-900'
          }`}>
            Activa las Notificaciones
          </Text>
        </AnimatedView>

        {/* Descripción */}
        <AnimatedView animationType="fadeIn" delay={300} duration={600}>
          <View className="mb-8">
            <Text className={`text-lg text-center leading-7 mb-4 ${
              isDark ? 'text-gray-300' : 'text-gray-600'
            }`}>
              Para que Gesaccol pueda ayudarte a no perderte ningún recordatorio fiscal importante, necesitamos tu permiso para enviarte notificaciones.
            </Text>
            
            <View className={`rounded-lg p-4 mb-4 ${
              isDark 
                ? 'bg-blue-900/30' 
                : 'bg-blue-50'
            }`}>
              <Text className={`text-base font-semibold mb-2 ${
                isDark ? 'text-blue-200' : 'text-gray-800'
              }`}>
                📱 Recibirás notificaciones:
              </Text>
              <View className="ml-2">
                <Text className={`text-sm mb-1 ${
                  isDark ? 'text-blue-100' : 'text-gray-700'
                }`}>
                  • 3 días antes del vencimiento
                </Text>
                <Text className={`text-sm mb-1 ${
                  isDark ? 'text-blue-100' : 'text-gray-700'
                }`}>
                  • El día del vencimiento
                </Text>
                <Text className={`text-sm ${
                  isDark ? 'text-blue-100' : 'text-gray-700'
                }`}>
                  • Recordatorios importantes
                </Text>
              </View>
            </View>

            <Text className={`text-sm text-center ${
              isDark ? 'text-gray-400' : 'text-gray-500'
            }`}>
              Puedes cambiar estos permisos en cualquier momento desde la configuración de tu dispositivo.
            </Text>
          </View>
        </AnimatedView>

        {/* Botón principal */}
        <AnimatedView animationType="slideUp" delay={500} duration={600}>
          <View className="w-full mb-4">
            <AnimatedButton
              onPress={handleRequestPermissions}
              disabled={isRequesting || hasPermission}
            >
              <View
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
              </View>
            </AnimatedButton>
          </View>
        </AnimatedView>

        {/* Botón secundario */}
        <AnimatedView animationType="fadeIn" delay={700} duration={500}>
          <AnimatedButton onPress={handleSkip} disabled={isRequesting}>
            <View className="py-3 rounded-lg items-center">
              <Text className={`text-base ${
                isDark ? 'text-gray-300' : 'text-gray-600'
              }`}>
                Omitir por ahora
              </Text>
            </View>
          </AnimatedButton>
        </AnimatedView>
      </View>

      {/* Modal de Permisos Otorgados */}
      <StyledModal
        visible={showPermissionsGrantedModal}
        onClose={() => {
          setShowPermissionsGrantedModal(false);
          setTimeout(() => {
            onComplete();
          }, 300);
        }}
        title="✅ ¡Permisos Otorgados!"
        message="Ahora recibirás notificaciones sobre tus recordatorios fiscales importantes."
        buttons={[
          {
            text: 'Continuar',
            onPress: () => {
              setShowPermissionsGrantedModal(false);
              setTimeout(() => {
                onComplete();
              }, 300);
            },
          },
        ]}
      />
    </SafeAreaView>
  );
}

