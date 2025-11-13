import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Reminder, ReminderFilter, SortBy, Company } from '../types';
import { remindersService } from '../services/remindersService';
import { companiesService } from '../services/companiesService';
import { notificationsService } from '../services/notificationsService';

export default function RemindersScreen() {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
  const [filter, setFilter] = useState<ReminderFilter>('all');
  const [sortBy, setSortBy] = useState<SortBy>('date');
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

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
      Alert.alert(
        'Error',
        error.message || 'No se pudieron cargar los datos. Verifica tu conexión.'
      );
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

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
  };

  const filteredReminders = reminders
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
    });

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

  const toggleReminderStatus = async (id: string) => {
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
      Alert.alert('Error', error.message || 'No se pudo actualizar el recordatorio');
    }
  };

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
      <SafeAreaView className="flex-1 bg-gray-50 items-center justify-center" edges={['top']}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text className="text-gray-600 mt-4">Cargando recordatorios...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
      {/* Header */}
      <View className="bg-white px-6 py-4 border-b border-gray-200">
        <Text className="text-2xl font-bold text-gray-900">
          Recordatorios Fiscales
        </Text>
        <Text className="text-gray-600 mt-1">
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
              <View className="bg-white rounded-lg p-3 border border-gray-200">
                <Text className="text-xs text-gray-600 mb-1">Total</Text>
                <Text className="text-xl font-bold text-gray-900">
                  {stats.total}
                </Text>
              </View>
            </View>
            <View className="w-1/2 px-2 mb-2">
              <View className="bg-yellow-50 rounded-lg p-3 border border-yellow-200">
                <Text className="text-xs text-yellow-700 mb-1">Pendientes</Text>
                <Text className="text-xl font-bold text-yellow-900">
                  {stats.pending}
                </Text>
              </View>
            </View>
            <View className="w-1/2 px-2 mb-2">
              <View className="bg-red-50 rounded-lg p-3 border border-red-200">
                <Text className="text-xs text-red-700 mb-1">Vencidos</Text>
                <Text className="text-xl font-bold text-red-900">
                  {stats.overdue}
                </Text>
              </View>
            </View>
            <View className="w-1/2 px-2 mb-2">
              <View className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                <Text className="text-xs text-blue-700 mb-1">Próximos</Text>
                <Text className="text-xl font-bold text-blue-900">
                  {stats.upcoming}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Búsqueda */}
        <View className="px-6 py-2">
          <TextInput
            className="bg-white border border-gray-300 rounded-lg px-4 py-3 text-gray-900"
            placeholder="Buscar recordatorios..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#9ca3af"
          />
        </View>

        {/* Filtros */}
        <View className="px-6 py-2">
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View className="flex-row">
              {(['all', 'pending', 'overdue', 'upcoming'] as ReminderFilter[]).map(
                (f, idx) => (
                  <TouchableOpacity
                    key={f}
                    onPress={() => setFilter(f)}
                    className={`px-4 py-2 rounded-lg ${idx > 0 ? 'ml-2' : ''} ${
                      filter === f
                        ? 'bg-blue-600'
                        : 'bg-white border border-gray-300'
                    }`}
                  >
                    <Text
                      className={`text-sm font-medium ${
                        filter === f ? 'text-white' : 'text-gray-700'
                      }`}
                    >
                      {f === 'all'
                        ? 'Todos'
                        : f === 'pending'
                        ? 'Pendientes'
                        : f === 'overdue'
                        ? 'Vencidos'
                        : 'Próximos'}
                    </Text>
                  </TouchableOpacity>
                )
              )}
            </View>
          </ScrollView>
        </View>

        {/* Selector de empresa */}
        <View className="px-6 py-2">
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View className="flex-row">
              <TouchableOpacity
                onPress={() => setSelectedCompanyId(null)}
                className={`px-4 py-2 rounded-lg ${
                  selectedCompanyId === null
                    ? 'bg-blue-600'
                    : 'bg-white border border-gray-300'
                }`}
              >
                <Text
                  className={`text-sm font-medium ${
                    selectedCompanyId === null ? 'text-white' : 'text-gray-700'
                  }`}
                >
                  Todas
                </Text>
              </TouchableOpacity>
              {companies.map((company, idx) => (
                <TouchableOpacity
                  key={company.id}
                  onPress={() => setSelectedCompanyId(company.id)}
                  className={`px-4 py-2 rounded-lg ml-2 ${
                    selectedCompanyId === company.id
                      ? 'bg-blue-600'
                      : 'bg-white border border-gray-300'
                  }`}
                >
                  <Text
                    className={`text-sm font-medium ${
                      selectedCompanyId === company.id
                        ? 'text-white'
                        : 'text-gray-700'
                    }`}
                  >
                    {company.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Lista de recordatorios */}
        <View className="px-6 py-4">
          {filteredReminders.length === 0 ? (
            <View className="bg-white rounded-xl p-8 border border-gray-200">
              <Text className="text-gray-600 text-center">
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
                        ? 'bg-gray-50 border-gray-200 opacity-75'
                        : isOverdue
                        ? 'bg-red-50 border-red-200'
                        : isUrgent
                        ? 'bg-yellow-50 border-yellow-200'
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
                                ? 'bg-blue-100'
                                : 'bg-purple-100'
                            }`}
                          >
                            <Text
                              className={`text-xs font-medium ${
                                reminder.type === 'IVA'
                                  ? 'text-blue-800'
                                  : 'text-purple-800'
                              }`}
                            >
                              {reminder.type}
                            </Text>
                          </View>
                        </View>
                        <Text className="font-semibold text-gray-900 mb-1">
                          {reminder.description}
                        </Text>
                        <Text className="text-sm text-gray-600">
                          {reminder.companyName}
                        </Text>
                      </View>
                    </View>
                    <View className="flex-row justify-between items-center mt-3 pt-3 border-t border-gray-200">
                      <View>
                        <Text className="text-xs text-gray-600">
                          Fecha de vencimiento
                        </Text>
                        <Text className="text-sm font-medium text-gray-900">
                          {formatDate(reminder.dueDate)}
                        </Text>
                      </View>
                      <View className="items-end">
                        {reminder.status !== 'completed' && (
                          <>
                            <Text className="text-xs text-gray-600">
                              Días restantes
                            </Text>
                            <Text
                              className={`text-sm font-bold ${
                                isOverdue
                                  ? 'text-red-600'
                                  : isUrgent
                                  ? 'text-yellow-600'
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
                          ? 'bg-gray-200'
                          : 'bg-green-100'
                      }`}
                    >
                      <Text
                        className={`text-center font-medium ${
                          reminder.status === 'completed'
                            ? 'text-gray-700'
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
    </SafeAreaView>
  );
}

