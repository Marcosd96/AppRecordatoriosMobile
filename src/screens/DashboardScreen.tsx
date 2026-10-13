import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useResponsive } from '../hooks/useResponsive';
import { DashboardMessage, useDashboard } from '../hooks/useDashboard';
import AnimatedButton from '../components/AnimatedButton';
import StyledModal from '../components/StyledModal';
import LoadingScreen from '../components/LoadingScreen';
import ScreenHeader from '../components/ScreenHeader';
import ErrorState from '../components/ErrorState';
import { useSnackbar } from '../context/SnackbarContext';
import CompaniesSummaryCard from '../components/dashboard/CompaniesSummaryCard';
import DashboardStatsCard from '../components/dashboard/DashboardStatsCard';
import NotificationStatusCard from '../components/dashboard/NotificationStatusCard';
import UpcomingRemindersCard from '../components/dashboard/UpcomingRemindersCard';
import AppearanceCard from '../components/dashboard/AppearanceCard';
import HistorySummaryCard from '../components/dashboard/HistorySummaryCard';
import { buildHistory } from '../components/history/historyStats';
import { SearchIcon } from '../components/icons/ActionIcons';
import { usePersonalTasksQuery, useRemindersQuery } from '../hooks/queries';
import { MainTabScreenProps } from '../navigation/types';

export default function DashboardScreen({ navigation }: MainTabScreenProps<'Dashboard'>) {
  const { user, signOut } = useAuth();
  const { isDark } = useTheme();
  const responsive = useResponsive();
  const {
    upcomingReminders,
    stats,
    companiesCount,
    refreshing,
    loading,
    notificationStatus,
    onRefresh,
    sendTestNotification,
    loadError,
    retrying,
    retry,
  } = useDashboard();
  const { showSnackbar } = useSnackbar();
  const { data: reminders } = useRemindersQuery();
  const { data: tasks } = usePersonalTasksQuery();
  const history = useMemo(
    () => buildHistory(reminders ?? [], tasks ?? []),
    [reminders, tasks],
  );
  const [showSignOutModal, setShowSignOutModal] = useState(false);
  const [showTestNotificationModal, setShowTestNotificationModal] =
    useState(false);
  const [testNotificationMessage, setTestNotificationMessage] = useState<DashboardMessage>({
    title: '',
    message: '',
  });

  const handleTestNotification = async () => {
    const result = await sendTestNotification();
    if (result.ok) {
      showSnackbar({ message: result.message });
    } else {
      setTestNotificationMessage(result);
      setShowTestNotificationModal(true);
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
    return <LoadingScreen isDark={isDark} message="Cargando datos..." />;
  }

  const firstName = user?.name?.split(' ')[0];

  return (
    <SafeAreaView
      className={`flex-1 ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}
      edges={['top']}
    >
      <ScreenHeader
        isDark={isDark}
        title={firstName ? `Hola, ${firstName}` : 'Inicio'}
        subtitle="Resumen de tus recordatorios fiscales"
        right={
          <View className="flex-row items-center">
            <AnimatedButton
              onPress={() => navigation.navigate('Search')}
              accessibilityLabel="Buscar"
            >
              <View
                className={`rounded-xl border items-center justify-center ${
                  isDark ? 'border-gray-700' : 'border-gray-200'
                }`}
                style={{
                  padding: responsive.spacing.sm,
                  marginRight: responsive.spacing.sm,
                }}
              >
                <SearchIcon
                  color={isDark ? '#e5e7eb' : '#374151'}
                  size={responsive.fontSize.lg}
                />
              </View>
            </AnimatedButton>
            <AnimatedButton
              onPress={handleSignOut}
              accessibilityLabel="Cerrar sesión"
            >
              <View
                className={`rounded-xl border ${
                  isDark ? 'border-gray-700' : 'border-gray-200'
                }`}
                style={{
                  paddingHorizontal: responsive.spacing.md,
                  paddingVertical: responsive.spacing.sm,
                }}
              >
                <Text
                  className={`font-semibold ${
                    isDark ? 'text-gray-200' : 'text-gray-700'
                  }`}
                  style={{ fontSize: responsive.fontSize.sm }}
                >
                  Salir
                </Text>
              </View>
            </AnimatedButton>
          </View>
        }
      />

      <ScrollView
        className="flex-1"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={{ paddingBottom: responsive.spacing.lg }}
      >
        {/* Sin datos del panel, las cifras serían ceros engañosos ("Todo al día") */}
        {loadError ? (
          <View style={{ paddingHorizontal: responsive.spacing.lg, paddingTop: responsive.spacing.md }}>
            <ErrorState message={loadError} onRetry={retry} retrying={retrying} />
          </View>
        ) : (
          <>
            <DashboardStatsCard
              isDark={isDark}
              stats={stats}
              onSelectFilter={filter => navigation.navigate('Reminders', { filter })}
            />

            <UpcomingRemindersCard
              isDark={isDark}
              reminders={upcomingReminders}
              onOpenReminders={() => navigation.navigate('Reminders')}
              onAddCompany={() => navigation.navigate('Companies')}
            />
          </>
        )}

        <NotificationStatusCard
          isDark={isDark}
          status={notificationStatus}
          onTestNotification={handleTestNotification}
          onOpenTroubleshooting={() => navigation.navigate('NotificationTroubleshooting')}
        />

        <HistorySummaryCard
          isDark={isDark}
          history={history}
          onOpenHistory={() => navigation.navigate('History')}
        />

        {!loadError && (
          <CompaniesSummaryCard
            isDark={isDark}
            companiesCount={companiesCount}
            onOpenCompanies={() => navigation.navigate('Companies')}
          />
        )}

        <AppearanceCard />
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
            text: 'Entendido',
            onPress: () => setShowTestNotificationModal(false),
          },
        ]}
      />
    </SafeAreaView>
  );
}
