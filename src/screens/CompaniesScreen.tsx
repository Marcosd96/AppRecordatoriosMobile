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
import { Company, Reminder } from '../types';
import { companiesService } from '../services/companiesService';
import { remindersService } from '../services/remindersService';
import { notificationsService } from '../services/notificationsService';

export default function CompaniesScreen() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newCompanyName, setNewCompanyName] = useState('');
  const [newCompanyNit, setNewCompanyNit] = useState('');
  const [creating, setCreating] = useState(false);

  const loadData = async () => {
    try {
      const [companiesData, remindersData] = await Promise.all([
        companiesService.getAll(),
        remindersService.getAll(),
      ]);
      setCompanies(companiesData);
      setReminders(remindersData);
      
      // Programar notificaciones automáticamente para todos los recordatorios pendientes
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

  const getCompanyStats = (companyId: string) => {
    const companyReminders = reminders.filter((r) => r.companyId === companyId);
    const now = new Date();
    const next30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    return {
      total: companyReminders.length,
      pending: companyReminders.filter((r) => r.status === 'pending').length,
      overdue: companyReminders.filter((r) => r.status === 'overdue').length,
      upcoming: companyReminders.filter((r) => {
        if (r.status !== 'pending') return false;
        const dueDate = new Date(r.dueDate);
        return dueDate >= now && dueDate <= next30Days;
      }).length,
    };
  };

  const handleAddCompany = async () => {
    if (!newCompanyName.trim() || !newCompanyNit.trim()) {
      Alert.alert('Error', 'Por favor completa todos los campos');
      return;
    }

    setCreating(true);
    try {
      const result = await companiesService.create({
        name: newCompanyName.trim(),
        nit: newCompanyNit.trim(),
      });

      if (result.success && result.company) {
        setCompanies([...companies, result.company]);
        setNewCompanyName('');
        setNewCompanyNit('');
        setShowAddForm(false);
        
        // Recargar datos para obtener los recordatorios generados
        await loadData();
        
        // Las notificaciones se programan automáticamente en loadData()
        Alert.alert('Éxito', 'Empresa agregada correctamente. Las notificaciones de recordatorios se han programado automáticamente.');
      }
    } catch (error: any) {
      console.error('Error al crear empresa:', error);
      Alert.alert('Error', error.message || 'No se pudo crear la empresa');
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteCompany = (companyId: string) => {
    Alert.alert(
      'Confirmar eliminación',
      '¿Estás seguro de que deseas eliminar esta empresa? Se eliminarán todos sus recordatorios.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              // Obtener los recordatorios de la empresa antes de eliminarla
              const companyReminders = reminders.filter((r) => r.companyId === companyId);
              
              await companiesService.delete(companyId);
              setCompanies(companies.filter((c) => c.id !== companyId));
              setReminders(reminders.filter((r) => r.companyId !== companyId));
              
              // Cancelar todas las notificaciones de los recordatorios de esta empresa
              for (const reminder of companyReminders) {
                await notificationsService.cancelReminderNotifications(reminder.id);
              }
              
              Alert.alert('Éxito', 'Empresa eliminada correctamente. Las notificaciones asociadas han sido canceladas.');
            } catch (error: any) {
              console.error('Error al eliminar empresa:', error);
              Alert.alert('Error', error.message || 'No se pudo eliminar la empresa');
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50 items-center justify-center" edges={['top']}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text className="text-gray-600 mt-4">Cargando empresas...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
      {/* Header */}
      <View className="bg-white px-6 py-4 border-b border-gray-200">
        <View className="flex-row justify-between items-center">
          <View>
            <Text className="text-2xl font-bold text-gray-900">
              Empresas
            </Text>
            <Text className="text-gray-600 mt-1">
              Gestiona tus empresas y clientes
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => setShowAddForm(!showAddForm)}
            className="bg-blue-600 px-4 py-2 rounded-lg"
          >
            <Text className="text-white font-semibold">
              {showAddForm ? 'Cancelar' : '+ Agregar'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={{ paddingBottom: 20 }}
      >
        {/* Formulario de agregar empresa */}
        {showAddForm && (
          <View className="mx-6 mt-4 bg-white rounded-xl p-4 border border-gray-200">
            <Text className="text-lg font-semibold text-gray-900 mb-4">
              Nueva Empresa
            </Text>
            <View className="mb-4">
              <Text className="text-sm font-medium text-gray-700 mb-2">
                Nombre de la empresa
              </Text>
              <TextInput
                className="bg-gray-50 border border-gray-300 rounded-lg px-4 py-3 text-gray-900"
                placeholder="Ej: Mi Empresa S.A.S."
                value={newCompanyName}
                onChangeText={setNewCompanyName}
                placeholderTextColor="#9ca3af"
              />
            </View>
            <View className="mb-4">
              <Text className="text-sm font-medium text-gray-700 mb-2">
                NIT
              </Text>
              <TextInput
                className="bg-gray-50 border border-gray-300 rounded-lg px-4 py-3 text-gray-900"
                placeholder="Ej: 900123456-7"
                value={newCompanyNit}
                onChangeText={setNewCompanyNit}
                placeholderTextColor="#9ca3af"
                keyboardType="numeric"
              />
            </View>
            <TouchableOpacity
              onPress={handleAddCompany}
              disabled={creating}
              className={`bg-blue-600 py-3 rounded-lg ${creating ? 'opacity-50' : ''}`}
            >
              {creating ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text className="text-white text-center font-semibold">
                  Agregar Empresa
                </Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* Lista de empresas */}
        <View className="px-6 py-4">
          {companies.length === 0 ? (
            <View className="bg-white rounded-xl p-8 border border-gray-200">
              <Text className="text-gray-600 text-center mb-4">
                No hay empresas registradas
              </Text>
              <TouchableOpacity
                onPress={() => setShowAddForm(true)}
                className="bg-blue-600 py-3 rounded-lg"
              >
                <Text className="text-white text-center font-semibold">
                  Agregar Primera Empresa
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View>
              {companies.map((company, index) => {
                const stats = getCompanyStats(company.id);
                return (
                  <View
                    key={company.id}
                    className={`bg-white rounded-xl p-4 border border-gray-200 shadow-sm ${index > 0 ? 'mt-4' : ''}`}
                  >
                    <View className="flex-row justify-between items-start mb-3">
                      <View className="flex-1">
                        <Text className="text-lg font-semibold text-gray-900 mb-1">
                          {company.name}
                        </Text>
                        <Text className="text-sm text-gray-600">
                          NIT: {company.nit}
                        </Text>
                      </View>
                      <TouchableOpacity
                        onPress={() => handleDeleteCompany(company.id)}
                        className="ml-2"
                      >
                        <Text className="text-red-600 text-lg">🗑️</Text>
                      </TouchableOpacity>
                    </View>

                    {/* Estadísticas */}
                    <View className="flex-row flex-wrap -mx-1 mb-3">
                      <View className="w-1/3 px-1">
                        <View className="bg-gray-50 rounded-lg p-2">
                          <Text className="text-xs text-gray-600 mb-1">
                            Total
                          </Text>
                          <Text className="text-lg font-bold text-gray-900">
                            {stats.total}
                          </Text>
                        </View>
                      </View>
                      <View className="w-1/3 px-1">
                        <View className="bg-yellow-50 rounded-lg p-2">
                          <Text className="text-xs text-yellow-700 mb-1">
                            Pendientes
                          </Text>
                          <Text className="text-lg font-bold text-yellow-900">
                            {stats.pending}
                          </Text>
                        </View>
                      </View>
                      <View className="w-1/3 px-1">
                        <View className="bg-red-50 rounded-lg p-2">
                          <Text className="text-xs text-red-700 mb-1">
                            Vencidos
                          </Text>
                          <Text className="text-lg font-bold text-red-900">
                            {stats.overdue}
                          </Text>
                        </View>
                      </View>
                    </View>

                    <TouchableOpacity className="bg-blue-50 py-2 rounded-lg border border-blue-200">
                      <Text className="text-blue-700 text-center font-medium">
                        Ver Recordatorios
                      </Text>
                    </TouchableOpacity>
                  </View>
                );
              })}
            </View>
          )}
        </View>

        {/* Información */}
        <View className="mx-6 mb-4 bg-blue-50 rounded-xl p-4 border border-blue-200">
          <Text className="text-sm font-semibold text-blue-900 mb-2">
            💡 Información
          </Text>
          <Text className="text-xs text-blue-800 leading-5">
            Al agregar una empresa, el sistema generará automáticamente los
            recordatorios fiscales según los calendarios de la DIAN. Puedes
            gestionar los calendarios desde la configuración de cada empresa.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

