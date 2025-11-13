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
import { useTheme } from '../context/ThemeContext';
import AnimatedView from '../components/AnimatedView';
import AnimatedButton from '../components/AnimatedButton';
import StyledModal from '../components/StyledModal';

export default function DashboardScreen({ navigation }: any) {
  const { user, signOut } = useAuth();
  const { isDark } = useTheme();
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
  const [showSignOutModal, setShowSignOutModal] = useState(false);
  const [showTestNotificationModal, setShowTestNotificationModal] = useState(false);
  const [testNotificationMessage, setTestNotificationMessage] = useState({ title: '', message: '' });

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
          setTestNotificationMessage({
            title: 'Permisos requeridos',
            message: 'Necesitas conceder permisos de notificación para recibir recordatorios. Puedes activarlos desde la configuración de la app.',
          });
          setShowTestNotificationModal(true);
          return;
        }
      }
      
      await notificationsService.displayTestNotification();
      setTestNotificationMessage({
        title: 'Éxito',
        message: 'Se envió una notificación de prueba. Deberías verla ahora.',
      });
      setShowTestNotificationModal(true);
      
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
      setTestNotificationMessage({
        title: 'Error',
        message: error.message || 'No se pudo enviar la notificación de prueba',
      });
      setShowTestNotificationModal(true);
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

  const handleSignOut = () => {
    setShowSignOutModal(true);
  };

  const confirmSignOut = async () => {
    await signOut();
    setShowSignOutModal(false);
  };

  if (loading) {
    return (
      <SafeAreaView className={`flex-1 items-center justify-center ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`} edges={['top']}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text className={isDark ? 'text-gray-300 mt-4' : 'text-gray-600 mt-4'}>Cargando datos...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className={`flex-1 ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`} edges={['top']}>
      <ScrollView
        className="flex-1"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={{ paddingBottom: 20 }}
      >
        {/* Header */}
        <AnimatedView animationType="slideDown" delay={0} duration={500}>
          <View className={`px-6 py-4 border-b ${
            isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
          }`}>
            <View className="flex-row justify-between items-center">
              <View className="flex-1">
                <Text className={`text-2xl font-bold ${
                  isDark ? 'text-white' : 'text-gray-900'
                }`}>
                  Dashboard
                </Text>
                <Text className={`mt-1 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                  {user?.name ? `Hola, ${user.name}` : 'Resumen de tus recordatorios fiscales'}
                </Text>
              </View>
              <AnimatedButton onPress={handleSignOut}>
                <View className="ml-4">
                  <Text className="text-blue-600 font-medium">Salir</Text>
                </View>
              </AnimatedButton>
            </View>
          </View>
        </AnimatedView>

        {/* Estadísticas */}
        <View className="px-6 py-4">
          <View className="flex-row flex-wrap -mx-2">
            <AnimatedView animationType="scale" delay={100} duration={500} style={{ width: '50%', paddingHorizontal: 8, marginBottom: 16 }}>
              <View className={`rounded-xl p-4 shadow-sm border ${
                isDark 
                  ? 'bg-gray-800 border-gray-700' 
                  : 'bg-white border-gray-200'
              }`}>
                <Text className={`text-sm mb-1 ${
                  isDark ? 'text-gray-400' : 'text-gray-600'
                }`}>Total</Text>
                <Text className={`text-2xl font-bold ${
                  isDark ? 'text-white' : 'text-gray-900'
                }`}>
                  {stats.total}
                </Text>
              </View>
            </AnimatedView>
            <AnimatedView animationType="scale" delay={200} duration={500} style={{ width: '50%', paddingHorizontal: 8, marginBottom: 16 }}>
              <View className={`rounded-xl p-4 border ${
                isDark 
                  ? 'bg-yellow-900/30 border-yellow-800' 
                  : 'bg-yellow-50 border-yellow-200'
              }`}>
                <Text className={`text-sm mb-1 ${
                  isDark ? 'text-yellow-300' : 'text-yellow-700'
                }`}>Pendientes</Text>
                <Text className={`text-2xl font-bold ${
                  isDark ? 'text-yellow-200' : 'text-yellow-900'
                }`}>
                  {stats.pending}
                </Text>
              </View>
            </AnimatedView>
            <AnimatedView animationType="scale" delay={300} duration={500} style={{ width: '50%', paddingHorizontal: 8, marginBottom: 16 }}>
              <View className={`rounded-xl p-4 border ${
                isDark 
                  ? 'bg-red-900/30 border-red-800' 
                  : 'bg-red-50 border-red-200'
              }`}>
                <Text className={`text-sm mb-1 ${
                  isDark ? 'text-red-300' : 'text-red-700'
                }`}>Vencidos</Text>
                <Text className={`text-2xl font-bold ${
                  isDark ? 'text-red-200' : 'text-red-900'
                }`}>
                  {stats.overdue}
                </Text>
              </View>
            </AnimatedView>
            <AnimatedView animationType="scale" delay={400} duration={500} style={{ width: '50%', paddingHorizontal: 8, marginBottom: 16 }}>
              <View className={`rounded-xl p-4 border ${
                isDark 
                  ? 'bg-blue-900/30 border-blue-800' 
                  : 'bg-blue-50 border-blue-200'
              }`}>
                <Text className={`text-sm mb-1 ${
                  isDark ? 'text-blue-300' : 'text-blue-700'
                }`}>Próximos 30 días</Text>
                <Text className={`text-2xl font-bold ${
                  isDark ? 'text-blue-200' : 'text-blue-900'
                }`}>
                  {stats.upcoming}
                </Text>
              </View>
            </AnimatedView>
          </View>
        </View>

        {/* Próximos Recordatorios */}
        <AnimatedView animationType="fadeIn" delay={500} duration={500}>
          <View className="px-6 py-4">
            <View className="flex-row justify-between items-center mb-4">
              <Text className={`text-xl font-bold ${
                isDark ? 'text-white' : 'text-gray-900'
              }`}>
                Próximos Recordatorios
              </Text>
              <AnimatedButton onPress={() => navigation.navigate('Reminders')}>
                <View>
                  <Text className="text-blue-600 font-medium">Ver todos</Text>
                </View>
              </AnimatedButton>
            </View>

            {upcomingReminders.length === 0 ? (
              <View className={`rounded-xl p-6 border ${
                isDark 
                  ? 'bg-gray-800 border-gray-700' 
                  : 'bg-white border-gray-200'
              }`}>
                <Text className={`text-center ${
                  isDark ? 'text-gray-300' : 'text-gray-600'
                }`}>
                  No hay recordatorios próximos
                </Text>
              </View>
            ) : (
              <View>
                {upcomingReminders.map((reminder, index) => {
                  const daysUntil = getDaysUntil(reminder.dueDate);
                  return (
                    <AnimatedView
                      key={reminder.id}
                      animationType="slideRight"
                      delay={600 + index * 100}
                      duration={400}
                      style={{ marginTop: index > 0 ? 12 : 0 }}
                    >
                      <AnimatedButton onPress={() => navigation.navigate('Reminders')}>
                        <View className={`rounded-xl p-4 border shadow-sm ${
                          isDark 
                            ? 'bg-gray-800 border-gray-700' 
                            : 'bg-white border-gray-200'
                        }`}>
                          <View className="flex-row justify-between items-start mb-2">
                            <View className="flex-1">
                              <Text className={`text-sm font-semibold ${
                                isDark ? 'text-white' : 'text-gray-900'
                              }`}>
                                {reminder.description}
                              </Text>
                              <Text className={`text-xs mt-1 ${
                                isDark ? 'text-gray-400' : 'text-gray-600'
                              }`}>
                                {reminder.companyName}
                              </Text>
                            </View>
                            <View className={`px-2 py-1 rounded ${
                              isDark ? 'bg-blue-900/50' : 'bg-blue-100'
                            }`}>
                              <Text className={`text-xs font-medium ${
                                isDark ? 'text-blue-300' : 'text-blue-800'
                              }`}>
                                {reminder.type}
                              </Text>
                            </View>
                          </View>
                          <View className={`flex-row justify-between items-center mt-2 pt-2 border-t ${
                            isDark ? 'border-gray-700' : 'border-gray-100'
                          }`}>
                            <Text className={`text-xs ${
                              isDark ? 'text-gray-400' : 'text-gray-600'
                            }`}>
                              {formatDate(reminder.dueDate)}
                            </Text>
                            <Text className="text-xs font-semibold text-blue-600">
                              {daysUntil} días restantes
                            </Text>
                          </View>
                        </View>
                      </AnimatedButton>
                    </AnimatedView>
                  );
                })}
              </View>
            )}
          </View>
        </AnimatedView>

        {/* Estado de Notificaciones */}
        <AnimatedView animationType="fadeIn" delay={700} duration={500}>
          <View className="px-6 py-4">
            <View className="flex-row justify-between items-center mb-4">
              <Text className={`text-xl font-bold ${
                isDark ? 'text-white' : 'text-gray-900'
              }`}>Notificaciones</Text>
            </View>

            <View className={`rounded-xl p-4 border ${
              isDark 
                ? 'bg-gray-800 border-gray-700' 
                : 'bg-white border-gray-200'
            }`}>
            {notificationStatus ? (
              <>
                <View className="flex-row items-center mb-3">
                  <View className={`w-3 h-3 rounded-full mr-2 ${
                    notificationStatus.hasPermission ? 'bg-green-500' : 'bg-red-500'
                  }`} />
                  <Text className={`flex-1 ${
                    isDark ? 'text-gray-200' : 'text-gray-700'
                  }`}>
                    {notificationStatus.hasPermission 
                      ? 'Permisos concedidos ✓' 
                      : 'Permisos no concedidos ✗'}
                  </Text>
                </View>
                
                <View className="mb-3">
                  <Text className={`text-sm mb-1 ${
                    isDark ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    Notificaciones programadas:
                  </Text>
                  <Text className={`text-lg font-bold ${
                    isDark ? 'text-white' : 'text-gray-900'
                  }`}>
                    {notificationStatus.scheduledCount}
                  </Text>
                </View>

                {notificationStatus.nextNotification?.exists && notificationStatus.nextNotification.date && (
                  <View className={`mb-3 p-3 rounded-lg border ${
                    isDark 
                      ? 'bg-blue-900/30 border-blue-800' 
                      : 'bg-blue-50 border-blue-200'
                  }`}>
                    <Text className={`text-xs mb-1 font-medium ${
                      isDark ? 'text-blue-300' : 'text-blue-700'
                    }`}>
                      Próxima notificación:
                    </Text>
                    <Text className={`text-sm font-semibold mb-1 ${
                      isDark ? 'text-blue-200' : 'text-blue-900'
                    }`}>
                      {notificationStatus.nextNotification.title}
                    </Text>
                    <Text className={`text-xs ${
                      isDark ? 'text-blue-300' : 'text-blue-700'
                    }`}>
                      {formatDate(notificationStatus.nextNotification.date)} a las 9:00 AM
                    </Text>
                    <Text className={`text-xs mt-1 ${
                      isDark ? 'text-blue-400' : 'text-blue-600'
                    }`}>
                      {formatDateTime(notificationStatus.nextNotification.date)}
                    </Text>
                  </View>
                )}

                {notificationStatus.scheduledCount === 0 && (
                  <View className={`mb-3 p-3 rounded-lg border ${
                    isDark 
                      ? 'bg-yellow-900/30 border-yellow-800' 
                      : 'bg-yellow-50 border-yellow-200'
                  }`}>
                    <Text className={`text-xs text-center ${
                      isDark ? 'text-yellow-300' : 'text-yellow-700'
                    }`}>
                      No hay notificaciones programadas. Agrega empresas o verifica que tengas recordatorios pendientes.
                    </Text>
                  </View>
                )}

                <AnimatedButton onPress={handleTestNotification}>
                  <View className="bg-blue-600 py-3 rounded-lg mt-2">
                    <Text className="text-white text-center font-semibold">
                      🔔 Probar Notificación
                    </Text>
                  </View>
                </AnimatedButton>

                {!notificationStatus.hasPermission && (
                  <Text className={`text-xs mt-2 text-center ${
                    isDark ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                    Activa los permisos para recibir recordatorios automáticos
                  </Text>
                )}
              </>
            ) : (
              <Text className={`text-center ${
                isDark ? 'text-gray-300' : 'text-gray-600'
              }`}>
                Cargando estado de notificaciones...
              </Text>
            )}
            </View>
          </View>
        </AnimatedView>

        {/* Empresas */}
        <AnimatedView animationType="slideUp" delay={800} duration={500}>
          <View className="px-6 py-4">
            <View className="flex-row justify-between items-center mb-4">
              <Text className={`text-xl font-bold ${
                isDark ? 'text-white' : 'text-gray-900'
              }`}>Empresas</Text>
              <AnimatedButton onPress={() => navigation.navigate('Companies')}>
                <View>
                  <Text className="text-blue-600 font-medium">Gestionar</Text>
                </View>
              </AnimatedButton>
            </View>

            <View className={`rounded-xl p-4 border ${
              isDark 
                ? 'bg-gray-800 border-gray-700' 
                : 'bg-white border-gray-200'
            }`}>
              <Text className={`mb-2 ${
                isDark ? 'text-gray-300' : 'text-gray-600'
              }`}>
                Tienes {companiesCount} empresa{companiesCount !== 1 ? 's' : ''} registrada{companiesCount !== 1 ? 's' : ''}
              </Text>
              <AnimatedButton onPress={() => navigation.navigate('Companies')}>
                <View className="bg-blue-600 py-3 rounded-lg mt-2">
                  <Text className="text-white text-center font-semibold">
                    Ver Empresas
                  </Text>
                </View>
              </AnimatedButton>
            </View>
          </View>
        </AnimatedView>
      </ScrollView>

      {/* Modal de confirmación de cierre de sesión */}
      <StyledModal
        visible={showSignOutModal}
        onClose={() => setShowSignOutModal(false)}
        title="Cerrar sesión"
        message="¿Estás seguro de que deseas cerrar sesión?"
        buttons={[
          {
            text: 'Cancelar',
            style: 'cancel',
            onPress: () => setShowSignOutModal(false),
          },
          {
            text: 'Cerrar sesión',
            style: 'destructive',
            onPress: confirmSignOut,
          },
        ]}
      />

      {/* Modal de notificaciones de prueba */}
      <StyledModal
        visible={showTestNotificationModal}
        onClose={() => setShowTestNotificationModal(false)}
        title={testNotificationMessage.title}
        message={testNotificationMessage.message}
        buttons={[
          {
            text: 'Aceptar',
            onPress: () => setShowTestNotificationModal(false),
          },
        ]}
      />
    </SafeAreaView>
  );
}

