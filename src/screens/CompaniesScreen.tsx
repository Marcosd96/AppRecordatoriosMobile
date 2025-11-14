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
import { useTheme } from '../context/ThemeContext';
import StyledModal from '../components/StyledModal';
import CalendarSelector from '../components/CalendarSelector';
import { CalendarType } from '../config/calendarTypes';

export default function CompaniesScreen({ navigation }: any) {
  const { isDark } = useTheme();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newCompanyName, setNewCompanyName] = useState('');
  const [newCompanyNit, setNewCompanyNit] = useState('');
  const [creating, setCreating] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [companyToDelete, setCompanyToDelete] = useState<string | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [modalMessage, setModalMessage] = useState({ title: '', message: '' });
  const [selectedCompanyForCalendars, setSelectedCompanyForCalendars] = useState<Company | null>(null);
  const [showCalendarSelector, setShowCalendarSelector] = useState(false);
  const [availableCalendars, setAvailableCalendars] = useState<CalendarType[]>([]);

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
      setModalMessage({
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
    loadAvailableCalendars();
  }, []);

  const loadAvailableCalendars = async () => {
    try {
      console.log('[CompaniesScreen] Cargando calendarios disponibles...');
      const calendars = await companiesService.getAvailableCalendars();
      console.log('[CompaniesScreen] Calendarios obtenidos:', calendars);
      console.log('[CompaniesScreen] Número de calendarios:', calendars.length);
      setAvailableCalendars(calendars);
    } catch (error) {
      console.error('Error al cargar calendarios disponibles:', error);
    }
  };

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
      setModalMessage({
        title: 'Error',
        message: 'Por favor completa todos los campos',
      });
      setShowErrorModal(true);
      return;
    }

    setCreating(true);
    try {
      const result = await companiesService.create({
        name: newCompanyName.trim(),
        nit: newCompanyNit.trim(),
        calendarTypes: [], // No preseleccionar calendarios
      });

      if (result.success && result.company) {
        // Si el backend asignó calendarios por defecto, limpiarlos
        let company = result.company;
        if (company.calendarTypes && company.calendarTypes.length > 0) {
          try {
            const updateResult = await companiesService.update(company.id, {
              name: company.name,
              nit: company.nit,
              cityId: company.cityId,
              calendarTypes: [], // Limpiar calendarios preseleccionados
            });
            if (updateResult.success && updateResult.company) {
              company = updateResult.company;
            }
          } catch (updateError) {
            console.error('Error al limpiar calendarios preseleccionados:', updateError);
            // Continuar aunque falle la actualización
          }
        }

        setCompanies([...companies, company]);
        setNewCompanyName('');
        setNewCompanyNit('');
        setShowAddForm(false);
        
        // Recargar datos para obtener los recordatorios generados
        await loadData();
        
        // Las notificaciones se programan automáticamente en loadData()
        setModalMessage({
          title: 'Éxito',
          message: 'Empresa agregada correctamente. Puedes gestionar los calendarios desde la configuración de la empresa.',
        });
        setShowSuccessModal(true);
      }
    } catch (error: any) {
      console.error('Error al crear empresa:', error);
      setModalMessage({
        title: 'Error',
        message: error.message || 'No se pudo crear la empresa',
      });
      setShowErrorModal(true);
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteCompany = (companyId: string) => {
    setCompanyToDelete(companyId);
    setShowDeleteModal(true);
  };

  const confirmDeleteCompany = async () => {
    if (!companyToDelete) return;
    
    try {
      // Obtener los recordatorios de la empresa antes de eliminarla
      const companyReminders = reminders.filter((r) => r.companyId === companyToDelete);
      
      await companiesService.delete(companyToDelete);
      setCompanies(companies.filter((c) => c.id !== companyToDelete));
      setReminders(reminders.filter((r) => r.companyId !== companyToDelete));
      
      // Cancelar todas las notificaciones de los recordatorios de esta empresa
      for (const reminder of companyReminders) {
        await notificationsService.cancelReminderNotifications(reminder.id);
      }
      
      setShowDeleteModal(false);
      setCompanyToDelete(null);
      setModalMessage({
        title: 'Éxito',
        message: 'Empresa eliminada correctamente. Las notificaciones asociadas han sido canceladas.',
      });
      setShowSuccessModal(true);
    } catch (error: any) {
      console.error('Error al eliminar empresa:', error);
      setShowDeleteModal(false);
      setCompanyToDelete(null);
      setModalMessage({
        title: 'Error',
        message: error.message || 'No se pudo eliminar la empresa',
      });
      setShowErrorModal(true);
    }
  };

  const handleSaveCalendars = async (selectedCalendars: CalendarType[]) => {
    if (!selectedCompanyForCalendars) return;

    try {
      // Actualizar empresa con los calendarios seleccionados
      await companiesService.update(selectedCompanyForCalendars.id, {
        name: selectedCompanyForCalendars.name,
        nit: selectedCompanyForCalendars.nit,
        cityId: selectedCompanyForCalendars.cityId,
        calendarTypes: selectedCalendars,
      });

      // Recargar datos (esto regenerará los recordatorios en el backend)
      await loadData();
      
      // Programar notificaciones con notificaciones inmediatas habilitadas
      // porque se acaban de crear/actualizar recordatorios
      try {
        const allReminders = await remindersService.getAll();
        await notificationsService.scheduleAllReminders(allReminders, true);
      } catch (notifError) {
        console.error('Error al programar notificaciones después de actualizar calendarios:', notifError);
      }

      setModalMessage({
        title: 'Éxito',
        message: 'Calendarios actualizados correctamente. Los recordatorios se han regenerado.',
      });
      setShowSuccessModal(true);
    } catch (error: any) {
      console.error('Error al guardar calendarios:', error);
      throw error;
    }
  };

  if (loading) {
    return (
      <SafeAreaView className={`flex-1 items-center justify-center ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`} edges={['top']}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text className={isDark ? 'text-gray-300 mt-4' : 'text-gray-600 mt-4'}>Cargando empresas...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className={`flex-1 ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`} edges={['top']}>
      {/* Header */}
      <View className={`px-6 py-4 border-b ${
        isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
      }`}>
        <View className="flex-row justify-between items-center">
          <View>
            <Text className={`text-2xl font-bold ${
              isDark ? 'text-white' : 'text-gray-900'
            }`}>
              Empresas
            </Text>
            <Text className={`mt-1 ${
              isDark ? 'text-gray-300' : 'text-gray-600'
            }`}>
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

        {/* Lista de empresas */}
        <View className="px-6 py-4">
          {companies.length === 0 ? (
            <View className={`rounded-xl p-8 border ${
              isDark 
                ? 'bg-gray-800 border-gray-700' 
                : 'bg-white border-gray-200'
            }`}>
              <Text className={`text-center mb-4 ${
                isDark ? 'text-gray-300' : 'text-gray-600'
              }`}>
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
                    className={`rounded-xl p-4 border shadow-sm ${index > 0 ? 'mt-4' : ''} ${
                      isDark 
                        ? 'bg-gray-800 border-gray-700' 
                        : 'bg-white border-gray-200'
                    }`}
                  >
                    <View className="flex-row justify-between items-start mb-3">
                      <View className="flex-1">
                        <Text className={`text-lg font-semibold mb-1 ${
                          isDark ? 'text-white' : 'text-gray-900'
                        }`}>
                          {company.name}
                        </Text>
                        <Text className={`text-sm ${
                          isDark ? 'text-gray-400' : 'text-gray-600'
                        }`}>
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
                        <View className={`rounded-lg p-2 ${
                          isDark ? 'bg-gray-700' : 'bg-gray-50'
                        }`}>
                          <Text className={`text-xs mb-1 ${
                            isDark ? 'text-gray-400' : 'text-gray-600'
                          }`}>
                            Total
                          </Text>
                          <Text className={`text-lg font-bold ${
                            isDark ? 'text-white' : 'text-gray-900'
                          }`}>
                            {stats.total}
                          </Text>
                        </View>
                      </View>
                      <View className="w-1/3 px-1">
                        <View className={`rounded-lg p-2 ${
                          isDark 
                            ? 'bg-yellow-900/30' 
                            : 'bg-yellow-50'
                        }`}>
                          <Text className={`text-xs mb-1 ${
                            isDark ? 'text-yellow-300' : 'text-yellow-700'
                          }`}>
                            Pendientes
                          </Text>
                          <Text className={`text-lg font-bold ${
                            isDark ? 'text-yellow-200' : 'text-yellow-900'
                          }`}>
                            {stats.pending}
                          </Text>
                        </View>
                      </View>
                      <View className="w-1/3 px-1">
                        <View className={`rounded-lg p-2 ${
                          isDark 
                            ? 'bg-red-900/30' 
                            : 'bg-red-50'
                        }`}>
                          <Text className={`text-xs mb-1 ${
                            isDark ? 'text-red-300' : 'text-red-700'
                          }`}>
                            Vencidos
                          </Text>
                          <Text className={`text-lg font-bold ${
                            isDark ? 'text-red-200' : 'text-red-900'
                          }`}>
                            {stats.overdue}
                          </Text>
                        </View>
                      </View>
                    </View>

                    {/* Botones de acción */}
                    <View className="space-y-2">
                      <TouchableOpacity 
                        onPress={() => {
                          setSelectedCompanyForCalendars(company);
                          setShowCalendarSelector(true);
                        }}
                        className={`py-2 rounded-lg border ${
                          isDark 
                            ? 'bg-green-900/30 border-green-800' 
                            : 'bg-green-50 border-green-200'
                        }`}
                      >
                        <Text className={`text-center font-medium ${
                          isDark ? 'text-green-300' : 'text-green-700'
                        }`}>
                          📅 Gestionar Calendarios
                        </Text>
                      </TouchableOpacity>
                      
                      <TouchableOpacity 
                        onPress={() => navigation.navigate('Reminders', { companyId: company.id })}
                        className={`py-2 rounded-lg border ${
                          isDark 
                            ? 'bg-blue-900/30 border-blue-800' 
                            : 'bg-blue-50 border-blue-200'
                        }`}
                      >
                        <Text className={`text-center font-medium ${
                          isDark ? 'text-blue-300' : 'text-blue-700'
                        }`}>
                          Ver Recordatorios
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </View>

        {/* Información */}
        <View className={`mx-6 mb-4 rounded-xl p-4 border ${
          isDark 
            ? 'bg-blue-900/30 border-blue-800' 
            : 'bg-blue-50 border-blue-200'
        }`}>
          <Text className={`text-sm font-semibold mb-2 ${
            isDark ? 'text-blue-200' : 'text-blue-900'
          }`}>
            💡 Información
          </Text>
          <Text className={`text-xs leading-5 ${
            isDark ? 'text-blue-300' : 'text-blue-800'
          }`}>
            Al agregar una empresa, el sistema generará automáticamente los
            recordatorios fiscales según los calendarios de la DIAN. Puedes
            gestionar los calendarios desde la configuración de cada empresa.
          </Text>
        </View>
      </ScrollView>

      {/* Modal de formulario para agregar empresa */}
      <StyledModal
        visible={showAddForm}
        onClose={() => {
          setShowAddForm(false);
          setNewCompanyName('');
          setNewCompanyNit('');
        }}
        title="Nueva Empresa"
      >
        <View className="mt-4">
          <View className="mb-4">
            <Text className={`text-sm font-medium mb-2 ${
              isDark ? 'text-gray-300' : 'text-gray-700'
            }`}>
              Nombre de la empresa
            </Text>
            <TextInput
              className={`border rounded-lg px-4 py-3 ${
                isDark 
                  ? 'bg-gray-700 border-gray-600 text-white' 
                  : 'bg-gray-50 border-gray-300 text-gray-900'
              }`}
              placeholder="Ej: Mi Empresa S.A.S."
              value={newCompanyName}
              onChangeText={setNewCompanyName}
              placeholderTextColor="#9ca3af"
            />
          </View>
          <View className="mb-4">
            <Text className={`text-sm font-medium mb-2 ${
              isDark ? 'text-gray-300' : 'text-gray-700'
            }`}>
              NIT
            </Text>
            <TextInput
              className={`border rounded-lg px-4 py-3 ${
                isDark 
                  ? 'bg-gray-700 border-gray-600 text-white' 
                  : 'bg-gray-50 border-gray-300 text-gray-900'
              }`}
              placeholder="Ej: 900123456-7"
              value={newCompanyNit}
              onChangeText={setNewCompanyNit}
              placeholderTextColor="#9ca3af"
              keyboardType="numeric"
            />
          </View>
        </View>
        <View className={`px-6 pb-6 pt-2 border-t ${
          isDark ? 'border-gray-700' : 'border-gray-200'
        }`}>
          <View className="flex-row justify-end gap-3">
            <TouchableOpacity
              onPress={() => {
                setShowAddForm(false);
                setNewCompanyName('');
                setNewCompanyNit('');
              }}
              className="px-5 py-3 rounded-lg"
              style={{ backgroundColor: isDark ? '#374151' : '#e5e7eb' }}
            >
              <Text className={`font-semibold ${
                isDark ? 'text-gray-200' : 'text-gray-700'
              }`}>
                Cancelar
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleAddCompany}
              disabled={creating}
              className="px-5 py-3 rounded-lg"
              style={{
                backgroundColor: creating ? '#9ca3af' : '#2563eb',
                opacity: creating ? 0.5 : 1,
              }}
            >
              {creating ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text className="text-white font-semibold">
                  Agregar Empresa
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </StyledModal>

      {/* Modal de confirmación de eliminación */}
      <StyledModal
        visible={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setCompanyToDelete(null);
        }}
        title="Confirmar eliminación"
        message="¿Estás seguro de que deseas eliminar esta empresa? Se eliminarán todos sus recordatorios."
        buttons={[
          {
            text: 'Cancelar',
            style: 'cancel',
            onPress: () => {
              setShowDeleteModal(false);
              setCompanyToDelete(null);
            },
          },
          {
            text: 'Eliminar',
            style: 'destructive',
            onPress: confirmDeleteCompany,
          },
        ]}
      />

      {/* Modal de éxito */}
      <StyledModal
        visible={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        title={modalMessage.title}
        message={modalMessage.message}
        buttons={[
          {
            text: 'Aceptar',
            onPress: () => setShowSuccessModal(false),
          },
        ]}
      />

      {/* Modal de error */}
      <StyledModal
        visible={showErrorModal}
        onClose={() => setShowErrorModal(false)}
        title={modalMessage.title}
        message={modalMessage.message}
        buttons={[
          {
            text: 'Aceptar',
            onPress: () => setShowErrorModal(false),
          },
        ]}
      />

      {/* Selector de calendarios */}
      {selectedCompanyForCalendars && (
        <CalendarSelector
          company={selectedCompanyForCalendars}
          availableCalendars={availableCalendars}
          visible={showCalendarSelector}
          onClose={() => {
            setShowCalendarSelector(false);
            // Esperar a que termine la animación antes de limpiar el estado
            setTimeout(() => {
              setSelectedCompanyForCalendars(null);
            }, 300);
          }}
          onSave={handleSaveCalendars}
        />
      )}
    </SafeAreaView>
  );
}

