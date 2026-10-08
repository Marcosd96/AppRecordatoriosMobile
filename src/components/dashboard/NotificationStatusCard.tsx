import React from 'react';
import { View, Text } from 'react-native';
import AnimatedButton from '../AnimatedButton';
import { NotificationStatus } from '../../hooks/useDashboard';
import { formatDate, formatTimeUntil } from './dashboardFormat';
import { useResponsive } from '../../hooks/useResponsive';

interface NotificationStatusCardProps {
  isDark: boolean;
  status: NotificationStatus | null;
  onTestNotification: () => void;
  onOpenTroubleshooting: () => void;
}

export default function NotificationStatusCard({ isDark, status, onTestNotification, onOpenTroubleshooting }: NotificationStatusCardProps) {
  const responsive = useResponsive();

  return (
    <View style={{ paddingHorizontal: responsive.spacing.lg, paddingVertical: responsive.spacing.md }}>
      <View
        className={`rounded-3xl border ${
          isDark
            ? 'bg-gray-800 border-gray-700'
            : 'bg-white border-gray-200'
        }`}
        style={{ padding: responsive.spacing.lg }}
      >
        <View className="flex-row items-center" style={{ marginBottom: responsive.spacing.lg }}>
          <Text style={{ fontSize: responsive.fontSize['2xl'], marginRight: responsive.spacing.sm }}>🔔</Text>
          <Text
            className={`font-bold ${
              isDark ? 'text-white' : 'text-gray-900'
            }`}
            style={{ fontSize: responsive.fontSize.xl }}
          >
            Notificaciones
          </Text>
        </View>
        {status ? (
          <>
            <View className="flex-row items-center mb-3">
              <View
                className={`w-3 h-3 rounded-full mr-2 ${
                  status.hasPermission
                    ? 'bg-green-500'
                    : 'bg-red-500'
                }`}
              />
              <Text
                className={`flex-1 ${
                  isDark ? 'text-gray-200' : 'text-gray-700'
                }`}
              >
                {status.hasPermission
                  ? 'Permisos concedidos ✓'
                  : 'Permisos no concedidos ✗'}
              </Text>
            </View>

            <View className="mb-3">
              <Text
                className={`text-sm mb-1 ${
                  isDark ? 'text-gray-400' : 'text-gray-600'
                }`}
              >
                Notificaciones programadas:
              </Text>
              <Text
                className={`text-lg font-bold ${
                  isDark ? 'text-white' : 'text-gray-900'
                }`}
              >
                {status.scheduledCount}
              </Text>
            </View>

            {status.nextNotification?.exists &&
              status.nextNotification.date && (
                <View
                  className={`mb-3 p-3 rounded-lg border ${
                    isDark
                      ? 'bg-blue-900/30 border-blue-800'
                      : 'bg-blue-50 border-blue-200'
                  }`}
                >
                  <Text
                    className={`text-xs mb-1 font-medium ${
                      isDark ? 'text-blue-300' : 'text-blue-700'
                    }`}
                  >
                    Próxima notificación:
                  </Text>
                  <Text
                    className={`text-sm font-semibold mb-1 ${
                      isDark ? 'text-blue-200' : 'text-blue-900'
                    }`}
                  >
                    {status.nextNotification.title}
                  </Text>
                  <Text
                    className={`text-xs ${
                      isDark ? 'text-blue-300' : 'text-blue-700'
                    }`}
                  >
                    {formatDate(status.nextNotification.date)} a
                    las 9:00 AM
                  </Text>
                  <Text
                    className={`text-xs mt-1 ${
                      isDark ? 'text-blue-400' : 'text-blue-600'
                    }`}
                  >
                    {formatTimeUntil(
                      status.nextNotification.date,
                    )}
                  </Text>
                </View>
              )}

            {status.scheduledCount === 0 && (
              <View
                className={`mb-3 p-3 rounded-lg border ${
                  isDark
                    ? 'bg-yellow-900/30 border-yellow-800'
                    : 'bg-yellow-50 border-yellow-200'
                }`}
              >
                <Text
                  className={`text-xs text-center ${
                    isDark ? 'text-yellow-300' : 'text-yellow-700'
                  }`}
                >
                  No hay notificaciones programadas. Agrega empresas o
                  verifica que tengas recordatorios pendientes.
                </Text>
              </View>
            )}

            <AnimatedButton onPress={onTestNotification}>
              <View
                className={`py-3 rounded-xl mt-3 ${
                  isDark ? 'bg-blue-600' : 'bg-blue-600'
                }`}
              >
                <Text className="text-white text-center font-semibold">
                  🔔 Probar Notificación
                </Text>
              </View>
            </AnimatedButton>

            {!status.hasPermission && (
              <Text
                className={`text-xs mt-2 text-center ${
                  isDark ? 'text-gray-400' : 'text-gray-500'
                }`}
              >
                Activa los permisos para recibir recordatorios automáticos
              </Text>
            )}
            <AnimatedButton
              onPress={onOpenTroubleshooting}
              style={{ marginTop: responsive.spacing.sm }}
            >
              <View
                className={`px-4 py-3 rounded-xl flex-row items-center justify-center ${
                  isDark ? 'bg-blue-500/20' : 'bg-blue-50'
                }`}
              >
                <Text className="mr-2">🔧</Text>
                <Text
                  className={`text-sm font-semibold ${
                    isDark ? 'text-blue-300' : 'text-blue-700'
                  }`}
                >
                  Solucionar problemas de notificaciones
                </Text>
              </View>
            </AnimatedButton>
          </>
        ) : (
          <Text
            className={`text-center ${
              isDark ? 'text-gray-300' : 'text-gray-600'
            }`}
          >
            Cargando estado de notificaciones...
          </Text>
        )}
      </View>
    </View>
  );
}
