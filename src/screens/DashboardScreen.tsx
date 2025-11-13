import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Reminder } from '../types';
import { dashboardService } from '../services/dashboardService';
import { companiesService } from '../services/companiesService';
import { healthService } from '../services/healthService';
import { remindersService } from '../services/remindersService';
import { notificationsService } from '../services/notificationsService';
import { useAuth } from '../context/AuthContext';

export default function DashboardScreen({ navigation }: any) {
  const { user, signOut } = useAuth();
  const [upcomingReminders, setUpcomingReminders] = useState<Reminder[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    overdue: 0,
    upcoming: 0,
  });
  const [companiesCount, setCompaniesCount] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [notificationStatus, setNotificationStatus] = useState<{
    hasPermission: boolean;
    scheduledCount: number;
    nextNotification?: {
      exists: boolean;
      title?: string;
      body?: string;
      date?: Date;
    };
  } | null>(null);

  const loadData = async () => {
    try {
      // Primero verificar conectividad
      try {
        await healthService.check();
        console.log('[Dashboard] Conexión con servidor OK');
      } catch (healthError: any) {
        console.error('[Dashboard] Error de conectividad:', healthError);
        Alert.alert(
          'Error de Conexión',
          `No se pudo conectar al servidor:\n\n${healthError.message}\n\n` +
          `Verifica:\n` +
          `1. Tu conexión a internet\n` +
          `2. Que la URL sea correcta\n` +
          `3. Que el servidor esté funcionando`
        );
        setLoading(false);
        setRefreshing(false);
        return;
      }

      // Luego cargar datos del dashboard
      const dashboardData = await dashboardService.getDashboard();
      setStats(dashboardData.stats);
      setUpcomingReminders(dashboardData.upcomingReminders);
      setCompaniesCount(dashboardData.companiesCount);
      
      // Asegurar que las notificaciones estén programadas después de cargar datos
      // Esto es importante si hay empresas existentes desde el proyecto web
      try {
        const allReminders = await remindersService.getAll();
        await notificationsService.scheduleAllReminders(allReminders);
        
        // Actualizar estado de notificaciones
        const status = await notificationsService.getNotificationStatus();
        const nextNotification = await notificationsService.getNextNotification();
        setNotificationStatus({
          hasPermission: status.hasPermission,
          scheduledCount: status.scheduledCount,
          nextNotification: nextNotification.exists ? {
            exists: true,
            title: nextNotification.title,
            body: nextNotification.body,
            date: nextNotification.date,
          } : { exists: false },
        });
      } catch (notifError) {
        console.error('[Dashboard] Error programando notificaciones:', notifError);
        // No interrumpir el flujo si falla la programación de notificaciones
      }
    } catch (error: any) {
      console.error('Error al cargar datos del dashboard:', error);
      
      let errorMessage = error.message || 'No se pudieron cargar los datos.';
      
      // Mensaje más específico para errores de autenticación
      if (error.message?.includes('No autorizado') || error.message?.includes('401')) {
        errorMessage = 'Las APIs requieren autenticación. Por favor, implementa autenticación móvil.';
      }
      
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    // Inicializar notificaciones al montar el componente
    const initializeNotifications = async () => {
      try {
        await notificationsService.createNotificationChannel();
        const hasPermission = await notificationsService.checkPermissions();
        if (!hasPermission) {
          await notificationsService.requestPermissions();
        }
        
        // Cargar todos los recordatorios y programar notificaciones
        // Esto asegura que las empresas existentes desde el proyecto web tengan notificaciones
        const allReminders = await remindersService.getAll();
        await notificationsService.scheduleAllReminders(allReminders);
        console.log('[Dashboard] Notificaciones inicializadas para', allReminders.length, 'recordatorios');
        
        // Obtener estado de notificaciones
        const status = await notificationsService.getNotificationStatus();
        const nextNotification = await notificationsService.getNextNotification();
        setNotificationStatus({
          hasPermission: status.hasPermission,
          scheduledCount: status.scheduledCount,
          nextNotification: nextNotification.exists ? {
            exists: true,
            title: nextNotification.title,
            body: nextNotification.body,
            date: nextNotification.date,
          } : { exists: false },
        });
      } catch (error) {
        console.error('[Dashboard] Error inicializando notificaciones:', error);
        // No mostrar error al usuario, solo loguear
      }
    };
    
    initializeNotifications();
    loadData();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    
    // Actualizar estado de notificaciones al refrescar
    try {
      const status = await notificationsService.getNotificationStatus();
      const nextNotification = await notificationsService.getNextNotification();
      setNotificationStatus({
        hasPermission: status.hasPermission,
        scheduledCount: status.scheduledCount,
        nextNotification: nextNotification.exists ? {
          exists: true,
          title: nextNotification.title,
          body: nextNotification.body,
          date: nextNotification.date,
        } : { exists: false },
      });
    } catch (error) {
      console.error('Error al obtener estado de notificaciones:', error);
    }
  };

  const handleTestNotification = async () => {
    try {
      // Verificar permisos primero
      const hasPermission = await notificationsService.checkPermissions();
      if (!hasPermission) {
        const granted = await notificationsService.requestPermissions();
        if (!granted) {
          Alert.alert(
            'Permisos requeridos',
            'Necesitas conceder permisos de notificación para recibir recordatorios. Puedes activarlos desde la configuración de la app.'
          );
          return;
        }
      }
      
      await notificationsService.displayTestNotification();
      Alert.alert('Éxito', 'Se envió una notificación de prueba. Deberías verla ahora.');
      
      // Actualizar estado
      const status = await notificationsService.getNotificationStatus();
      const nextNotification = await notificationsService.getNextNotification();
      setNotificationStatus({
        hasPermission: status.hasPermission,
        scheduledCount: status.scheduledCount,
        nextNotification: nextNotification.exists ? {
          exists: true,
          title: nextNotification.title,
          body: nextNotification.body,
          date: nextNotification.date,
        } : { exists: false },
      });
    } catch (error: any) {
      console.error('Error al enviar notificación de prueba:', error);
      Alert.alert('Error', error.message || 'No se pudo enviar la notificación de prueba');
    }
  };

  const formatDate = (date: Date | string): string => {
    return new Intl.DateTimeFormat('es-CO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(new Date(date));
  };

  const getDaysUntil = (dueDate: Date | string): number => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const due = new Date(dueDate);
    due.setHours(0, 0, 0, 0);
    return Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  };

  const formatDateTime = (date: Date): string => {
    const now = new Date();
    const notificationDate = new Date(date);
    const diffMs = notificationDate.getTime() - now.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    if (diffDays > 0) {
      return `en ${diffDays} día${diffDays > 1 ? 's' : ''}`;
    } else if (diffHours > 0) {
      return `en ${diffHours} hora${diffHours > 1 ? 's' : ''}`;
    } else if (diffMinutes > 0) {
      return `en ${diffMinutes} minuto${diffMinutes > 1 ? 's' : ''}`;
    } else {
      return 'muy pronto';
    }
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50 items-center justify-center" edges={['top']}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text className="text-gray-600 mt-4">Cargando datos...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
      <ScrollView
        className="flex-1"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={{ paddingBottom: 20 }}
      >
        {/* Header */}
        <View className="bg-white px-6 py-4 border-b border-gray-200">
          <View className="flex-row justify-between items-center">
            <View className="flex-1">
              <Text className="text-2xl font-bold text-gray-900">
                Dashboard
              </Text>
              <Text className="text-gray-600 mt-1">
                {user?.name ? `Hola, ${user.name}` : 'Resumen de tus recordatorios fiscales'}
              </Text>
            </View>
            <TouchableOpacity
              onPress={signOut}
              className="ml-4"
            >
              <Text className="text-blue-600 font-medium">Salir</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Estadísticas */}
        <View className="px-6 py-4">
          <View className="flex-row flex-wrap -mx-2">
            <View className="w-1/2 px-2 mb-4">
              <View className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
                <Text className="text-sm text-gray-600 mb-1">Total</Text>
                <Text className="text-2xl font-bold text-gray-900">
                  {stats.total}
                </Text>
              </View>
            </View>
            <View className="w-1/2 px-2 mb-4">
              <View className="bg-yellow-50 rounded-xl p-4 border border-yellow-200">
                <Text className="text-sm text-yellow-700 mb-1">Pendientes</Text>
                <Text className="text-2xl font-bold text-yellow-900">
                  {stats.pending}
                </Text>
              </View>
            </View>
            <View className="w-1/2 px-2 mb-4">
              <View className="bg-red-50 rounded-xl p-4 border border-red-200">
                <Text className="text-sm text-red-700 mb-1">Vencidos</Text>
                <Text className="text-2xl font-bold text-red-900">
                  {stats.overdue}
                </Text>
              </View>
            </View>
            <View className="w-1/2 px-2 mb-4">
              <View className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                <Text className="text-sm text-blue-700 mb-1">Próximos 30 días</Text>
                <Text className="text-2xl font-bold text-blue-900">
                  {stats.upcoming}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Próximos Recordatorios */}
        <View className="px-6 py-4">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-xl font-bold text-gray-900">
              Próximos Recordatorios
            </Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('Reminders')}
            >
              <Text className="text-blue-600 font-medium">Ver todos</Text>
            </TouchableOpacity>
          </View>

          {upcomingReminders.length === 0 ? (
            <View className="bg-white rounded-xl p-6 border border-gray-200">
              <Text className="text-gray-600 text-center">
                No hay recordatorios próximos
              </Text>
            </View>
          ) : (
            <View>
              {upcomingReminders.map((reminder, index) => {
                const daysUntil = getDaysUntil(reminder.dueDate);
                return (
                  <TouchableOpacity
                    key={reminder.id}
                    className={`bg-white rounded-xl p-4 border border-gray-200 shadow-sm ${index > 0 ? 'mt-3' : ''}`}
                    onPress={() => navigation.navigate('Reminders')}
                  >
                    <View className="flex-row justify-between items-start mb-2">
                      <View className="flex-1">
                        <Text className="text-sm font-semibold text-gray-900">
                          {reminder.description}
                        </Text>
                        <Text className="text-xs text-gray-600 mt-1">
                          {reminder.companyName}
                        </Text>
                      </View>
                      <View className="bg-blue-100 px-2 py-1 rounded">
                        <Text className="text-xs font-medium text-blue-800">
                          {reminder.type}
                        </Text>
                      </View>
                    </View>
                    <View className="flex-row justify-between items-center mt-2 pt-2 border-t border-gray-100">
                      <Text className="text-xs text-gray-600">
                        {formatDate(reminder.dueDate)}
                      </Text>
                      <Text className="text-xs font-semibold text-blue-600">
                        {daysUntil} días restantes
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>

        {/* Estado de Notificaciones */}
        <View className="px-6 py-4">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-xl font-bold text-gray-900">Notificaciones</Text>
          </View>

          <View className="bg-white rounded-xl p-4 border border-gray-200">
            {notificationStatus ? (
              <>
                <View className="flex-row items-center mb-3">
                  <View className={`w-3 h-3 rounded-full mr-2 ${
                    notificationStatus.hasPermission ? 'bg-green-500' : 'bg-red-500'
                  }`} />
                  <Text className="text-gray-700 flex-1">
                    {notificationStatus.hasPermission 
                      ? 'Permisos concedidos ✓' 
                      : 'Permisos no concedidos ✗'}
                  </Text>
                </View>
                
                <View className="mb-3">
                  <Text className="text-sm text-gray-600 mb-1">
                    Notificaciones programadas:
                  </Text>
                  <Text className="text-lg font-bold text-gray-900">
                    {notificationStatus.scheduledCount}
                  </Text>
                </View>

                {notificationStatus.nextNotification?.exists && notificationStatus.nextNotification.date && (
                  <View className="mb-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <Text className="text-xs text-blue-700 mb-1 font-medium">
                      Próxima notificación:
                    </Text>
                    <Text className="text-sm font-semibold text-blue-900 mb-1">
                      {notificationStatus.nextNotification.title}
                    </Text>
                    <Text className="text-xs text-blue-700">
                      {formatDate(notificationStatus.nextNotification.date)} a las 9:00 AM
                    </Text>
                    <Text className="text-xs text-blue-600 mt-1">
                      {formatDateTime(notificationStatus.nextNotification.date)}
                    </Text>
                  </View>
                )}

                {notificationStatus.scheduledCount === 0 && (
                  <View className="mb-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                    <Text className="text-xs text-yellow-700 text-center">
                      No hay notificaciones programadas. Agrega empresas o verifica que tengas recordatorios pendientes.
                    </Text>
                  </View>
                )}

                <TouchableOpacity
                  onPress={handleTestNotification}
                  className="bg-blue-600 py-3 rounded-lg mt-2"
                >
                  <Text className="text-white text-center font-semibold">
                    🔔 Probar Notificación
                  </Text>
                </TouchableOpacity>

                {!notificationStatus.hasPermission && (
                  <Text className="text-xs text-gray-500 mt-2 text-center">
                    Activa los permisos para recibir recordatorios automáticos
                  </Text>
                )}
              </>
            ) : (
              <Text className="text-gray-600 text-center">
                Cargando estado de notificaciones...
              </Text>
            )}
          </View>
        </View>

        {/* Empresas */}
        <View className="px-6 py-4">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-xl font-bold text-gray-900">Empresas</Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('Companies')}
            >
              <Text className="text-blue-600 font-medium">Gestionar</Text>
            </TouchableOpacity>
          </View>

          <View className="bg-white rounded-xl p-4 border border-gray-200">
            <Text className="text-gray-600 mb-2">
              Tienes {companiesCount} empresa{companiesCount !== 1 ? 's' : ''} registrada{companiesCount !== 1 ? 's' : ''}
            </Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('Companies')}
              className="bg-blue-600 py-3 rounded-lg mt-2"
            >
              <Text className="text-white text-center font-semibold">
                Ver Empresas
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

