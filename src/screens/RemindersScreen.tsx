import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  TextInput,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useQueryClient } from '@tanstack/react-query';
import { Reminder, ReminderFilter, SortBy } from '../types';
import { remindersService } from '../services/remindersService';

import { queryKeys } from '../config/queryClient';
import { useCompaniesQuery, useRefetchOnFocus, useRemindersQuery } from '../hooks/queries';
import { highlightStyle, useHighlightItem } from '../hooks/useHighlightItem';
import { useTheme } from '../context/ThemeContext';
import { useResponsive } from '../hooks/useResponsive';
import StyledModal from '../components/StyledModal';
import AnimatedButton from '../components/AnimatedButton';
import FilterChips, { FilterChipOption } from '../components/FilterChips';
import LoadingScreen from '../components/LoadingScreen';
import ScreenHeader from '../components/ScreenHeader';
import ReminderCard from '../components/reminders/ReminderCard';

// Clave del chip "Todas las empresas" (en el estado se guarda como null)
const ALL_COMPANIES = '__all__';

// Habilitar animaciones de layout en Android
if (
  Platform.OS === 'android' &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function RemindersScreen({ route }: any) {
  const { isDark } = useTheme();
  const responsive = useResponsive();
    const queryClient = useQueryClient();
  const remindersQuery = useRemindersQuery();
  const companiesQuery = useCompaniesQuery();
  const reminders = useMemo(() => remindersQuery.data ?? [], [remindersQuery.data]);
  const companies = companiesQuery.data ?? [];
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(
    null,
  );
  const [filter, setFilter] = useState<ReminderFilter>('all');
  const [sortBy] = useState<SortBy>('date');
    const [refreshing, setRefreshing] = useState(false);
  // Solo se muestra la pantalla de carga si no hay nada guardado y se está pidiendo
  const loading = remindersQuery.isPending && remindersQuery.fetchStatus === 'fetching';
  const [searchQuery, setSearchQuery] = useState('');
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState({ title: '', message: '' });

  // Función para animar los cambios de layout
  const animateLayout = () => {
    LayoutAnimation.configureNext(
      LayoutAnimation.create(
        250, // duración en ms
        LayoutAnimation.Types.easeInEaseOut,
        LayoutAnimation.Properties.opacity,
      ),
    );
  };

  useRefetchOnFocus([remindersQuery, companiesQuery]);

  // Avisar del error solo si no hay datos guardados que mostrar
  const loadError = remindersQuery.error ?? companiesQuery.error;
  const hasData = remindersQuery.data !== undefined;
  const lastReportedError = useRef<unknown>(null);
  useEffect(() => {
    if (loadError && !hasData && lastReportedError.current !== loadError) {
      lastReportedError.current = loadError;
      console.error('Error al cargar datos:', loadError);
      setErrorMessage({
        title: 'Error',
        message:
          (loadError as Error).message ||
          'No se pudieron cargar los datos. Verifica tu conexión.',
      });
      setShowErrorModal(true);
    }
  }, [loadError, hasData]);

  

  // Al abrir desde una notificación: quitar filtros, ir hasta el recordatorio y resaltarlo
  const highlightReminderId: string | undefined = route?.params?.reminderId;
  const highlightAt: number | undefined = route?.params?.highlightAt;
  const { scrollRef, registerItem, highlightedId } = useHighlightItem(
    highlightReminderId,
    highlightAt,
    remindersQuery.data !== undefined,
  );
  useEffect(() => {
    if (highlightReminderId && highlightAt) {
      setFilter('all');
      setSelectedCompanyId(null);
      setSearchQuery('');
    }
  }, [highlightReminderId, highlightAt]);

  // Actualizar selectedCompanyId y filter cuando cambian los parámetros de ruta
  useEffect(() => {
    if (route?.params?.companyId) {
      setSelectedCompanyId(route.params.companyId);
    }
    if (route?.params?.filter) {
      setFilter(route.params.filter);
    }
  }, [route?.params?.companyId, route?.params?.filter]);

  // Recargar datos cuando la pantalla recibe el foco
  useFocusEffect(
    React.useCallback(() => {
      // Si hay params, establecer el filtro
      if (route?.params?.companyId) {
        setSelectedCompanyId(route.params.companyId);
      }
      if (route?.params?.filter) {
        setFilter(route.params.filter);
      }
      
    }, [route?.params?.companyId, route?.params?.filter]),
  );

    const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([remindersQuery.refetch(), companiesQuery.refetch()]);
    setRefreshing(false);
  };

  // Memoizar los recordatorios filtrados para evitar recalcular en cada render
  const filteredReminders = useMemo(
    () =>
      reminders
        .filter(r => {
          // Filtrar por empresa
          if (selectedCompanyId && r.companyId !== selectedCompanyId)
            return false;

          // Filtrar por estado
          if (filter === 'pending' && r.status !== 'pending') return false;
          if (filter === 'overdue' && r.status !== 'overdue') return false;
          if (filter === 'upcoming') {
            const dueDate = new Date(r.dueDate);
            const now = new Date();
            const next30Days = new Date(
              now.getTime() + 30 * 24 * 60 * 60 * 1000,
            );
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
        }),
    [reminders, selectedCompanyId, filter, sortBy, searchQuery],
  );

  const stats = {
    total: reminders.length,
    pending: reminders.filter(r => r.status === 'pending').length,
    overdue: reminders.filter(r => r.status === 'overdue').length,
    upcoming: reminders.filter(r => {
      const dueDate = new Date(r.dueDate);
      const now = new Date();
      const next30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      return r.status === 'pending' && dueDate >= now && dueDate <= next30Days;
    }).length,
  };

  // Memoizar la función para evitar recrearla en cada render
  const toggleReminderStatus = useCallback(
    async (id: string) => {
      const reminder = reminders.find(r => r.id === id);
      if (!reminder) return;

      try {
        const result = await remindersService.toggleStatus(id);
        // Al actualizar la caché, NotificationSync cancela o reprograma sus notificaciones
        queryClient.setQueryData<Reminder[]>(queryKeys.reminders, current =>
          (current ?? []).map(r => (r.id === id ? result.reminder : r)),
        );
        queryClient.invalidateQueries({ queryKey: queryKeys.dashboard });
      } catch (error: any) {
        console.error('Error al actualizar recordatorio:', error);
        setErrorMessage({
          title: 'Error',
          message: error.message || 'No se pudo actualizar el recordatorio',
        });
        setShowErrorModal(true);
      }
    },
    [reminders, queryClient],
  );


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
        subtitle={
          stats.overdue > 0
            ? `${stats.overdue} vencido${stats.overdue === 1 ? '' : 's'} · ${stats.pending} pendiente${stats.pending === 1 ? '' : 's'}`
            : 'Gestiona tus obligaciones fiscales'
        }
      />

      <ScrollView
        ref={scrollRef}
        className="flex-1"
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={{ paddingBottom: responsive.spacing.xl }}
      >
        {/* Búsqueda y filtros */}
        <View
          style={{
            paddingHorizontal: responsive.spacing.lg,
            paddingTop: responsive.spacing.md,
          }}
        >
          <TextInput
            className={`border rounded-xl ${
              isDark
                ? 'bg-gray-800 border-gray-700 text-white'
                : 'bg-white border-gray-200 text-gray-900'
            }`}
            style={{
              paddingHorizontal: responsive.spacing.md,
              paddingVertical: responsive.spacing.sm + 4,
              fontSize: responsive.fontSize.base,
            }}
            placeholder="Buscar por descripción o empresa"
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#9ca3af"
            returnKeyType="search"
            clearButtonMode="while-editing"
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
              <TouchableOpacity
                onPress={clearFilters}
                accessibilityRole="button"
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text
                  className="font-semibold text-blue-600"
                  style={{ fontSize: responsive.fontSize.sm }}
                >
                  Limpiar filtros
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Lista de recordatorios */}
        <View
          style={{
            paddingHorizontal: responsive.spacing.lg,
            paddingTop: responsive.spacing.md,
          }}
        >
          {filteredReminders.length === 0 ? (
            <View
              className={`rounded-2xl p-8 border items-center ${
                isDark
                  ? 'bg-gray-800 border-gray-700'
                  : 'bg-white border-gray-200'
              }`}
            >
              <Text className="text-4xl mb-3">🗂️</Text>
              <Text
                className={`text-base font-semibold text-center ${
                  isDark ? 'text-white' : 'text-gray-900'
                }`}
              >
                {reminders.length === 0
                  ? 'Aún no hay recordatorios'
                  : 'No hay recordatorios con estos filtros'}
              </Text>
              <Text
                className={`text-center mt-2 ${
                  isDark ? 'text-gray-400' : 'text-gray-500'
                }`}
              >
                {reminders.length === 0
                  ? 'Agrega empresas para generar sus recordatorios fiscales.'
                  : 'Prueba con otra búsqueda o quita los filtros.'}
              </Text>
              {hasActiveFilters && (
                <AnimatedButton onPress={clearFilters}>
                  <View className="mt-4 px-6 py-3 rounded-xl bg-blue-600">
                    <Text className="text-white font-semibold text-center">
                      Limpiar filtros
                    </Text>
                  </View>
                </AnimatedButton>
              )}
            </View>
          ) : (
            filteredReminders.map(reminder => (
              <View
                key={reminder.id}
                ref={registerItem(reminder.id)}
                collapsable={false}
              >
                <ReminderCard
                  reminder={reminder}
                  isDark={isDark}
                  disabled={loading}
                  onToggleStatus={toggleReminderStatus}
                  style={highlightedId === reminder.id ? highlightStyle : undefined}
                />
              </View>
            ))
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
