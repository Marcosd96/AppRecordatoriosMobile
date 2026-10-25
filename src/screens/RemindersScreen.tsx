import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { View, Text, FlatList, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { ReminderFilter } from '../types';
import { useReminders } from '../hooks/useReminders';
import { useCompleteReminder } from '../hooks/useCompleteReminder';
import { UserMessage } from '../hooks/actionResult';
import { highlightStyle, useHighlightItem } from '../hooks/useHighlightItem';
import { useTheme } from '../context/ThemeContext';
import { useResponsive } from '../hooks/useResponsive';
import { useListTransition } from '../hooks/useReducedMotion';
import StyledModal from '../components/StyledModal';
import FilterChips, { FilterChipOption } from '../components/FilterChips';
import LoadingScreen from '../components/LoadingScreen';
import ScreenHeader from '../components/ScreenHeader';
import ReminderCard from '../components/reminders/ReminderCard';
import {
  filterReminders,
  getReminderStats,
  summarizeReminders,
} from '../components/reminders/reminderFilters';
import EmptyState from '../components/EmptyState';
import ErrorState from '../components/ErrorState';
import SearchField from '../components/SearchField';
import Button from '../components/Button';
import { SearchIcon } from '../components/icons/ActionIcons';
import { CalendarIcon } from '../components/icons/TabIcons';
import { MainTabScreenProps } from '../navigation/types';

// Clave del chip "Todas las empresas" (en el estado se guarda como null)
const ALL_COMPANIES = '__all__';

export default function RemindersScreen({ route }: MainTabScreenProps<'Reminders'>) {
  const { isDark } = useTheme();
  const responsive = useResponsive();
  // Transición breve al cambiar de filtro
  const animateLayout = useListTransition();
  const {
    reminders,
    companies,
    loading,
    isReady,
    loadError,
    retrying,
    retry,
    refreshing,
    onRefresh,
    togglingIds,
    toggleReminder,
  } = useReminders();
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
  const [filter, setFilter] = useState<ReminderFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  // El mensaje se conserva al cerrar para que no se vacíe durante la animación de salida
  const [errorMessage, setErrorMessage] = useState<UserMessage>({ title: '', message: '' });
  const [showErrorModal, setShowErrorModal] = useState(false);

  // Al abrir desde una notificación: quitar filtros, ir hasta el recordatorio y resaltarlo
  const highlightReminderId: string | undefined = route?.params?.reminderId;
  const highlightAt: number | undefined = route?.params?.highlightAt;
  useEffect(() => {
    if (highlightReminderId && highlightAt) {
      setFilter('all');
      setSelectedCompanyId(null);
      setSearchQuery('');
    }
  }, [highlightReminderId, highlightAt]);

  // Filtros que llegan como parámetros (desde Inicio o Empresas), también al volver a la pestaña
  useFocusEffect(
    useCallback(() => {
      if (route?.params?.companyId) {
        setSelectedCompanyId(route.params.companyId);
      }
      if (route?.params?.filter) {
        setFilter(route.params.filter);
      }
    }, [route?.params?.companyId, route?.params?.filter]),
  );

  const filteredReminders = useMemo(
    () => filterReminders(reminders, { filter, companyId: selectedCompanyId, search: searchQuery }),
    [reminders, filter, selectedCompanyId, searchQuery],
  );
  const stats = useMemo(() => getReminderStats(reminders), [reminders]);

  const { listRef, highlightedId, onScrollToIndexFailed } = useHighlightItem(
    highlightReminderId,
    highlightAt,
    isReady,
    filteredReminders,
  );

  const showError = useCallback((message: UserMessage) => {
    setErrorMessage(message);
    setShowErrorModal(true);
  }, []);

  const handleToggle = useCompleteReminder(reminders, toggleReminder, showError);

  if (loading) {
    return <LoadingScreen isDark={isDark} message="Cargando recordatorios..." />;
  }

  const selectFilter = (next: ReminderFilter) => {
    animateLayout();
    setFilter(next);
  };

  const selectCompany = (next: string) => {
    animateLayout();
    setSelectedCompanyId(next === ALL_COMPANIES ? null : next);
  };

  const statusOptions: FilterChipOption<ReminderFilter>[] = [
    { key: 'all', label: 'Todos', count: stats.total },
    { key: 'pending', label: 'Pendientes', count: stats.pending },
    { key: 'overdue', label: 'Vencidos', count: stats.overdue },
    { key: 'upcoming', label: 'Próximos 30 días', count: stats.upcoming },
  ];

  const companyOptions: FilterChipOption<string>[] = [
    { key: ALL_COMPANIES, label: 'Todas las empresas' },
    ...companies.map(company => ({ key: company.id, label: company.name })),
  ];

  const hasActiveFilters =
    filter !== 'all' || selectedCompanyId !== null || searchQuery.trim() !== '';

  const clearFilters = () => {
    animateLayout();
    setFilter('all');
    setSelectedCompanyId(null);
    setSearchQuery('');
  };

  return (
    <SafeAreaView
      className={`flex-1 ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}
      edges={['top']}
    >
      <ScreenHeader
        isDark={isDark}
        title="Recordatorios"
        subtitle={summarizeReminders(stats)}
      />

      <FlatList
        ref={listRef}
        className="flex-1"
        data={filteredReminders}
        keyExtractor={reminder => reminder.id}
        extraData={togglingIds}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={{ paddingBottom: responsive.spacing.xl }}
        onScrollToIndexFailed={onScrollToIndexFailed}
        // Búsqueda y filtros. Es un elemento, no un componente: así el buscador no pierde el foco
        ListHeaderComponent={
          <View
            style={{
              paddingHorizontal: responsive.spacing.lg,
              paddingTop: responsive.spacing.md,
              // Mismo espacio que había entre los filtros y la lista
              paddingBottom: responsive.spacing.md,
            }}
          >
            <SearchField
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Buscar por descripción o empresa"
              accessibilityLabel="Buscar recordatorios"
            />

            <View style={{ marginTop: responsive.spacing.sm }}>
              <FilterChips
                isDark={isDark}
                options={statusOptions}
                selected={filter}
                onSelect={selectFilter}
              />
            </View>
            {(companies.length > 1 || selectedCompanyId !== null) && (
              <View style={{ marginTop: responsive.spacing.xs }}>
                <FilterChips
                  isDark={isDark}
                  options={companyOptions}
                  selected={selectedCompanyId ?? ALL_COMPANIES}
                  onSelect={selectCompany}
                />
              </View>
            )}

            <View
              className="flex-row items-center justify-between"
              style={{ marginTop: responsive.spacing.sm }}
            >
              <Text
                className={isDark ? 'text-gray-400' : 'text-gray-500'}
                style={{ fontSize: responsive.fontSize.sm }}
              >
                {filteredReminders.length} de {reminders.length} recordatorio
                {reminders.length === 1 ? '' : 's'}
              </Text>
              {hasActiveFilters && (
                <Button label="Limpiar filtros" onPress={clearFilters} variant="text" />
              )}
            </View>
          </View>
        }
        renderItem={({ item: reminder }) => (
          <View style={{ paddingHorizontal: responsive.spacing.lg }}>
            <ReminderCard
              reminder={reminder}
              isDark={isDark}
              busy={togglingIds.has(reminder.id)}
              onToggleStatus={handleToggle}
              style={highlightedId === reminder.id ? highlightStyle : undefined}
            />
          </View>
        )}
        ListEmptyComponent={
          <View style={{ paddingHorizontal: responsive.spacing.lg }}>
            {loadError ? (
              <ErrorState
                message={loadError}
                onRetry={retry}
                retrying={retrying}
              />
            ) : (
              <EmptyState
                isDark={isDark}
                renderIcon={color =>
                  reminders.length === 0 ? <CalendarIcon color={color} size={28} /> : <SearchIcon color={color} size={28} />
                }
                title={
                  reminders.length === 0
                    ? 'Aún no hay recordatorios'
                    : 'No hay recordatorios con estos filtros'
                }
                message={
                  reminders.length > 0
                    ? 'Prueba con otra búsqueda o quita los filtros.'
                    : companies.length > 0
                      ? 'Tus empresas aún no tienen recordatorios. Revisa sus calendarios en Empresas.'
                      : 'Agrega empresas para generar sus recordatorios fiscales.'
                }
                actionLabel={hasActiveFilters ? 'Limpiar filtros' : undefined}
                onAction={clearFilters}
              />
            )}
          </View>
        }
      />

      {/* Modal de error */}
      <StyledModal
        visible={showErrorModal}
        onClose={() => setShowErrorModal(false)}
        title={errorMessage.title}
        message={errorMessage.message}
        buttons={[
          {
            text: 'Entendido',
            onPress: () => setShowErrorModal(false),
          },
        ]}
      />
    </SafeAreaView>
  );
}
