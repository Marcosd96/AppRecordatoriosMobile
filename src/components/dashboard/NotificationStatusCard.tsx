import React from 'react';
import { View, Text } from 'react-native';
import AnimatedButton from '../AnimatedButton';
import SectionCard from '../SectionCard';
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

  if (!status) {
    return (
      <SectionCard isDark={isDark} title="Notificaciones">
        <Text className={isDark ? 'text-gray-400' : 'text-gray-500'}>
          Cargando estado de notificaciones...
        </Text>
      </SectionCard>
    );
  }

  const next = status.nextNotification?.exists ? status.nextNotification : undefined;
  const nextDate = next?.date;

  return (
    <SectionCard isDark={isDark} title="Notificaciones">
      {/* Estado de permisos y número de avisos programados */}
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center flex-1 pr-3">
          <View
            className={`w-2.5 h-2.5 rounded-full mr-2 ${
              status.hasPermission ? 'bg-green-500' : 'bg-red-500'
            }`}
          />
          <Text className={`text-sm ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
            {status.hasPermission ? 'Activadas' : 'Sin permiso'}
          </Text>
        </View>
        <Text className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
          <Text className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {status.scheduledCount}
          </Text>{' '}
          programada{status.scheduledCount === 1 ? '' : 's'}
        </Text>
      </View>

      {!status.hasPermission && (
        <View
          className={`rounded-xl px-3 py-2.5 ${isDark ? 'bg-red-500/10' : 'bg-red-50'}`}
          style={{ marginTop: responsive.spacing.sm }}
        >
          <Text className={`text-sm ${isDark ? 'text-red-300' : 'text-red-700'}`}>
            Activa los permisos para recibir recordatorios automáticos.
          </Text>
        </View>
      )}

      {next && nextDate ? (
        <View
          className={`rounded-xl px-3 py-2.5 ${isDark ? 'bg-blue-500/10' : 'bg-blue-50'}`}
          style={{ marginTop: responsive.spacing.sm }}
        >
          <Text className={`text-xs font-medium ${isDark ? 'text-blue-300' : 'text-blue-700'}`}>
            Próxima · {formatTimeUntil(nextDate)}
          </Text>
          <Text
            className={`text-sm font-semibold mt-0.5 ${isDark ? 'text-white' : 'text-gray-900'}`}
            numberOfLines={2}
          >
            {next.title}
          </Text>
          <Text className={`text-xs mt-0.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            {formatDate(nextDate)} a las 9:00 AM
          </Text>
        </View>
      ) : status.scheduledCount === 0 ? (
        <View
          className={`rounded-xl px-3 py-2.5 ${isDark ? 'bg-amber-500/10' : 'bg-amber-50'}`}
          style={{ marginTop: responsive.spacing.sm }}
        >
          <Text className={`text-sm ${isDark ? 'text-amber-300' : 'text-amber-800'}`}>
            No hay notificaciones programadas. Agrega empresas o revisa que tengas recordatorios pendientes.
          </Text>
        </View>
      ) : null}

      <View className="flex-row" style={{ marginTop: responsive.spacing.md, gap: responsive.spacing.sm }}>
        <View className="flex-1">
          <AnimatedButton onPress={onTestNotification}>
            <View className="py-3 rounded-xl bg-blue-600">
              <Text className="text-white text-center text-sm font-semibold">Probar</Text>
            </View>
          </AnimatedButton>
        </View>
        <View className="flex-1">
          <AnimatedButton
            onPress={onOpenTroubleshooting}
            accessibilityLabel="Solucionar problemas de notificaciones"
          >
            <View className={`py-3 rounded-xl ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
              <Text
                className={`text-center text-sm font-semibold ${isDark ? 'text-gray-100' : 'text-gray-800'}`}
              >
                Solucionar problemas
              </Text>
            </View>
          </AnimatedButton>
        </View>
      </View>
    </SectionCard>
  );
}
