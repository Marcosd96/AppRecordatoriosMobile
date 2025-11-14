import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  TextInput,
  Alert,
  ActivityIndicator,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Reminder, ReminderFilter, SortBy, Company } from '../types';
import { remindersService } from '../services/remindersService';
import { companiesService } from '../services/companiesService';
import { notificationsService } from '../services/notificationsService';
import { useTheme } from '../context/ThemeContext';
import StyledModal from '../components/StyledModal';

// Habilitar animaciones de layout en Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function RemindersScreen({ route }: any) {
  const { isDark } = useTheme();
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
  const [filter, setFilter] = useState<ReminderFilter>('all');
  const [sortBy, setSortBy] = useState<SortBy>('date');
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState({ title: '', message: '' });
  const [showStatusFilter, setShowStatusFilter] = useState(false);
  const [showCompanyFilter, setShowCompanyFilter] = useState(false);

  // Función para animar los cambios de layout
  const animateLayout = () => {
    LayoutAnimation.configureNext(
      LayoutAnimation.create(
        250, // duración en ms
        LayoutAnimation.Types.easeInEaseOut,
        LayoutAnimation.Properties.opacity
      )
    );
  };

  const loadData = async () => {
    try {
      const [remindersData, companiesData] = await Promise.all([
        remindersService.getAll(),
        companiesService.getAll(),
      ]);
      setReminders(remindersData);
      setCompanies(companiesData);
      
      // Programar notificaciones para los recordatorios pendientes
      await notificationsService.scheduleAllReminders(remindersData);
    } catch (error: any) {
      console.error('Error al cargar datos:', error);
      setErrorMessage({
        title: 'Error',
        message: error.message || 'No se pudieron cargar los datos. Verifica tu conexión.',
      });
      setShowErrorModal(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    // Inicializar notificaciones al montar el componente
    const initializeNotifications = async () => {
      await notificationsService.createNotificationChannel();
      await notificationsService.requestPermissions();
    };
    
    initializeNotifications();
    loadData();
  }, []);

  // Actualizar selectedCompanyId cuando cambian los parámetros de ruta
  useEffect(() => {
    if (route?.params?.companyId) {
      setSelectedCompanyId(route.params.companyId);
    }
  }, [route?.params?.companyId]);

  // Limpiar el filtro cuando la pantalla pierde el foco (opcional)
  useFocusEffect(
    React.useCallback(() => {
      // Si hay params, establecer el filtro
      if (route?.params?.companyId) {
        setSelectedCompanyId(route.params.companyId);
      }
      // No limpiar automáticamente para mantener el filtro activo
    }, [route?.params?.companyId])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
  };

  // Memoizar los recordatorios filtrados para evitar recalcular en cada render
  const filteredReminders = useMemo(() => reminders
    .filter((r) => {
      // Filtrar por empresa
      if (selectedCompanyId && r.companyId !== selectedCompanyId) return false;

      // Filtrar por estado
      if (filter === 'pending' && r.status !== 'pending') return false;
      if (filter === 'overdue' && r.status !== 'overdue') return false;
      if (filter === 'upcoming') {
        const dueDate = new Date(r.dueDate);
        const now = new Date();
        const next30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
        if (r.status !== 'pending' || dueDate < now || dueDate > next30Days)
          return false;
      }

      // Filtrar por búsqueda
      if (
        searchQuery &&
        !r.description.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !r.companyName.toLowerCase().includes(searchQuery.toLowerCase())
      )
        return false;

      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'date') {
        return (
          new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
        );
      } else if (sortBy === 'company') {
        return a.companyName.localeCompare(b.companyName);
      } else {
        return a.type.localeCompare(b.type);
      }
    }), [reminders, selectedCompanyId, filter, sortBy, searchQuery]);

  const stats = {
    total: reminders.length,
    pending: reminders.filter((r) => r.status === 'pending').length,
    overdue: reminders.filter((r) => r.status === 'overdue').length,
    upcoming: reminders.filter((r) => {
      const dueDate = new Date(r.dueDate);
      const now = new Date();
      const next30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      return (
        r.status === 'pending' && dueDate >= now && dueDate <= next30Days
      );
    }).length,
  };

  const formatDate = (date: Date | string): string => {
    return new Intl.DateTimeFormat('es-CO', {
      year: 'numeric',
      month: 'long',
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

  // Memoizar la función para evitar recrearla en cada render
  const toggleReminderStatus = useCallback(async (id: string) => {
    const reminder = reminders.find((r) => r.id === id);
    if (!reminder) return;

    try {
      const result = await remindersService.toggleStatus(id, reminder.status);
      const updatedReminders = reminders.map((r) => (r.id === id ? result.reminder : r));
      setReminders(updatedReminders);
      
      // Si se completó el recordatorio, cancelar sus notificaciones
      if (result.reminder.status === 'completed') {
        await notificationsService.cancelReminderNotifications(id);
      } else {
        // Si se reactivó, reprogramar notificaciones
        await notificationsService.scheduleReminderNotification(result.reminder);
      }
    } catch (error: any) {
      console.error('Error al actualizar recordatorio:', error);
      setErrorMessage({
        title: 'Error',
        message: error.message || 'No se pudo actualizar el recordatorio',
      });
      setShowErrorModal(true);
    }
  }, [reminders]);

  const getStatusBadge = (status: Reminder['status']) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      overdue: 'bg-red-100 text-red-800 border-red-200',
      completed: 'bg-green-100 text-green-800 border-green-200',
    };
    const labels = {
      pending: 'Pendiente',
      overdue: 'Vencido',
      completed: 'Completado',
    };
    return { style: styles[status], label: labels[status] };
  };

  if (loading) {
    return (
      <SafeAreaView className={`flex-1 items-center justify-center ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`} edges={['top']}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text className={isDark ? 'text-gray-300 mt-4' : 'text-gray-600 mt-4'}>Cargando recordatorios...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className={`flex-1 ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`} edges={['top']}>
      {/* Header */}
      <View className={`px-6 py-4 border-b ${
        isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
      }`}>
        <Text className={`text-2xl font-bold ${
          isDark ? 'text-white' : 'text-gray-900'
        }`}>
          Recordatorios Fiscales
        </Text>
        <Text className={`mt-1 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
          Gestiona tus obligaciones fiscales
        </Text>
      </View>

      <ScrollView
        className="flex-1"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={{ paddingBottom: 20 }}
      >
        {/* Estadísticas */}
        <View className="px-6 py-4">
          <View className="flex-row flex-wrap -mx-2">
            <View className="w-1/2 px-2 mb-2">
              <View className={`rounded-lg p-3 border ${
                isDark 
                  ? 'bg-gray-800 border-gray-700' 
                  : 'bg-white border-gray-200'
              }`}>
                <Text className={`text-xs mb-1 ${
                  isDark ? 'text-gray-400' : 'text-gray-600'
                }`}>Total</Text>
                <Text className={`text-xl font-bold ${
                  isDark ? 'text-white' : 'text-gray-900'
                }`}>
                  {stats.total}
                </Text>
              </View>
            </View>
            <View className="w-1/2 px-2 mb-2">
              <View className={`rounded-lg p-3 border ${
                isDark 
                  ? 'bg-yellow-900/30 border-yellow-800' 
                  : 'bg-yellow-50 border-yellow-200'
              }`}>
                <Text className={`text-xs mb-1 ${
                  isDark ? 'text-yellow-300' : 'text-yellow-700'
                }`}>Pendientes</Text>
                <Text className={`text-xl font-bold ${
                  isDark ? 'text-yellow-200' : 'text-yellow-900'
                }`}>
                  {stats.pending}
                </Text>
              </View>
            </View>
            <View className="w-1/2 px-2 mb-2">
              <View className={`rounded-lg p-3 border ${
                isDark 
                  ? 'bg-red-900/30 border-red-800' 
                  : 'bg-red-50 border-red-200'
              }`}>
                <Text className={`text-xs mb-1 ${
                  isDark ? 'text-red-300' : 'text-red-700'
                }`}>Vencidos</Text>
                <Text className={`text-xl font-bold ${
                  isDark ? 'text-red-200' : 'text-red-900'
                }`}>
                  {stats.overdue}
                </Text>
              </View>
            </View>
            <View className="w-1/2 px-2 mb-2">
              <View className={`rounded-lg p-3 border ${
                isDark 
                  ? 'bg-blue-900/30 border-blue-800' 
                  : 'bg-blue-50 border-blue-200'
              }`}>
                <Text className={`text-xs mb-1 ${
                  isDark ? 'text-blue-300' : 'text-blue-700'
                }`}>Próximos</Text>
                <Text className={`text-xl font-bold ${
                  isDark ? 'text-blue-200' : 'text-blue-900'
                }`}>
                  {stats.upcoming}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Búsqueda */}
        <View className="px-6 py-2">
          <TextInput
            className={`border rounded-lg px-4 py-3 ${
              isDark 
                ? 'bg-gray-800 border-gray-700 text-white' 
                : 'bg-white border-gray-300 text-gray-900'
            }`}
            placeholder="Buscar recordatorios..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor={isDark ? "#9ca3af" : "#9ca3af"}
          />
        </View>

        {/* Filtros - Lista Desplegable */}
        <View className="px-6 py-2">
          <View className={`rounded-xl border overflow-hidden ${
            isDark 
              ? 'bg-gray-800 border-gray-700' 
              : 'bg-white border-gray-200'
          }`}>
            <TouchableOpacity
              onPress={() => {
                animateLayout();
                setShowStatusFilter(!showStatusFilter);
              }}
              className={`px-4 py-3 flex-row justify-between items-center ${
                isDark ? 'bg-gray-800' : 'bg-white'
              }`}
            >
              <View className="flex-row items-center">
                <Text className={`text-base font-semibold ${
                  isDark ? 'text-white' : 'text-gray-900'
                }`}>
                  📋 Filtrar por Estado
                </Text>
                {filter !== 'all' && (
                  <View className={`ml-2 px-2 py-1 rounded ${
                    isDark ? 'bg-blue-900/50' : 'bg-blue-100'
                  }`}>
                    <Text className={`text-xs font-medium ${
                      isDark ? 'text-blue-200' : 'text-blue-800'
                    }`}>
                      {filter === 'pending' ? 'Pendientes' : 
                       filter === 'overdue' ? 'Vencidos' : 'Próximos'}
                    </Text>
                  </View>
                )}
              </View>
              <Text className={`text-lg ${
                isDark ? 'text-gray-400' : 'text-gray-600'
              }`}>
                {showStatusFilter ? '▲' : '▼'}
              </Text>
            </TouchableOpacity>
            {showStatusFilter && (
              <View className={`border-t ${
                isDark ? 'border-gray-700' : 'border-gray-200'
              }`}>
                {(['all', 'pending', 'overdue', 'upcoming'] as ReminderFilter[]).map(
                  (f) => (
                    <TouchableOpacity
                      key={f}
                      onPress={() => {
                        animateLayout();
                        setFilter(f);
                        setShowStatusFilter(false);
                      }}
                      className={`px-4 py-3 border-b ${
                        filter === f
                          ? isDark
                            ? 'bg-blue-900/30'
                            : 'bg-blue-50'
                          : isDark
                            ? 'bg-gray-800 border-gray-700'
                            : 'bg-white border-gray-200'
                      }`}
                    >
                      <View className="flex-row items-center">
                        <Text className={`text-sm font-medium ${
                          filter === f
                            ? isDark
                              ? 'text-blue-200'
                              : 'text-blue-700'
                            : isDark
                              ? 'text-gray-200'
                              : 'text-gray-700'
                        }`}>
                          {f === 'all'
                            ? '✓ Todos'
                            : f === 'pending'
                            ? '⏳ Pendientes'
                            : f === 'overdue'
                            ? '⚠️ Vencidos'
                            : '📅 Próximos'}
                        </Text>
                        {filter === f && (
                          <Text className="ml-2 text-blue-600">✓</Text>
                        )}
                      </View>
                    </TouchableOpacity>
                  )
                )}
              </View>
            )}
          </View>
        </View>

        {/* Selector de empresa - Lista Desplegable */}
        <View className="px-6 py-2">
          <View className={`rounded-xl border overflow-hidden ${
            isDark 
              ? 'bg-gray-800 border-gray-700' 
              : 'bg-white border-gray-200'
          }`}>
            <TouchableOpacity
              onPress={() => {
                animateLayout();
                setShowCompanyFilter(!showCompanyFilter);
              }}
              className={`px-4 py-3 flex-row justify-between items-center ${
                isDark ? 'bg-gray-800' : 'bg-white'
              }`}
            >
              <View className="flex-row items-center">
                <Text className={`text-base font-semibold ${
                  isDark ? 'text-white' : 'text-gray-900'
                }`}>
                  🏢 Filtrar por Empresa
                </Text>
                {selectedCompanyId && (
                  <View className={`ml-2 px-2 py-1 rounded ${
                    isDark ? 'bg-blue-900/50' : 'bg-blue-100'
                  }`}>
                    <Text className={`text-xs font-medium ${
                      isDark ? 'text-blue-200' : 'text-blue-800'
                    }`}>
                      {companies.find(c => c.id === selectedCompanyId)?.name || ''}
                    </Text>
                  </View>
                )}
              </View>
              <Text className={`text-lg ${
                isDark ? 'text-gray-400' : 'text-gray-600'
              }`}>
                {showCompanyFilter ? '▲' : '▼'}
              </Text>
            </TouchableOpacity>
            {showCompanyFilter && (
              <View className={`border-t ${
                isDark ? 'border-gray-700' : 'border-gray-200'
              }`}>
                <TouchableOpacity
                  onPress={() => {
                    animateLayout();
                    setSelectedCompanyId(null);
                    setShowCompanyFilter(false);
                  }}
                  className={`px-4 py-3 border-b ${
                    selectedCompanyId === null
                      ? isDark
                        ? 'bg-blue-900/30'
                        : 'bg-blue-50'
                      : isDark
                        ? 'bg-gray-800 border-gray-700'
                        : 'bg-white border-gray-200'
                  }`}
                >
                  <View className="flex-row items-center">
                    <Text className={`text-sm font-medium ${
                      selectedCompanyId === null
                        ? isDark
                          ? 'text-blue-200'
                          : 'text-blue-700'
                        : isDark
                          ? 'text-gray-200'
                          : 'text-gray-700'
                    }`}>
                      ✓ Todas las empresas
                    </Text>
                    {selectedCompanyId === null && (
                      <Text className="ml-2 text-blue-600">✓</Text>
                    )}
                  </View>
                </TouchableOpacity>
                {companies.map((company) => (
                  <TouchableOpacity
                    key={company.id}
                    onPress={() => {
                      animateLayout();
                      setSelectedCompanyId(company.id);
                      setShowCompanyFilter(false);
                    }}
                    className={`px-4 py-3 border-b ${
                      selectedCompanyId === company.id
                        ? isDark
                          ? 'bg-blue-900/30'
                          : 'bg-blue-50'
                        : isDark
                          ? 'bg-gray-800 border-gray-700'
                          : 'bg-white border-gray-200'
                    }`}
                  >
                    <View className="flex-row items-center">
                      <Text className={`text-sm font-medium ${
                        selectedCompanyId === company.id
                          ? isDark
                            ? 'text-blue-200'
                            : 'text-blue-700'
                          : isDark
                            ? 'text-gray-200'
                            : 'text-gray-700'
                      }`}>
                        {company.name}
                      </Text>
                      {selectedCompanyId === company.id && (
                        <Text className="ml-2 text-blue-600">✓</Text>
                      )}
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        </View>

        {/* Lista de recordatorios */}
        <View className="px-6 py-4">
          {filteredReminders.length === 0 ? (
            <View className={`rounded-xl p-8 border ${
              isDark 
                ? 'bg-gray-800 border-gray-700' 
                : 'bg-white border-gray-200'
            }`}>
              <Text className={`text-center ${
                isDark ? 'text-gray-300' : 'text-gray-600'
              }`}>
                No hay recordatorios que coincidan con los filtros
              </Text>
            </View>
          ) : (
            <View>
              {filteredReminders.map((reminder, index) => {
                const daysUntil = getDaysUntil(reminder.dueDate);
                const isOverdue = daysUntil < 0;
                const isUrgent = daysUntil >= 0 && daysUntil <= 7;
                const statusBadge = getStatusBadge(reminder.status);

                return (
                  <View
                    key={reminder.id}
                    className={`rounded-xl p-4 border-2 ${index > 0 ? 'mt-3' : ''} ${
                      reminder.status === 'completed'
                        ? isDark
                          ? 'bg-gray-800/50 border-gray-700 opacity-75'
                          : 'bg-gray-50 border-gray-200 opacity-75'
                        : isOverdue
                        ? isDark
                          ? 'bg-red-900/30 border-red-800'
                          : 'bg-red-50 border-red-200'
                        : isUrgent
                        ? isDark
                          ? 'bg-yellow-900/30 border-yellow-800'
                          : 'bg-yellow-50 border-yellow-200'
                        : isDark
                          ? 'bg-gray-800 border-gray-700'
                          : 'bg-white border-gray-200'
                    }`}
                  >
                    <View className="flex-row justify-between items-start mb-2">
                      <View className="flex-1">
                        <View className="flex-row flex-wrap gap-2 mb-2">
                          <View className={`px-2 py-1 rounded border ${statusBadge.style}`}>
                            <Text className={`text-xs font-medium ${statusBadge.style.split(' ')[1]}`}>
                              {statusBadge.label}
                            </Text>
                          </View>
                          <View
                            className={`px-2 py-1 rounded ${
                              reminder.type === 'IVA'
                                ? isDark ? 'bg-blue-900/50' : 'bg-blue-100'
                                : isDark ? 'bg-purple-900/50' : 'bg-purple-100'
                            }`}
                          >
                            <Text
                              className={`text-xs font-medium ${
                                reminder.type === 'IVA'
                                  ? isDark ? 'text-blue-200' : 'text-blue-800'
                                  : isDark ? 'text-purple-200' : 'text-purple-800'
                              }`}
                            >
                              {reminder.type}
                            </Text>
                          </View>
                        </View>
                        <Text className={`font-semibold mb-1 ${
                          isDark ? 'text-white' : 'text-gray-900'
                        }`}>
                          {reminder.description}
                        </Text>
                        <Text className={`text-sm ${
                          isDark ? 'text-gray-400' : 'text-gray-600'
                        }`}>
                          {reminder.companyName}
                        </Text>
                      </View>
                    </View>
                    <View className={`flex-row justify-between items-center mt-3 pt-3 border-t ${
                      isDark ? 'border-gray-700' : 'border-gray-200'
                    }`}>
                      <View>
                        <Text className={`text-xs ${
                          isDark ? 'text-gray-400' : 'text-gray-600'
                        }`}>
                          Fecha de vencimiento
                        </Text>
                        <Text className={`text-sm font-medium ${
                          isDark ? 'text-white' : 'text-gray-900'
                        }`}>
                          {formatDate(reminder.dueDate)}
                        </Text>
                      </View>
                      <View className="items-end">
                        {reminder.status !== 'completed' && (
                          <>
                            <Text className={`text-xs ${
                              isDark ? 'text-gray-400' : 'text-gray-600'
                            }`}>
                              Días restantes
                            </Text>
                            <Text
                              className={`text-sm font-bold ${
                                isOverdue
                                  ? 'text-red-600'
                                  : isUrgent
                                  ? 'text-yellow-600'
                                  : isDark
                                    ? 'text-white'
                                    : 'text-gray-900'
                              }`}
                            >
                              {isOverdue
                                ? `${Math.abs(daysUntil)} días vencidos`
                                : `${daysUntil} días`}
                            </Text>
                          </>
                        )}
                      </View>
                    </View>
                    <TouchableOpacity
                      onPress={() => toggleReminderStatus(reminder.id)}
                      disabled={loading}
                      className={`mt-3 py-2 rounded-lg ${
                        reminder.status === 'completed'
                          ? isDark
                            ? 'bg-gray-700'
                            : 'bg-gray-200'
                          : isDark
                            ? 'bg-green-900/50'
                            : 'bg-green-100'
                      }`}
                    >
                      <Text
                        className={`text-center font-medium ${
                          reminder.status === 'completed'
                            ? isDark
                              ? 'text-gray-300'
                              : 'text-gray-700'
                            : isDark
                              ? 'text-green-300'
                              : 'text-green-700'
                        }`}
                      >
                        {reminder.status === 'completed'
                          ? '✓ Completado'
                          : 'Marcar como completado'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Modal de error */}
      <StyledModal
        visible={showErrorModal}
        onClose={() => setShowErrorModal(false)}
        title={errorMessage.title}
        message={errorMessage.message}
        buttons={[
          {
            text: 'Aceptar',
            onPress: () => setShowErrorModal(false),
          },
        ]}
      />
    </SafeAreaView>
  );
}

