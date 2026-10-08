import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Company } from '../types';
import { useTheme } from '../context/ThemeContext';
import { useResponsive } from '../hooks/useResponsive';
import { CompaniesMessage, useCompanies } from '../hooks/useCompanies';
import StyledModal from '../components/StyledModal';
import CalendarSelector from '../components/CalendarSelector';
import AddCompanyModal from '../components/companies/AddCompanyModal';
import CompanyCard from '../components/companies/CompanyCard';
import { getCompanyStats } from '../components/companies/companyStats';
import { CalendarType } from '../config/calendarTypes';

export default function CompaniesScreen({ navigation }: any) {
  const { isDark } = useTheme();
  const responsive = useResponsive();
  const [showAddForm, setShowAddForm] = useState(false);
  const [companyToDelete, setCompanyToDelete] = useState<string | null>(null);
  // El mensaje se conserva al cerrar para que no se vacíe durante la animación de salida
  const [modalMessage, setModalMessage] = useState<CompaniesMessage>({ title: '', message: '' });
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [selectedCompanyForCalendars, setSelectedCompanyForCalendars] =
    useState<Company | null>(null);
  const [showCalendarSelector, setShowCalendarSelector] = useState(false);

  const showMessage = (message: CompaniesMessage) => {
    setModalMessage(message);
    setShowMessageModal(true);
  };

  const {
    companies,
    reminders,
    loading,
    refreshing,
    creating,
    availableCalendars,
    onRefresh,
    createCompany,
    deleteCompany,
    saveCalendars,
  } = useCompanies(showMessage);

  const handleAddCompany = async (name: string, nit: string) => {
    if (!name || !nit) {
      showMessage({ title: 'Error', message: 'Por favor completa todos los campos' });
      return false;
    }

    const { created, message } = await createCompany(name, nit);
    if (created) {
      setShowAddForm(false);
    }
    showMessage(message);
    return created;
  };

  const confirmDeleteCompany = async () => {
    if (!companyToDelete) return;
    const companyId = companyToDelete;
    setCompanyToDelete(null);
    showMessage(await deleteCompany(companyId));
  };

  const handleSaveCalendars = async (selectedCalendars: CalendarType[]) => {
    if (!selectedCompanyForCalendars) return;
    showMessage(await saveCalendars(selectedCompanyForCalendars, selectedCalendars));
  };

  const openCalendars = (company: Company) => {
    setSelectedCompanyForCalendars(company);
    setShowCalendarSelector(true);
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
              {companies.map(company => (
                <CompanyCard
                  key={company.id}
                  company={company}
                  stats={getCompanyStats(reminders, company.id)}
                  isDark={isDark}
                  onDelete={setCompanyToDelete}
                  onOpenCalendars={openCalendars}
                  onOpenReminders={companyId =>
                    navigation.navigate('Reminders', { companyId })
                  }
                />
              ))}
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

      <AddCompanyModal
        visible={showAddForm}
        isDark={isDark}
        creating={creating}
        onClose={() => setShowAddForm(false)}
        onSubmit={handleAddCompany}
      />

      {/* Modal de confirmación de eliminación */}
      <StyledModal
        visible={companyToDelete !== null}
        onClose={() => setCompanyToDelete(null)}
        title="Confirmar eliminación"
        message="¿Estás seguro de que deseas eliminar esta empresa? Se eliminarán todos sus recordatorios."
        buttons={[
          {
            text: 'Cancelar',
            style: 'cancel',
            onPress: () => setCompanyToDelete(null),
          },
          {
            text: 'Eliminar',
            style: 'destructive',
            onPress: confirmDeleteCompany,
          },
        ]}
      />

      {/* Modal de resultado (éxito o error) */}
      <StyledModal
        visible={showMessageModal}
        onClose={() => setShowMessageModal(false)}
        title={modalMessage.title}
        message={modalMessage.message}
        buttons={[
          {
            text: 'Aceptar',
            onPress: () => setShowMessageModal(false),
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
