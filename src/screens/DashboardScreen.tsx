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
  const [showTestNotificationModal, setShowTestNotificationModal] =
    useState(false);
  const [testNotificationMessage, setTestNotificationMessage] = useState({
    title: '',
    message: '',
  });

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
            `3. Que el servidor esté funcionando`,
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
        const nextNotification =
          await notificationsService.getNextNotification();
        setNotificationStatus({
          hasPermission: status.hasPermission,
          scheduledCount: status.scheduledCount,
          nextNotification: nextNotification.exists
            ? {
                exists: true,
                title: nextNotification.title,
                body: nextNotification.body,
                date: nextNotification.date,
              }
            : { exists: false },
        });
      } catch (notifError) {
        console.error(
          '[Dashboard] Error programando notificaciones:',
          notifError,
        );
        // No interrumpir el flujo si falla la programación de notificaciones
      }
    } catch (error: any) {
      console.error('Error al cargar datos del dashboard:', error);

      let errorMessage = error.message || 'No se pudieron cargar los datos.';

      // Mensaje más específico para errores de autenticación
      if (
        error.message?.includes('No autorizado') ||
        error.message?.includes('401')
      ) {
        errorMessage =
          'Las APIs requieren autenticación. Por favor, implementa autenticación móvil.';
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
        console.log(
          '[Dashboard] Notificaciones inicializadas para',
          allReminders.length,
          'recordatorios',
        );

        // Obtener estado de notificaciones
        const status = await notificationsService.getNotificationStatus();
        const nextNotification =
          await notificationsService.getNextNotification();
        setNotificationStatus({
          hasPermission: status.hasPermission,
          scheduledCount: status.scheduledCount,
          nextNotification: nextNotification.exists
            ? {
                exists: true,
                title: nextNotification.title,
                body: nextNotification.body,
                date: nextNotification.date,
              }
            : { exists: false },
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
        nextNotification: nextNotification.exists
          ? {
              exists: true,
              title: nextNotification.title,
              body: nextNotification.body,
              date: nextNotification.date,
            }
          : { exists: false },
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
            message:
              'Necesitas conceder permisos de notificación para recibir recordatorios. Puedes activarlos desde la configuración de la app.',
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
        nextNotification: nextNotification.exists
          ? {
              exists: true,
              title: nextNotification.title,
              body: nextNotification.body,
              date: nextNotification.date,
            }
          : { exists: false },
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
    const diffHours = Math.floor(
      (diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60),
    );
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
      <SafeAreaView
        className={`flex-1 items-center justify-center ${
          isDark ? 'bg-gray-900' : 'bg-gray-50'
        }`}
        edges={['top']}
      >
        <ActivityIndicator size="large" color="#2563eb" />
        <Text className={isDark ? 'text-gray-300 mt-4' : 'text-gray-600 mt-4'}>
          Cargando datos...
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      className={`flex-1 ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}
      edges={['top']}
    >
      <ScrollView
        className="flex-1"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={{ paddingBottom: 20 }}
      >
        {/* Header */}
        <View
          className={`px-6 py-4 border-b ${
            isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
          }`}
        >
          <View className="flex-row justify-between items-center mb-2">
            <View className="flex-1">
              <Text
                className={`text-3xl font-bold ${
                  isDark ? 'text-white' : 'text-gray-900'
                }`}
              >
                Menú Principal
              </Text>
              <Text
                className={`mt-2 text-base ${
                  isDark ? 'text-gray-300' : 'text-gray-600'
                }`}
              >
                {user?.name
                  ? `Hola, ${user.name} 👋`
                  : 'Resumen de tus recordatorios fiscales'}
              </Text>
            </View>
            <AnimatedButton onPress={handleSignOut}>
              <View
                className={`ml-4 px-4 py-2.5 rounded-xl ${
                  isDark ? 'bg-gray-700' : 'bg-gray-100'
                }`}
              >
                <Text
                  className={`font-semibold text-sm ${
                    isDark ? 'text-gray-200' : 'text-gray-700'
                  }`}
                >
                  Salir
                </Text>
              </View>
            </AnimatedButton>
          </View>
        </View>

        {/* Estadísticas */}
        <View className="px-6 py-4">
          <View
            className={`rounded-3xl p-6 border ${
              isDark
                ? 'bg-gray-800 border-gray-700'
                : 'bg-white border-gray-200'
            }`}
          >
            <View className="flex-row items-center justify-between mb-5">
              <View className="flex-row items-center">
                <Text className="text-2xl mr-2">📊</Text>
                <Text
                  className={`text-xl font-bold ${
                    isDark ? 'text-white' : 'text-gray-900'
                  }`}
                >
                  Resumen General
                </Text>
              </View>
              <View
                className={`px-3 py-1 rounded-full ${
                  stats.pending > 0 || stats.overdue > 0
                    ? isDark
                      ? 'bg-orange-500/20'
                      : 'bg-orange-100'
                    : isDark
                    ? 'bg-green-500/20'
                    : 'bg-green-100'
                }`}
              >
                <Text
                  className={`text-xs font-semibold ${
                    stats.pending > 0 || stats.overdue > 0
                      ? isDark
                        ? 'text-orange-300'
                        : 'text-orange-700'
                      : isDark
                      ? 'text-green-300'
                      : 'text-green-700'
                  }`}
                >
                  {stats.pending > 0 || stats.overdue > 0
                    ? 'Acción requerida'
                    : 'Todo en orden'}
                </Text>
              </View>
            </View>

            <View className="flex-row flex-wrap -mx-2 mt-2">
              {[
                {
                  label: 'Total',
                  value: stats.total,
                  icon: '📋',
                  bg: isDark ? 'bg-blue-500/10' : 'bg-blue-50',
                  text: isDark ? 'text-blue-200' : 'text-blue-700',
                  border: isDark ? 'border-blue-500/20' : 'border-blue-200',
                },
                {
                  label: 'Pendientes',
                  value: stats.pending,
                  icon: '⏳',
                  bg: isDark ? 'bg-yellow-500/10' : 'bg-yellow-50',
                  text: isDark ? 'text-yellow-200' : 'text-yellow-700',
                  border: isDark ? 'border-yellow-500/20' : 'border-yellow-200',
                },
                {
                  label: 'Vencidos',
                  value: stats.overdue,
                  icon: '⚠️',
                  bg: isDark ? 'bg-red-500/10' : 'bg-red-50',
                  text: isDark ? 'text-red-200' : 'text-red-700',
                  border: isDark ? 'border-red-500/20' : 'border-red-200',
                },
                {
                  label: 'Próximos 30 días',
                  value: stats.upcoming,
                  icon: '📅',
                  bg: isDark ? 'bg-indigo-500/10' : 'bg-indigo-50',
                  text: isDark ? 'text-indigo-200' : 'text-indigo-700',
                  border: isDark ? 'border-indigo-500/20' : 'border-indigo-200',
                },
              ].map(item => (
                <View key={item.label} className="w-1/2 px-2 mb-3">
                  <View
                    className={`rounded-2xl p-4 border ${item.bg} ${item.border}`}
                  >
                    <View className="flex-row items-center justify-between mb-2">
                      <Text className="text-lg">{item.icon}</Text>
                      <Text
                        className={`text-xs font-medium ${
                          isDark ? 'text-gray-300' : 'text-gray-500'
                        }`}
                      >
                        {item.label}
                      </Text>
                    </View>
                    <Text className={`text-3xl font-bold ${item.text}`}>
                      {item.value}
                    </Text>
                  </View>
                </View>
              ))}
            </View>

            <View
              className={`mt-4 rounded-2xl px-4 py-3 border ${
                isDark
                  ? 'border-blue-900/40 bg-blue-900/10'
                  : 'border-blue-100 bg-blue-50'
              }`}
            >
              <Text
                className={`text-sm font-semibold mb-1 ${
                  isDark ? 'text-blue-100' : 'text-blue-700'
                }`}
              >
                💡 Estado Actual
              </Text>
              <Text
                className={`text-sm ${
                  isDark ? 'text-gray-300' : 'text-gray-600'
                }`}
              >
                {stats.pending > 0
                  ? `Tienes ${stats.pending} recordatorio${
                      stats.pending === 1 ? '' : 's'
                    } pendiente${stats.pending === 1 ? '' : 's'} listo${
                      stats.pending === 1 ? '' : 's'
                    } para gestionar.`
                  : stats.overdue > 0
                  ? `⚠️ Tienes ${stats.overdue} recordatorio${
                      stats.overdue === 1 ? '' : 's'
                    } vencido${stats.overdue === 1 ? '' : 's'}. Revisa tus recordatorios.`
                  : 'No hay recordatorios pendientes. ¡Perfecto momento para agregar nuevas empresas!'}
              </Text>
            </View>
          </View>
        </View>

        {/* Próximos Recordatorios */}
        <View className="px-6 py-4">
          <View
            className={`rounded-3xl p-6 border ${
              isDark
                ? 'bg-gray-800 border-gray-700'
                : 'bg-white border-gray-200'
            }`}
          >
            <View className="flex-row justify-between items-center mb-5">
              <View className="flex-row items-center">
                <Text className="text-2xl mr-2">📅</Text>
                <Text
                  className={`text-xl font-bold ${
                    isDark ? 'text-white' : 'text-gray-900'
                  }`}
                >
                  Próximos Recordatorios
                </Text>
              </View>
              <AnimatedButton onPress={() => navigation.navigate('Reminders')}>
                <View
                  className={`px-3 py-1.5 rounded-lg ${
                    isDark ? 'bg-blue-500/20' : 'bg-blue-50'
                  }`}
                >
                  <Text
                    className={`text-sm font-semibold ${
                      isDark ? 'text-blue-300' : 'text-blue-700'
                    }`}
                  >
                    Ver todos →
                  </Text>
                </View>
              </AnimatedButton>
            </View>

            {upcomingReminders.length === 0 ? (
              <View
                className={`rounded-2xl p-8 border items-center ${
                  isDark
                    ? 'bg-gray-800/50 border-gray-700'
                    : 'bg-gray-50 border-gray-200'
                }`}
              >
                <Text className="text-5xl mb-4">📋</Text>
                <Text
                  className={`text-base font-semibold text-center mb-2 ${
                    isDark ? 'text-white' : 'text-gray-900'
                  }`}
                >
                  No hay recordatorios próximos
                </Text>
                <Text
                  className={`text-center text-sm ${
                    isDark ? 'text-gray-400' : 'text-gray-500'
                  }`}
                >
                  Agrega empresas para generar recordatorios automáticos.
                </Text>
                <AnimatedButton
                  onPress={() => navigation.navigate('Companies')}
                >
                  <View
                    className={`px-4 py-2 rounded-lg mt-4 ${
                      isDark ? 'bg-blue-500/20' : 'bg-blue-50'
                    }`}
                  >
                    <Text
                      className={`text-sm font-semibold ${
                        isDark ? 'text-blue-300' : 'text-blue-700'
                      }`}
                    >
                      Agregar Empresa
                    </Text>
                  </View>
                </AnimatedButton>
              </View>
            ) : (
              <View>
                {upcomingReminders.map((reminder, index) => {
                  const daysUntil = getDaysUntil(reminder.dueDate);
                  const isUrgent = daysUntil <= 7;
                  return (
                    <AnimatedButton
                      key={reminder.id}
                      onPress={() => navigation.navigate('Reminders')}
                    >
                      <View
                        className={`rounded-2xl p-4 border mb-3 ${
                          isDark
                            ? isUrgent
                              ? 'bg-orange-500/10 border-orange-500/30'
                              : 'bg-gray-800/80 border-gray-700'
                            : isUrgent
                            ? 'bg-orange-50 border-orange-200'
                            : 'bg-white border-gray-200'
                        }`}
                      >
                        <View className="flex-row justify-between items-start mb-2">
                          <View className="flex-1 pr-3">
                            <View className="flex-row items-center mb-1">
                              <Text className="text-base mr-2">
                                {isUrgent ? '⚠️' : '📅'}
                              </Text>
                              <Text
                                className={`text-base font-semibold flex-1 ${
                                  isDark ? 'text-white' : 'text-gray-900'
                                }`}
                              >
                                {reminder.description}
                              </Text>
                            </View>
                            <Text
                              className={`text-sm mt-1 ${
                                isDark ? 'text-gray-400' : 'text-gray-600'
                              }`}
                            >
                              🏢 {reminder.companyName}
                            </Text>
                          </View>
                          <View
                            className={`px-2.5 py-1 rounded-full ${
                              isDark ? 'bg-blue-900/50' : 'bg-blue-100'
                            }`}
                          >
                            <Text
                              className={`text-xs font-semibold ${
                                isDark ? 'text-blue-200' : 'text-blue-800'
                              }`}
                            >
                              {reminder.type}
                            </Text>
                          </View>
                        </View>
                        <View
                          className={`flex-row justify-between items-center mt-3 pt-3 border-t ${
                            isDark ? 'border-gray-700' : 'border-gray-200'
                          }`}
                        >
                          <Text
                            className={`text-xs ${
                              isDark ? 'text-gray-400' : 'text-gray-500'
                            }`}
                          >
                            📆 {formatDate(reminder.dueDate)}
                          </Text>
                          <Text
                            className={`text-sm font-semibold ${
                              isUrgent
                                ? 'text-orange-600'
                                : isDark
                                ? 'text-blue-400'
                                : 'text-blue-600'
                            }`}
                          >
                            {daysUntil > 0
                              ? `${daysUntil} día${daysUntil === 1 ? '' : 's'} restante${daysUntil === 1 ? '' : 's'}`
                              : 'Vence hoy'}
                          </Text>
                        </View>
                      </View>
                    </AnimatedButton>
                  );
                })}
              </View>
            )}
          </View>
        </View>

        {/* Estado de Notificaciones */}
        <View className="px-6 py-4">
          <View
            className={`rounded-3xl p-6 border ${
              isDark
                ? 'bg-gray-800 border-gray-700'
                : 'bg-white border-gray-200'
            }`}
          >
            <View className="flex-row items-center mb-5">
              <Text className="text-2xl mr-2">🔔</Text>
              <Text
                className={`text-xl font-bold ${
                  isDark ? 'text-white' : 'text-gray-900'
                }`}
              >
                Notificaciones
              </Text>
            </View>
            {notificationStatus ? (
              <>
                <View className="flex-row items-center mb-3">
                  <View
                    className={`w-3 h-3 rounded-full mr-2 ${
                      notificationStatus.hasPermission
                        ? 'bg-green-500'
                        : 'bg-red-500'
                    }`}
                  />
                  <Text
                    className={`flex-1 ${
                      isDark ? 'text-gray-200' : 'text-gray-700'
                    }`}
                  >
                    {notificationStatus.hasPermission
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
                    {notificationStatus.scheduledCount}
                  </Text>
                </View>

                {notificationStatus.nextNotification?.exists &&
                  notificationStatus.nextNotification.date && (
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
                        {notificationStatus.nextNotification.title}
                      </Text>
                      <Text
                        className={`text-xs ${
                          isDark ? 'text-blue-300' : 'text-blue-700'
                        }`}
                      >
                        {formatDate(notificationStatus.nextNotification.date)} a
                        las 9:00 AM
                      </Text>
                      <Text
                        className={`text-xs mt-1 ${
                          isDark ? 'text-blue-400' : 'text-blue-600'
                        }`}
                      >
                        {formatDateTime(
                          notificationStatus.nextNotification.date,
                        )}
                      </Text>
                    </View>
                  )}

                {notificationStatus.scheduledCount === 0 && (
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

                <AnimatedButton onPress={handleTestNotification}>
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

                {!notificationStatus.hasPermission && (
                  <Text
                    className={`text-xs mt-2 text-center ${
                      isDark ? 'text-gray-400' : 'text-gray-500'
                    }`}
                  >
                    Activa los permisos para recibir recordatorios automáticos
                  </Text>
                )}
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

        {/* Empresas */}
        <View className="px-6 py-4">
          <View
            className={`rounded-3xl p-6 border ${
              isDark
                ? 'bg-gray-800 border-gray-700'
                : 'bg-white border-gray-200'
            }`}
          >
            <View className="flex-row justify-between items-center mb-5">
              <View className="flex-row items-center">
                <Text className="text-2xl mr-2">🏢</Text>
                <Text
                  className={`text-xl font-bold ${
                    isDark ? 'text-white' : 'text-gray-900'
                  }`}
                >
                  Empresas
                </Text>
              </View>
              <AnimatedButton onPress={() => navigation.navigate('Companies')}>
                <View
                  className={`px-3 py-1.5 rounded-lg ${
                    isDark ? 'bg-blue-500/20' : 'bg-blue-50'
                  }`}
                >
                  <Text
                    className={`text-sm font-semibold ${
                      isDark ? 'text-blue-300' : 'text-blue-700'
                    }`}
                  >
                    Gestionar →
                  </Text>
                </View>
              </AnimatedButton>
            </View>

            <View
              className={`rounded-2xl p-5 border ${
                isDark
                  ? 'bg-gray-800/50 border-gray-700'
                  : 'bg-gray-50 border-gray-200'
              }`}
            >
              <View className="flex-row items-center justify-between mb-4">
                <View className="flex-row items-center">
                  <Text className="text-xl mr-2">📊</Text>
                  <Text
                    className={`text-lg font-bold ${
                      isDark ? 'text-white' : 'text-gray-900'
                    }`}
                  >
                    Resumen
                  </Text>
                </View>
                <View
                  className={`px-3 py-1.5 rounded-full ${
                    isDark ? 'bg-blue-500/20' : 'bg-blue-100'
                  }`}
                >
                  <Text
                    className={`text-sm font-bold ${
                      isDark ? 'text-blue-300' : 'text-blue-700'
                    }`}
                  >
                    {companiesCount}
                  </Text>
                </View>
              </View>
              <Text
                className={`mb-4 text-sm ${
                  isDark ? 'text-gray-300' : 'text-gray-600'
                }`}
              >
                Tienes {companiesCount} empresa{companiesCount !== 1 ? 's' : ''}{' '}
                registrada{companiesCount !== 1 ? 's' : ''} en tu cuenta.
                {companiesCount === 0 &&
                  ' Agrega tu primera empresa para comenzar a recibir recordatorios automáticos.'}
              </Text>
              <AnimatedButton onPress={() => navigation.navigate('Companies')}>
                <View
                  className={`py-3 rounded-xl ${
                    isDark ? 'bg-blue-600' : 'bg-blue-600'
                  }`}
                >
                  <Text className="text-white text-center font-semibold">
                    {companiesCount === 0
                      ? '➕ Agregar Primera Empresa'
                      : 'Ver Todas las Empresas'}
                  </Text>
                </View>
              </AnimatedButton>
            </View>
          </View>
        </View>
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
