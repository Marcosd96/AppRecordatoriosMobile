import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  TextInput,
  ActivityIndicator,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Company, Reminder } from '../types';
import { companiesService } from '../services/companiesService';
import { remindersService } from '../services/remindersService';
import { notificationsService } from '../services/notificationsService';
import { useTheme } from '../context/ThemeContext';
import { useResponsive } from '../hooks/useResponsive';
import StyledModal from '../components/StyledModal';
import CalendarSelector from '../components/CalendarSelector';
import { CalendarType } from '../config/calendarTypes';
import AnimatedView from '../components/AnimatedView';
import AnimatedButton from '../components/AnimatedButton';

export default function CompaniesScreen({ navigation }: any) {
  const { isDark } = useTheme();
  const responsive = useResponsive();
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
  const [selectedCompanyForCalendars, setSelectedCompanyForCalendars] =
    useState<Company | null>(null);
  const [showCalendarSelector, setShowCalendarSelector] = useState(false);
  const [availableCalendars, setAvailableCalendars] = useState<CalendarType[]>(
    [],
  );

  const addCompanyModalLayout = useMemo(() => {
    const modalMaxHeight =
      responsive.height *
      (responsive.isTablet ? 0.85 : responsive.isSmallDevice ? 0.95 : 0.9);
    const modalMaxWidth = responsive.isTablet
      ? Math.min(responsive.width * 0.8, 720)
      : responsive.width;
    const reservedHeaderSpace = responsive.isSmallDevice
      ? responsive.spacing['2xl']
      : responsive.spacing['3xl'];

    return {
      maxHeight: modalMaxHeight,
      maxWidth: modalMaxWidth,
      contentMaxHeight: Math.max(
        modalMaxHeight - reservedHeaderSpace,
        responsive.verticalScale(320),
      ),
      horizontalPadding: responsive.isTablet
        ? responsive.spacing.xl
        : responsive.spacing.sm,
      justifyContent: responsive.isTablet ? 'center' : 'flex-end',
      borderRadiusClass: responsive.isTablet ? 'rounded-3xl' : 'rounded-t-3xl',
    };
  }, [responsive]);

  const resetAddCompanyForm = () => {
    setShowAddForm(false);
    setNewCompanyName('');
    setNewCompanyNit('');
  };

  const isAddCompanyFormValid =
    newCompanyName.trim().length > 0 && newCompanyNit.trim().length > 0;

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
        message:
          error.message ||
          'No se pudieron cargar los datos. Verifica tu conexión.',
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
    const companyReminders = reminders.filter(r => r.companyId === companyId);
    const now = new Date();
    const next30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    return {
      total: companyReminders.length,
      pending: companyReminders.filter(r => r.status === 'pending').length,
      overdue: companyReminders.filter(r => r.status === 'overdue').length,
      upcoming: companyReminders.filter(r => {
        if (r.status !== 'pending') return false;
        const dueDate = new Date(r.dueDate);
        return dueDate >= now && dueDate <= next30Days;
      }).length,
    };
  };

  const handleAddCompany = async () => {
    if (!isAddCompanyFormValid) {
      setModalMessage({
        title: 'Error',
        message: 'Por favor completa todos los campos',
      });
      setShowErrorModal(true);
      return;
    }

    setCreating(true);
    try {
      const trimmedName = newCompanyName.trim();
      const trimmedNit = newCompanyNit.trim();
      const result = await companiesService.create({
        name: trimmedName,
        nit: trimmedNit,
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
            console.error(
              'Error al limpiar calendarios preseleccionados:',
              updateError,
            );
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
          message:
            'Empresa agregada correctamente. Puedes gestionar los calendarios desde la configuración de la empresa.',
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
      const companyReminders = reminders.filter(
        r => r.companyId === companyToDelete,
      );

      await companiesService.delete(companyToDelete);
      setCompanies(companies.filter(c => c.id !== companyToDelete));
      setReminders(reminders.filter(r => r.companyId !== companyToDelete));

      // Cancelar todas las notificaciones de los recordatorios de esta empresa
      for (const reminder of companyReminders) {
        await notificationsService.cancelReminderNotifications(reminder.id);
      }

      setShowDeleteModal(false);
      setCompanyToDelete(null);
      setModalMessage({
        title: 'Éxito',
        message:
          'Empresa eliminada correctamente. Las notificaciones asociadas han sido canceladas.',
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
        console.error(
          'Error al programar notificaciones después de actualizar calendarios:',
          notifError,
        );
      }

      setModalMessage({
        title: 'Éxito',
        message:
          'Calendarios actualizados correctamente. Los recordatorios se han regenerado.',
      });
      setShowSuccessModal(true);
    } catch (error: any) {
      console.error('Error al guardar calendarios:', error);
      throw error;
    }
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
          Cargando empresas...
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      className={`flex-1 ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}
      edges={['top']}
    >
      {/* Header */}
      <View
        className={`border-b ${
          isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        }`}
        style={{
          paddingHorizontal: responsive.spacing.lg,
          paddingVertical: responsive.spacing.md,
        }}
      >
        <View className="flex-row justify-between items-center">
          <View className="flex-1">
            <View
              className="flex-row items-center"
              style={{ marginBottom: responsive.spacing.sm }}
            >
              <Text
                style={{
                  fontSize: responsive.fontSize['3xl'],
                  marginRight: responsive.spacing.sm,
                }}
              >
                🏢
              </Text>
              <Text
                className={`font-bold ${
                  isDark ? 'text-white' : 'text-gray-900'
                }`}
                style={{ fontSize: responsive.fontSize['3xl'] }}
              >
                Empresas
              </Text>
            </View>
            <Text
              className={`${isDark ? 'text-gray-300' : 'text-gray-600'}`}
              style={{
                marginTop: responsive.spacing.sm,
                fontSize: responsive.fontSize.base,
              }}
            >
              Gestiona tus clientes
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => setShowAddForm(!showAddForm)}
            className={`rounded-xl ${
              showAddForm
                ? isDark
                  ? 'bg-gray-700'
                  : 'bg-gray-200'
                : 'bg-blue-600'
            }`}
            style={{
              marginLeft: responsive.spacing.md,
              paddingHorizontal: responsive.spacing.md,
              paddingVertical: responsive.spacing.sm,
            }}
          >
            <Text
              className={`font-semibold ${
                showAddForm
                  ? isDark
                    ? 'text-gray-200'
                    : 'text-gray-700'
                  : 'text-white'
              }`}
              style={{
                fontSize: responsive.fontSize.sm,
                color: showAddForm
                  ? isDark
                    ? '#e5e7eb'
                    : '#1f2937'
                  : '#ffffff',
              }}
            >
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
        contentContainerStyle={{ paddingBottom: responsive.spacing.lg }}
      >
        {/* Lista de empresas */}
        <View
          style={{
            paddingHorizontal: responsive.spacing.lg,
            paddingVertical: responsive.spacing.md,
          }}
        >
          {companies.length === 0 ? (
            <View
              className={`rounded-3xl border items-center ${
                isDark
                  ? 'bg-gray-800 border-gray-700'
                  : 'bg-white border-gray-200'
              }`}
              style={{ padding: responsive.spacing['2xl'] }}
            >
              <Text
                style={{
                  fontSize: responsive.fontSize['4xl'],
                  marginBottom: responsive.spacing.md,
                }}
              >
                🏢
              </Text>
              <Text
                className={`font-semibold text-center ${
                  isDark ? 'text-white' : 'text-gray-900'
                }`}
                style={{
                  fontSize: responsive.fontSize.base,
                  marginBottom: responsive.spacing.sm,
                }}
              >
                No hay empresas registradas
              </Text>
              <Text
                className={`text-center ${
                  isDark ? 'text-gray-400' : 'text-gray-500'
                }`}
                style={{
                  marginBottom: responsive.spacing.md,
                  fontSize: responsive.fontSize.sm,
                }}
              >
                Agrega tu primera empresa para comenzar a gestionar
                recordatorios fiscales.
              </Text>
              <TouchableOpacity
                onPress={() => setShowAddForm(true)}
                className="bg-blue-600 rounded-2xl"
                style={{
                  paddingVertical: responsive.spacing.md,
                  paddingHorizontal: responsive.spacing.lg,
                }}
              >
              <Text
                className="text-white text-center font-semibold"
                style={{
                  fontSize: responsive.fontSize.base,
                  color: '#ffffff',
                }}
              >
                  Agregar Primera Empresa
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View>
              {companies.map((company) => {
                const stats = getCompanyStats(company.id);
                return (
                  <View
                    key={company.id}
                    className={`rounded-3xl border ${
                      isDark
                        ? 'bg-gray-800/80 border-gray-700'
                        : 'bg-white border-gray-200'
                    }`}
                    style={{
                      padding: responsive.spacing.lg,
                      marginBottom: responsive.spacing.md,
                    }}
                  >
                    <View
                      className="flex-row justify-between items-start"
                      style={{ marginBottom: responsive.spacing.md }}
                    >
                      <View className="flex-1">
                        <Text
                          className={`font-semibold ${
                            isDark ? 'text-white' : 'text-gray-900'
                          }`}
                          style={{
                            fontSize: responsive.fontSize.lg,
                            marginBottom: responsive.spacing.xs,
                          }}
                        >
                          {company.name}
                        </Text>
                        <Text
                          className={`${
                            isDark ? 'text-gray-400' : 'text-gray-600'
                          }`}
                          style={{ fontSize: responsive.fontSize.sm }}
                        >
                          NIT: {company.nit}
                        </Text>
                      </View>
                      <TouchableOpacity
                        onPress={() => handleDeleteCompany(company.id)}
                        style={{ marginLeft: responsive.spacing.sm }}
                      >
                        <Text
                          className="text-red-600"
                          style={{ fontSize: responsive.fontSize.lg }}
                        >
                          🗑️
                        </Text>
                      </TouchableOpacity>
                    </View>

                    {/* Estadísticas */}
                    <View
                      className={`rounded-2xl ${
                        isDark ? 'bg-gray-900/60' : 'bg-gray-50'
                      }`}
                      style={{
                        padding: responsive.spacing.md,
                        marginBottom: responsive.spacing.md,
                      }}
                    >
                      <Text
                        className={`font-semibold ${
                          isDark ? 'text-gray-300' : 'text-gray-600'
                        }`}
                        style={{
                          fontSize: responsive.fontSize.xs,
                          marginBottom: responsive.spacing.md,
                        }}
                      >
                        Estadísticas
                      </Text>
                      <View
                        className="flex-row flex-wrap"
                        style={{ marginHorizontal: -responsive.spacing.xs }}
                      >
                        <View
                          style={{
                            width: responsive.isTablet ? '33.33%' : '33.33%',
                            paddingHorizontal: responsive.spacing.xs,
                          }}
                        >
                          <View
                            className={`rounded-xl ${
                              isDark ? 'bg-blue-500/10' : 'bg-blue-50'
                            }`}
                            style={{ padding: responsive.spacing.md }}
                          >
                            <Text
                              className={`${
                                isDark ? 'text-gray-400' : 'text-gray-600'
                              }`}
                              style={{
                                fontSize: responsive.fontSize.xs,
                                marginBottom: responsive.spacing.xs,
                              }}
                            >
                              Total
                            </Text>
                            <Text
                              className={`font-bold ${
                                isDark ? 'text-blue-200' : 'text-blue-700'
                              }`}
                              style={{ fontSize: responsive.fontSize.xl }}
                            >
                              {stats.total}
                            </Text>
                          </View>
                        </View>
                        <View
                          style={{
                            width: responsive.isTablet ? '33.33%' : '33.33%',
                            paddingHorizontal: responsive.spacing.xs,
                          }}
                        >
                          <View
                            className={`rounded-xl ${
                              isDark ? 'bg-yellow-500/10' : 'bg-yellow-50'
                            }`}
                            style={{ padding: responsive.spacing.md }}
                          >
                            <Text
                              className={`${
                                isDark ? 'text-yellow-300' : 'text-yellow-700'
                              }`}
                              style={{
                                fontSize: responsive.fontSize.xs,
                                marginBottom: responsive.spacing.xs,
                              }}
                            >
                              Pendientes
                            </Text>
                            <Text
                              className={`font-bold ${
                                isDark ? 'text-yellow-200' : 'text-yellow-900'
                              }`}
                              style={{ fontSize: responsive.fontSize.xl }}
                            >
                              {stats.pending}
                            </Text>
                          </View>
                        </View>
                        <View
                          style={{
                            width: responsive.isTablet ? '33.33%' : '33.33%',
                            paddingHorizontal: responsive.spacing.xs,
                          }}
                        >
                          <View
                            className={`rounded-xl ${
                              isDark ? 'bg-red-500/10' : 'bg-red-50'
                            }`}
                            style={{ padding: responsive.spacing.md }}
                          >
                            <Text
                              className={`${
                                isDark ? 'text-red-300' : 'text-red-700'
                              }`}
                              style={{
                                fontSize: responsive.fontSize.xs,
                                marginBottom: responsive.spacing.xs,
                              }}
                            >
                              Vencidos
                            </Text>
                            <Text
                              className={`font-bold ${
                                isDark ? 'text-red-200' : 'text-red-900'
                              }`}
                              style={{ fontSize: responsive.fontSize.xl }}
                            >
                              {stats.overdue}
                            </Text>
                          </View>
                        </View>
                      </View>
                    </View>

                    {/* Botones de acción */}
                    <View
                      className="flex-row flex-wrap"
                      style={{ marginHorizontal: -responsive.spacing.xs }}
                    >
                      <View
                        style={{
                          width: responsive.isSmallDevice ? '100%' : '50%',
                          paddingHorizontal: responsive.spacing.xs,
                          marginBottom: responsive.spacing.sm,
                        }}
                      >
                        <TouchableOpacity
                          onPress={() => {
                            setSelectedCompanyForCalendars(company);
                            setShowCalendarSelector(true);
                          }}
                          className={`rounded-2xl items-center justify-center ${
                            isDark ? 'bg-green-900/40' : 'bg-green-100'
                          }`}
                          style={{ paddingVertical: responsive.spacing.sm }}
                        >
                          <Text
                            className={`font-semibold ${
                              isDark ? 'text-green-100' : 'text-green-800'
                            }`}
                            style={{
                              fontSize: responsive.fontSize.sm,
                              color: isDark ? '#d1fae5' : '#065f46',
                            }}
                          >
                            📅 Calendarios
                          </Text>
                        </TouchableOpacity>
                      </View>

                      <View
                        style={{
                          width: responsive.isSmallDevice ? '100%' : '50%',
                          paddingHorizontal: responsive.spacing.xs,
                          marginBottom: responsive.spacing.sm,
                        }}
                      >
                        <TouchableOpacity
                          onPress={() =>
                            navigation.navigate('Reminders', {
                              companyId: company.id,
                            })
                          }
                          className={`rounded-2xl items-center justify-center ${
                            isDark ? 'bg-blue-900/40' : 'bg-blue-100'
                          }`}
                          style={{ paddingVertical: responsive.spacing.sm }}
                        >
                          <Text
                            className={`font-semibold ${
                              isDark ? 'text-blue-100' : 'text-blue-800'
                            }`}
                            style={{
                              fontSize: responsive.fontSize.sm,
                              color: isDark ? '#bfdbfe' : '#1e40af',
                            }}
                          >
                            Ver Recordatorios
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </View>

        {/* Información */}
        <View
          className={`rounded-xl border ${
            isDark
              ? 'bg-blue-900/30 border-blue-800'
              : 'bg-blue-50 border-blue-200'
          }`}
          style={{
            marginHorizontal: responsive.spacing.lg,
            marginBottom: responsive.spacing.md,
            padding: responsive.spacing.md,
          }}
        >
          <Text
            className={`font-semibold ${
              isDark ? 'text-blue-200' : 'text-blue-900'
            }`}
            style={{
              fontSize: responsive.fontSize.sm,
              marginBottom: responsive.spacing.sm,
            }}
          >
            💡 Información
          </Text>
          <Text
            className={`${isDark ? 'text-blue-300' : 'text-blue-800'}`}
            style={{
              fontSize: responsive.fontSize.xs,
              lineHeight: responsive.fontSize.xs * 1.5,
            }}
          >
            Al agregar una empresa, el sistema generará automáticamente los
            recordatorios fiscales según los calendarios de la DIAN. Puedes
            gestionar los calendarios desde la configuración de cada empresa.
          </Text>
        </View>
      </ScrollView>

      {/* Modal reinventado para agregar empresa */}
      <Modal
        visible={showAddForm}
        animationType="slide"
        transparent
        onRequestClose={resetAddCompanyForm}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1 }}
        >
          <View
            className="flex-1 bg-black/60"
            style={{
              justifyContent: addCompanyModalLayout.justifyContent as
                | 'center'
                | 'flex-end',
              paddingHorizontal: addCompanyModalLayout.horizontalPadding,
              paddingBottom: responsive.isTablet ? responsive.spacing.xl : 0,
            }}
          >
            <View
              className={`${addCompanyModalLayout.borderRadiusClass} ${
                isDark ? 'bg-gray-900' : 'bg-white'
              }`}
              style={{
                maxHeight: addCompanyModalLayout.maxHeight,
                width: '100%',
                maxWidth: addCompanyModalLayout.maxWidth,
                alignSelf: 'center',
              }}
            >
              <AnimatedView animationType="slideDown" delay={0} duration={400}>
                <View className="px-6 pt-6 pb-4">
                  <View className="flex-row justify-between items-start mb-2">
                    <View className="flex-1 pr-4">
                      <View className="flex-row items-center mb-2">
                        <View
                          className={`h-10 w-10 rounded-2xl items-center justify-center mr-3 ${
                            isDark ? 'bg-blue-500/20' : 'bg-blue-100'
                          }`}
                        >
                          <Text className="text-xl">🏢</Text>
                        </View>
                        <View className="flex-1">
                          <Text
                            className={`text-2xl font-bold ${
                              isDark ? 'text-white' : 'text-gray-900'
                            }`}
                          >
                            Nueva empresa
                          </Text>
                          <Text
                            className={`text-sm mt-0.5 ${
                              isDark ? 'text-gray-400' : 'text-gray-500'
                            }`}
                          >
                            Crea una empresa para generar recordatorios
                            automáticos
                          </Text>
                        </View>
                      </View>
                    </View>
                    <TouchableOpacity
                      onPress={resetAddCompanyForm}
                      disabled={creating}
                      className={`h-10 w-10 rounded-xl items-center justify-center ${
                        isDark ? 'bg-gray-800' : 'bg-gray-100'
                      }`}
                    >
                      <Text className="text-lg">✕</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </AnimatedView>

              <ScrollView
                style={{ maxHeight: addCompanyModalLayout.contentMaxHeight }}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: responsive.spacing.lg }}
              >
                <View
                  className="space-y-6"
                  style={{ paddingHorizontal: responsive.spacing.lg }}
                >
                  <AnimatedView
                    animationType="fadeIn"
                    delay={100}
                    duration={400}
                  >
                    <View
                      className={`rounded-3xl p-5 border ${
                        isDark
                          ? 'bg-gray-800/50 border-gray-700'
                          : 'bg-gray-50 border-gray-200'
                      }`}
                    >
                      <Text
                        className={`text-base font-bold mb-4 ${
                          isDark ? 'text-white' : 'text-gray-900'
                        }`}
                      >
                        📝 Información de la empresa
                      </Text>

                      <View className="mb-4">
                        <Text
                          className={`text-sm font-semibold mb-2 ${
                            isDark ? 'text-gray-200' : 'text-gray-700'
                          }`}
                        >
                          Nombre comercial
                          <Text className="text-red-500"> *</Text>
                        </Text>
                        <TextInput
                          className={`border-2 rounded-2xl px-4 py-3.5 ${
                            isDark
                              ? 'bg-gray-900 border-gray-600 text-white'
                              : 'bg-white border-gray-300 text-gray-900'
                          }`}
                          placeholder="Ej: Mi Empresa S.A.S."
                          placeholderTextColor={
                            isDark ? '#6b7280' : '#9ca3af'
                          }
                          value={newCompanyName}
                          onChangeText={setNewCompanyName}
                        />
                      </View>

                      <View>
                        <Text
                          className={`text-sm font-semibold mb-2 ${
                            isDark ? 'text-gray-200' : 'text-gray-700'
                          }`}
                        >
                          NIT
                          <Text className="text-red-500"> *</Text>
                        </Text>
                        <TextInput
                          className={`border-2 rounded-2xl px-4 py-3.5 ${
                            isDark
                              ? 'bg-gray-900 border-gray-600 text-white'
                              : 'bg-white border-gray-300 text-gray-900'
                          }`}
                          placeholder="Ej: 900123456-7"
                          placeholderTextColor={
                            isDark ? '#6b7280' : '#9ca3af'
                          }
                          value={newCompanyNit}
                          onChangeText={setNewCompanyNit}
                          keyboardType="number-pad"
                        />
                      </View>
                    </View>
                  </AnimatedView>

                  <AnimatedView
                    animationType="fadeIn"
                    delay={200}
                    duration={400}
                  >
                    <View
                      className={`rounded-3xl p-5 border ${
                        isDark
                          ? 'bg-blue-900/20 border-blue-800/40'
                          : 'bg-blue-50 border-blue-100'
                      }`}
                    >
                      <Text
                        className={`text-base font-bold mb-2 ${
                          isDark ? 'text-blue-100' : 'text-blue-800'
                        }`}
                      >
                        💡 Recordatorios inteligentes
                      </Text>
                      <Text
                        className={`text-sm ${
                          isDark ? 'text-blue-100/80' : 'text-blue-800'
                        }`}
                      >
                        Al guardar la empresa, generaremos automáticamente los
                        recordatorios fiscales según los calendarios DIAN. Luego
                        podrás personalizarlos.
                      </Text>
                    </View>
                  </AnimatedView>

                  <AnimatedView
                    animationType="fadeIn"
                    delay={300}
                    duration={400}
                  >
                    <View className="pt-2 pb-6">
                      <AnimatedButton
                        onPress={handleAddCompany}
                        disabled={creating || !isAddCompanyFormValid}
                      >
                        <View
                          className={`py-4 rounded-2xl ${
                            creating || !isAddCompanyFormValid
                              ? 'bg-blue-400/70'
                              : 'bg-blue-600'
                          } shadow-lg`}
                        >
                          {creating ? (
                            <ActivityIndicator color="#ffffff" />
                          ) : (
                            <Text className="text-white text-center font-bold text-base">
                              ✨ Crear empresa
                            </Text>
                          )}
                        </View>
                      </AnimatedButton>

                      <TouchableOpacity
                        onPress={resetAddCompanyForm}
                        disabled={creating}
                        className="mt-3 py-3 rounded-2xl"
                        style={{
                          backgroundColor: isDark ? '#111827' : '#f3f4f6',
                        }}
                      >
                        <Text
                          className={`text-center font-semibold ${
                            isDark ? 'text-gray-200' : 'text-gray-700'
                          }`}
                        >
                          Cancelar
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </AnimatedView>
                </View>
              </ScrollView>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

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
