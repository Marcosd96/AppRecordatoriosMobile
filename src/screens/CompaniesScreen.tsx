import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Company } from '../types';
import { useTheme } from '../context/ThemeContext';
import { useResponsive } from '../hooks/useResponsive';
import { CompaniesMessage, useCompanies } from '../hooks/useCompanies';
import StyledModal from '../components/StyledModal';
import Button from '../components/Button';
import LoadingScreen from '../components/LoadingScreen';
import ScreenHeader from '../components/ScreenHeader';
import EmptyState from '../components/EmptyState';
import ErrorState from '../components/ErrorState';
import { useSnackbar } from '../context/SnackbarContext';
import { CompaniesIcon } from '../components/icons/TabIcons';
import CalendarSelector from '../components/CalendarSelector';
import AddCompanyModal from '../components/companies/AddCompanyModal';
import CompanyCard from '../components/companies/CompanyCard';
import { getCompanyStats } from '../components/companies/companyStats';
import { CalendarType } from '../config/calendarTypes';
import { MainTabScreenProps } from '../navigation/types';

export default function CompaniesScreen({ navigation }: MainTabScreenProps<'Companies'>) {
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
    loadError,
    retrying,
    retry,
  } = useCompanies();
  const { showSnackbar } = useSnackbar();

  const handleAddCompany = async (name: string, nit: string) => {
    if (!name || !nit) {
      showMessage({ title: 'Faltan datos', message: 'Escribe el nombre y el NIT de la empresa.' });
      return false;
    }

    const { created, message } = await createCompany(name, nit);
    if (created) {
      setShowAddForm(false);
      showSnackbar({ message: message.message });
    } else {
      showMessage(message);
    }
    return created;
  };

  const confirmDeleteCompany = async () => {
    if (!companyToDelete) return;
    const companyId = companyToDelete;
    setCompanyToDelete(null);
    const { ok, message } = await deleteCompany(companyId);
    if (ok) {
      showSnackbar({ message: message.message });
    } else {
      showMessage(message);
    }
  };

  const handleSaveCalendars = async (selectedCalendars: CalendarType[]) => {
    if (!selectedCompanyForCalendars) return;
    // Si falla, saveCalendars lanza el error y el selector lo muestra sin cerrarse
    showSnackbar({ message: await saveCalendars(selectedCompanyForCalendars, selectedCalendars) });
  };

  const openCalendars = (company: Company) => {
    setSelectedCompanyForCalendars(company);
    setShowCalendarSelector(true);
  };

  if (loading) {
    return <LoadingScreen isDark={isDark} message="Cargando empresas..." />;
  }

  return (
    <SafeAreaView
      className={`flex-1 ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}
      edges={['top']}
    >
      <ScreenHeader
        isDark={isDark}
        title="Empresas"
        subtitle={
          companies.length > 0
            ? `${companies.length} cliente${companies.length === 1 ? '' : 's'}`
            : 'Gestiona tus clientes'
        }
        right={
          <Button label="Nueva empresa" onPress={() => setShowAddForm(true)} />
        }
      />

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
          {loadError ? (
            <ErrorState message={loadError} onRetry={retry} retrying={retrying} />
          ) : companies.length === 0 ? (
            <EmptyState
              isDark={isDark}
              renderIcon={color => <CompaniesIcon color={color} size={28} />}
              title="Aún no hay empresas"
              message="Agrega tu primera empresa y generaremos sus recordatorios fiscales según los calendarios de la DIAN."
              actionLabel="Agregar primera empresa"
              onAction={() => setShowAddForm(true)}
            />
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

        {/* Información (en el estado vacío ya se explica) */}
        {companies.length > 0 && (
          <Text
            className={`text-center ${isDark ? 'text-gray-500' : 'text-gray-400'}`}
            style={{
              marginHorizontal: responsive.spacing.xl,
              marginBottom: responsive.spacing.md,
              fontSize: responsive.fontSize.xs,
              lineHeight: responsive.fontSize.xs * 1.5,
            }}
          >
            Los recordatorios se generan automáticamente según los calendarios
            de la DIAN. Ajusta los de cada empresa con «Calendarios».
          </Text>
        )}
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
            text: 'Entendido',
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
