import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  LayoutAnimation,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { notificationsService } from '../services/notificationsService';
import AnimatedButton from '../components/AnimatedButton';
import LoadingScreen from '../components/LoadingScreen';
import StyledModal from '../components/StyledModal';
import {
  AlertIcon,
  BackIcon,
  CheckIcon,
  ChevronDownIcon,
} from '../components/icons/ActionIcons';

// Consejos genéricos; se podrían ampliar detectando el fabricante del dispositivo
const manufacturerAdvice = [
  {
    title: 'Xiaomi / Redmi / POCO',
    steps: [
      'Ve a Configuración > Aplicaciones > Gesaccol',
      'Activa "Inicio automático"',
      'En "Ahorro de batería", selecciona "Sin restricciones"',
    ],
  },
  {
    title: 'Samsung',
    steps: [
      'Ve a Configuración > Aplicaciones > Gesaccol',
      'Batería > Selecciona "No restringido"',
    ],
  },
  {
    title: 'Huawei',
    steps: [
      'Ve a Configuración > Batería > Inicio de aplicaciones',
      'Busca Gesaccol y desactiva "Gestionar automáticamente"',
      'Asegúrate de que "Ejecutar en segundo plano" esté activo',
    ],
  },
];

interface ResultMessage {
  title: string;
  message: string;
  /** Ofrece abrir los ajustes de notificaciones del sistema */
  offerSettings?: boolean;
}

interface StatusRowProps {
  isDark: boolean;
  ok: boolean;
  title: string;
  okText: string;
  problemText: string;
  actionLabel: string;
  onAction: () => void;
}

/** Estado de un requisito: icono verde si está bien, ámbar con acción si no */
function StatusRow({ isDark, ok, title, okText, problemText, actionLabel, onAction }: StatusRowProps) {
  return (
    <View
      className={`p-4 rounded-2xl mb-3 border ${
        isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
      }`}
    >
      <View className="flex-row items-start">
        <View
          className={`h-9 w-9 rounded-full items-center justify-center mr-3 ${
            ok
              ? isDark ? 'bg-green-500/15' : 'bg-green-50'
              : isDark ? 'bg-amber-500/15' : 'bg-amber-50'
          }`}
        >
          {ok ? (
            <CheckIcon color={isDark ? '#86efac' : '#16a34a'} size={18} />
          ) : (
            <AlertIcon color={isDark ? '#fcd34d' : '#d97706'} size={18} />
          )}
        </View>
        <View className="flex-1">
          <Text className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{title}</Text>
          <Text className={`text-sm mt-0.5 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            {ok ? okText : problemText}
          </Text>
        </View>
      </View>
      {!ok && (
        <AnimatedButton onPress={onAction} style={styles.rowAction}>
          <View className="bg-blue-600 py-2.5 px-4 rounded-xl items-center">
            <Text className="text-white font-semibold">{actionLabel}</Text>
          </View>
        </AnimatedButton>
      )}
    </View>
  );
}

export default function NotificationTroubleshootingScreen({ navigation }: any) {
  const { isDark } = useTheme();
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<{
    hasPermission: boolean;
    batteryOptimization: boolean;
    scheduledCount: number;
  } | null>(null);
  const [sendingTest, setSendingTest] = useState(false);
  const [expandedAdvice, setExpandedAdvice] = useState<string | null>(null);
  // El mensaje se conserva al cerrar para que no se vacíe durante la animación de salida
  const [result, setResult] = useState<ResultMessage>({ title: '', message: '' });
  const [showResult, setShowResult] = useState(false);

  const showMessage = (message: ResultMessage) => {
    setResult(message);
    setShowResult(true);
  };

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

    // Recargar al volver a la pantalla (p. ej. después de cambiar los ajustes)
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
        showMessage({ title: '¡Listo!', message: 'Permisos de notificación concedidos.' });
      } else {
        showMessage({
          title: 'Permisos requeridos',
          message: 'Es necesario activar las notificaciones en la configuración del dispositivo.',
          offerSettings: true,
        });
      }
      loadStatus();
    } catch (error) {
      console.error('Error requesting permissions:', error);
    }
  };

  const handleBatteryOptimization = async () => {
    try {
      await notificationsService.requestBatteryOptimization();
      // Dar tiempo a cambiar el ajuste antes de recargar
      setTimeout(loadStatus, 1000);
    } catch {
      showMessage({ title: 'Error', message: 'No se pudo abrir la configuración de batería.' });
    }
  };

  const handleTestNotification = async () => {
    setSendingTest(true);
    try {
      await notificationsService.displayTestNotification();
      showMessage({
        title: 'Notificación enviada',
        message: 'Deberías recibir una notificación de prueba en unos segundos.',
      });
    } catch {
      showMessage({ title: 'Error', message: 'No se pudo enviar la notificación de prueba.' });
    } finally {
      setSendingTest(false);
    }
  };

  const toggleAdvice = (title: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedAdvice(current => (current === title ? null : title));
  };

  if (loading && !status) {
    return <LoadingScreen isDark={isDark} message="Comprobando notificaciones..." />;
  }

  const sectionTitleClass = 'text-xs font-bold mb-3 uppercase tracking-wide text-gray-500';
  const allOk = !!status?.hasPermission && !status?.batteryOptimization;

  return (
    <SafeAreaView className={`flex-1 ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <View
        className={`flex-row items-center px-2 py-2 border-b ${
          isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'
        }`}
      >
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          accessibilityRole="button"
          accessibilityLabel="Volver"
          className="h-11 w-11 items-center justify-center rounded-full mr-1"
        >
          <BackIcon color={isDark ? '#f9fafb' : '#111827'} />
        </TouchableOpacity>
        <Text
          accessibilityRole="header"
          className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}
        >
          Diagnóstico de notificaciones
        </Text>
      </View>

      <ScrollView className="flex-1" contentContainerStyle={styles.content}>
        {/* Resumen */}
        <View
          className={`rounded-2xl p-4 mb-6 ${
            allOk
              ? isDark ? 'bg-green-500/10' : 'bg-green-50'
              : isDark ? 'bg-amber-500/10' : 'bg-amber-50'
          }`}
        >
          <Text
            className={`font-semibold ${
              allOk
                ? isDark ? 'text-green-300' : 'text-green-800'
                : isDark ? 'text-amber-300' : 'text-amber-800'
            }`}
          >
            {allOk ? 'Todo está bien configurado' : 'Hay ajustes que revisar'}
          </Text>
          <Text className={`text-sm mt-0.5 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
            {status?.scheduledCount ?? 0} notificación
            {status?.scheduledCount === 1 ? '' : 'es'} programada
            {status?.scheduledCount === 1 ? '' : 's'}
          </Text>
        </View>

        <Text className={sectionTitleClass}>Estado del sistema</Text>
        <StatusRow
          isDark={isDark}
          ok={!!status?.hasPermission}
          title="Permisos de notificación"
          okText="Permisos concedidos correctamente."
          problemText="La app no tiene permiso para mostrar notificaciones."
          actionLabel="Solicitar permisos"
          onAction={handleRequestPermissions}
        />
        <StatusRow
          isDark={isDark}
          ok={!status?.batteryOptimization}
          title="Optimización de batería"
          okText="La app puede ejecutarse en segundo plano."
          problemText="La optimización de batería puede impedir que lleguen las notificaciones."
          actionLabel="Desactivar optimización"
          onAction={handleBatteryOptimization}
        />

        <Text className={`${sectionTitleClass} mt-3`}>Prueba</Text>
        <AnimatedButton
          onPress={handleTestNotification}
          disabled={sendingTest}
          accessibilityState={{ disabled: sendingTest, busy: sendingTest }}
        >
          <View
            className={`py-3.5 rounded-xl flex-row items-center justify-center ${
              isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
            } ${sendingTest ? 'opacity-70' : ''}`}
          >
            {sendingTest && (
              <ActivityIndicator size="small" color={isDark ? '#60a5fa' : '#2563eb'} className="mr-2" />
            )}
            <Text className={`font-semibold ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
              {sendingTest ? 'Enviando...' : 'Enviar notificación de prueba'}
            </Text>
          </View>
        </AnimatedButton>

        <Text className={`${sectionTitleClass} mt-8`}>Guía por fabricante</Text>
        <Text className={`text-sm mb-3 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          Algunos fabricantes bloquean las notificaciones en segundo plano. Si siguen sin llegar,
          busca tu marca y sigue los pasos.
        </Text>
        <View
          className={`rounded-2xl border overflow-hidden ${
            isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
          }`}
        >
          {manufacturerAdvice.map((advice, index) => {
            const expanded = expandedAdvice === advice.title;
            return (
              <View
                key={advice.title}
                className={
                  index > 0 ? (isDark ? 'border-t border-gray-700' : 'border-t border-gray-100') : ''
                }
              >
                <TouchableOpacity
                  onPress={() => toggleAdvice(advice.title)}
                  accessibilityRole="button"
                  accessibilityState={{ expanded }}
                  className="flex-row items-center justify-between px-4 py-3.5"
                >
                  <Text className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {advice.title}
                  </Text>
                  <View style={expanded ? styles.chevronOpen : undefined}>
                    <ChevronDownIcon color={isDark ? '#9ca3af' : '#6b7280'} />
                  </View>
                </TouchableOpacity>
                {expanded && (
                  <View className="px-4 pb-4">
                    {advice.steps.map((step, stepIndex) => (
                      <View key={step} className="flex-row mb-2">
                        <Text
                          className={`w-5 text-sm font-semibold ${
                            isDark ? 'text-blue-400' : 'text-blue-600'
                          }`}
                        >
                          {stepIndex + 1}.
                        </Text>
                        <Text className={`text-sm flex-1 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                          {step}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            );
          })}
        </View>
      </ScrollView>

      <StyledModal
        visible={showResult}
        onClose={() => setShowResult(false)}
        title={result.title}
        message={result.message}
        buttons={
          result.offerSettings
            ? [
                { text: 'Cancelar', style: 'cancel', onPress: () => setShowResult(false) },
                {
                  text: 'Ir a configuración',
                  onPress: () => notificationsService.openNotificationSettings(),
                },
              ]
            : [{ text: 'Aceptar', onPress: () => setShowResult(false) }]
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, paddingBottom: 32 },
  rowAction: { marginTop: 12 },
  chevronOpen: { transform: [{ rotate: '180deg' }] },
});
