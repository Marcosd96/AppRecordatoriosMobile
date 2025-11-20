import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { notificationsService } from '../services/notificationsService';
import AnimatedButton from '../components/AnimatedButton';

export default function NotificationTroubleshootingScreen({ navigation }: any) {
  const { isDark } = useTheme();
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<{
    hasPermission: boolean;
    batteryOptimization: boolean;
    scheduledCount: number;
  } | null>(null);
  const [sendingTest, setSendingTest] = useState(false);

  const loadStatus = async () => {
    setLoading(true);
    try {
      const notificationStatus = await notificationsService.getNotificationStatus();
      setStatus(notificationStatus);
    } catch (error) {
      console.error('Error loading notification status:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStatus();
    
    // Reload status when app comes back to foreground
    const unsubscribe = navigation.addListener('focus', () => {
      loadStatus();
    });

    return unsubscribe;
  }, [navigation]);

  const handleRequestPermissions = async () => {
    try {
      const granted = await notificationsService.requestPermissions();
      if (granted) {
        await notificationsService.createNotificationChannel();
        Alert.alert('¡Éxito!', 'Permisos de notificación concedidos.');
      } else {
        Alert.alert(
          'Permisos requeridos',
          'Es necesario activar las notificaciones en la configuración del dispositivo.',
          [
            { text: 'Cancelar', style: 'cancel' },
            { 
              text: 'Ir a Configuración', 
              onPress: () => notificationsService.openNotificationSettings() 
            }
          ]
        );
      }
      loadStatus();
    } catch (error) {
      console.error('Error requesting permissions:', error);
    }
  };

  const handleBatteryOptimization = async () => {
    try {
      await notificationsService.requestBatteryOptimization();
      // Give user time to change settings before reloading
      setTimeout(loadStatus, 1000);
    } catch {
      Alert.alert('Error', 'No se pudo abrir la configuración de batería.');
    }
  };

  const handleTestNotification = async () => {
    setSendingTest(true);
    try {
      await notificationsService.displayTestNotification();
      Alert.alert('Notificación Enviada', 'Deberías recibir una notificación de prueba en unos segundos.');
    } catch {
      Alert.alert('Error', 'No se pudo enviar la notificación de prueba.');
    } finally {
      setSendingTest(false);
    }
  };

  const getManufacturerAdvice = () => {
    // Generic advice for now, could be expanded with device detection
    return [
      {
        title: 'Xiaomi / Redmi / POCO',
        steps: [
          'Ve a Configuración > Aplicaciones > Gesaccol',
          'Activa "Inicio automático"',
          'En "Ahorro de batería", selecciona "Sin restricciones"'
        ]
      },
      {
        title: 'Samsung',
        steps: [
          'Ve a Configuración > Aplicaciones > Gesaccol',
          'Batería > Selecciona "No restringido"'
        ]
      },
      {
        title: 'Huawei',
        steps: [
          'Ve a Configuración > Batería > Inicio de aplicaciones',
          'Busca Gesaccol y desactiva "Gestionar automáticamente"',
          'Asegúrate de que "Ejecutar en segundo plano" esté activo'
        ]
      }
    ];
  };

  if (loading && !status) {
    return (
      <SafeAreaView className={`flex-1 items-center justify-center ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <ActivityIndicator size="large" color="#2563eb" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className={`flex-1 ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <View className={`flex-row items-center p-4 border-b ${isDark ? 'border-gray-800' : 'border-gray-200'}`}>
        <TouchableOpacity onPress={() => navigation.goBack()} className="p-2 mr-2">
          <Text className={`text-xl ${isDark ? 'text-white' : 'text-gray-900'}`}>←</Text>
        </TouchableOpacity>
        <Text className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
          Diagnóstico de Notificaciones
        </Text>
      </View>

      <ScrollView className="flex-1 p-4">
        {/* Status Cards */}
        <View className="mb-6">
          <Text className={`text-sm font-bold mb-3 uppercase ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            Estado del Sistema
          </Text>
          
          {/* Permissions Status */}
          <View className={`p-4 rounded-xl mb-3 border ${
            status?.hasPermission 
              ? isDark ? 'bg-green-900/20 border-green-800' : 'bg-green-50 border-green-200'
              : isDark ? 'bg-red-900/20 border-red-800' : 'bg-red-50 border-red-200'
          }`}>
            <View className="flex-row justify-between items-center">
              <View className="flex-1">
                <Text className={`font-bold mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Permisos de Notificación
                </Text>
                <Text className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                  {status?.hasPermission ? 'Permisos concedidos correctamente.' : 'La app no tiene permiso para mostrar notificaciones.'}
                </Text>
              </View>
              <View className={`w-8 h-8 rounded-full items-center justify-center ${
                status?.hasPermission ? 'bg-green-500' : 'bg-red-500'
              }`}>
                <Text className="text-white font-bold">{status?.hasPermission ? '✓' : '!'}</Text>
              </View>
            </View>
            {!status?.hasPermission && (
              <AnimatedButton onPress={handleRequestPermissions} style={{ marginTop: 12 }}>
                <View className="bg-red-500 py-2 px-4 rounded-lg items-center">
                  <Text className="text-white font-semibold">Solicitar Permisos</Text>
                </View>
              </AnimatedButton>
            )}
          </View>

          {/* Battery Optimization Status */}
          <View className={`p-4 rounded-xl mb-3 border ${
            !status?.batteryOptimization 
              ? isDark ? 'bg-green-900/20 border-green-800' : 'bg-green-50 border-green-200'
              : isDark ? 'bg-orange-900/20 border-orange-800' : 'bg-orange-50 border-orange-200'
          }`}>
            <View className="flex-row justify-between items-center">
              <View className="flex-1">
                <Text className={`font-bold mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Optimización de Batería
                </Text>
                <Text className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                  {!status?.batteryOptimization 
                    ? 'Configuración correcta. La app puede ejecutarse en segundo plano.' 
                    : 'La optimización de batería puede impedir que lleguen las notificaciones.'}
                </Text>
              </View>
              <View className={`w-8 h-8 rounded-full items-center justify-center ${
                !status?.batteryOptimization ? 'bg-green-500' : 'bg-orange-500'
              }`}>
                <Text className="text-white font-bold">{!status?.batteryOptimization ? '✓' : '!'}</Text>
              </View>
            </View>
            {status?.batteryOptimization && (
              <AnimatedButton onPress={handleBatteryOptimization} style={{ marginTop: 12 }}>
                <View className="bg-orange-500 py-2 px-4 rounded-lg items-center">
                  <Text className="text-white font-semibold">Ignorar Optimización</Text>
                </View>
              </AnimatedButton>
            )}
          </View>
        </View>

        {/* Test Actions */}
        <View className="mb-6">
          <Text className={`text-sm font-bold mb-3 uppercase ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            Pruebas
          </Text>
          <AnimatedButton onPress={handleTestNotification} disabled={sendingTest}>
            <View className={`p-4 rounded-xl border flex-row items-center justify-center ${
              isDark ? 'bg-blue-900/20 border-blue-800' : 'bg-blue-50 border-blue-200'
            }`}>
              {sendingTest ? (
                <ActivityIndicator size="small" color="#2563eb" className="mr-2" />
              ) : (
                <Text className="text-xl mr-2">🔔</Text>
              )}
              <Text className={`font-semibold ${isDark ? 'text-blue-300' : 'text-blue-700'}`}>
                {sendingTest ? 'Enviando...' : 'Enviar Notificación de Prueba'}
              </Text>
            </View>
          </AnimatedButton>
        </View>

        {/* Manufacturer Advice */}
        <View className="mb-8">
          <Text className={`text-sm font-bold mb-3 uppercase ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            Guía por Fabricante
          </Text>
          <Text className={`text-sm mb-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Algunos fabricantes bloquean notificaciones agresivamente. Busca tu marca y sigue los pasos si sigues teniendo problemas.
          </Text>
          
          {getManufacturerAdvice().map((advice, index) => (
            <View key={index} className={`p-4 rounded-xl mb-3 border ${
              isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
            }`}>
              <Text className={`font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {advice.title}
              </Text>
              {advice.steps.map((step, stepIndex) => (
                <View key={stepIndex} className="flex-row mb-1">
                  <Text className={`mr-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>•</Text>
                  <Text className={`text-sm flex-1 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                    {step}
                  </Text>
                </View>
              ))}
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
