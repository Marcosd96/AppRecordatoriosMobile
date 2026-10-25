import React, { useCallback, useState } from 'react';
import { View, Text, ScrollView, RefreshControl, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { useHome } from '../hooks/useHome';
import { useCompleteReminder } from '../hooks/useCompleteReminder';
import { useCompleteTask } from '../hooks/useCompleteTask';
import { UserMessage } from '../hooks/actionResult';
import Button from '../components/Button';
import EmptyState from '../components/EmptyState';
import ErrorState from '../components/ErrorState';
import IconButton from '../components/IconButton';
import ListRow from '../components/ListRow';
import LoadingScreen from '../components/LoadingScreen';
import ScreenHeader from '../components/ScreenHeader';
import StyledModal from '../components/StyledModal';
import ReminderCard from '../components/reminders/ReminderCard';
import { formatDaysLabel, getDaysUntil } from '../components/dashboard/dashboardFormat';
import { formatTaskDate, isTaskOverdue } from '../components/personalTasks/taskForm';
import { CompaniesIcon } from '../components/icons/TabIcons';
import { CheckIcon, SearchIcon, SettingsIcon } from '../components/icons/ActionIcons';
import { MainTabScreenProps } from '../navigation/types';
import { ReminderFilter } from '../types';

// Más elementos por sección convertirían Inicio en una copia de la pestaña
const MAX_PER_SECTION = 5;

function SectionHeader({
  title,
  count,
  actionLabel,
  onAction,
}: {
  title: string;
  /** Sin recuento cuando no aporta (p. ej. una sección que ya dice que no hay nada) */
  count?: number;
  actionLabel?: string;
  onAction?: () => void;
}) {
  const { isDark } = useTheme();
  return (
    <View className="flex-row items-center justify-between mb-2" style={styles.sectionHeader}>
      <Text
        accessibilityRole="header"
        className={`text-base font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}
      >
        {title}
        {count !== undefined ? (
          <Text className={isDark ? 'text-gray-400' : 'text-gray-500'}> · {count}</Text>
        ) : null}
      </Text>
      {actionLabel && onAction ? (
        <Button label={actionLabel} onPress={onAction} variant="text" />
      ) : null}
    </View>
  );
}

function ListGroup({ children }: { children: React.ReactNode }) {
  const { isDark } = useTheme();
  return (
    <View
      className={`rounded-2xl border overflow-hidden ${
        isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
      }`}
    >
      {children}
    </View>
  );
}

/**
 * Inicio responde "¿qué tengo que hacer?": lo vencido, lo que vence esta semana y las tareas
 * de hoy, con la acción de completar a mano. El resto (ajustes, historial) queda a un toque.
 */
export default function DashboardScreen({ navigation }: MainTabScreenProps<'Dashboard'>) {
  const { isDark } = useTheme();
  const {
    agenda,
    summary,
    hasCompanies,
    hasReminders,
    completedThisMonth,
    notificationsBlocked,
    loading,
    loadError,
    retrying,
    retry,
    refreshing,
    onRefresh,
    reminders,
    togglingIds,
    toggleReminder,
    busyTaskIds,
    completeTask,
  } = useHome();
  // El mensaje se conserva al cerrar para que no se vacíe durante la animación de salida
  const [errorMessage, setErrorMessage] = useState<UserMessage>({ title: '', message: '' });
  const [showError, setShowError] = useState(false);

  const onError = useCallback((message: UserMessage) => {
    setErrorMessage(message);
    setShowError(true);
  }, []);
  const handleToggle = useCompleteReminder(reminders, toggleReminder, onError);
  const handleCompleteTask = useCompleteTask(completeTask, onError);

  const openReminders = (filter: ReminderFilter) => navigation.navigate('Reminders', { filter });

  if (loading) {
    return <LoadingScreen isDark={isDark} message="Cargando..." />;
  }

  const { overdue, thisWeek, next, tasksToday } = agenda;
  const nothingDue = overdue.length === 0 && thisWeek.length === 0;

  const renderReminders = (items: typeof overdue) =>
    items.slice(0, MAX_PER_SECTION).map(reminder => (
      <ReminderCard
        key={reminder.id}
        reminder={reminder}
        isDark={isDark}
        busy={togglingIds.has(reminder.id)}
        onToggleStatus={handleToggle}
      />
    ));

  return (
    <SafeAreaView className={`flex-1 ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`} edges={['top']}>
      <ScreenHeader
        isDark={isDark}
        title="Inicio"
        subtitle={loadError ? undefined : summary}
        right={
          <View className="flex-row">
            <IconButton
              accessibilityLabel="Buscar"
              onPress={() => navigation.navigate('Search')}
              renderIcon={color => <SearchIcon color={color} size={22} />}
            />
            <IconButton
              accessibilityLabel="Ajustes"
              onPress={() => navigation.navigate('Settings')}
              renderIcon={color => <SettingsIcon color={color} />}
            />
          </View>
        }
      />

      <ScrollView
        className="flex-1"
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Solo se avisa si hay un problema: sin permiso no llega ningún recordatorio */}
        {notificationsBlocked && (
          <View
            className={`flex-row items-center rounded-xl pl-4 pr-1 py-1 mb-6 ${
              isDark ? 'bg-red-500/15' : 'bg-red-50'
            }`}
            accessibilityLiveRegion="polite"
          >
            <Text className={`flex-1 text-sm py-2 ${isDark ? 'text-red-200' : 'text-red-800'}`}>
              Las notificaciones están desactivadas: no recibirás los recordatorios.
            </Text>
            <Button
              label="Activar"
              variant="text"
              onPress={() => navigation.navigate('NotificationTroubleshooting')}
            />
          </View>
        )}

        {loadError ? (
          <ErrorState message={loadError} onRetry={retry} retrying={retrying} />
        ) : !hasCompanies && !hasReminders ? (
          <EmptyState
            isDark={isDark}
            renderIcon={color => <CompaniesIcon color={color} size={28} />}
            title="Agrega tu primera empresa"
            message="Generaremos sus recordatorios fiscales según los calendarios de la DIAN."
            actionLabel="Agregar empresa"
            onAction={() => navigation.navigate('Companies')}
          />
        ) : (
          <>
            {overdue.length > 0 && (
              <View style={styles.section}>
                <SectionHeader
                  title="Vencidos"
                  count={overdue.length}
                  actionLabel={overdue.length > MAX_PER_SECTION ? 'Ver todos' : undefined}
                  onAction={() => openReminders('overdue')}
                />
                {renderReminders(overdue)}
              </View>
            )}

            {thisWeek.length > 0 && (
              <View style={styles.section}>
                <SectionHeader
                  title="Esta semana"
                  count={thisWeek.length}
                  actionLabel="Próximos 30 días"
                  onAction={() => openReminders('upcoming')}
                />
                {renderReminders(thisWeek)}
              </View>
            )}

            {nothingDue && (
              <View style={styles.section}>
                <SectionHeader title="Recordatorios" />
                <ListGroup>
                  <ListRow
                    title="Nada vence esta semana"
                    subtitle={
                      next
                        ? `Lo próximo: ${next.description} · ${next.companyName} · ${formatDaysLabel(
                            getDaysUntil(next.dueDate),
                          ).toLowerCase()}`
                        : 'No hay recordatorios pendientes.'
                    }
                    onPress={() => openReminders('all')}
                  />
                </ListGroup>
              </View>
            )}

            {tasksToday.length > 0 && (
              <View style={styles.section}>
                <SectionHeader
                  title="Tareas para hoy"
                  count={tasksToday.length}
                  actionLabel="Ver tareas"
                  onAction={() => navigation.navigate('PersonalTasks')}
                />
                <ListGroup>
                  {tasksToday.slice(0, MAX_PER_SECTION).map((task, index) => {
                    const date = formatTaskDate(task.nextOccurrence || task.startDate);
                    const busy = busyTaskIds.has(task.id);
                    return (
                      <ListRow
                        key={task.id}
                        divider={index > 0}
                        title={task.title}
                        subtitle={isTaskOverdue(task) ? `Atrasada · debía hacerse el ${date}` : date}
                        onPress={() =>
                          navigation.navigate('PersonalTasks', {
                            taskId: task.id,
                            highlightAt: Date.now(),
                          })
                        }
                        accessibilityHint="Abre la tarea en Tareas"
                        accessibilityActions={[{ name: 'complete', label: 'Completar' }]}
                        onAccessibilityAction={({ nativeEvent }) => {
                          if (nativeEvent.actionName === 'complete' && !busy) {
                            handleCompleteTask(task);
                          }
                        }}
                        // Igual que en los recordatorios: completar sin salir de Inicio
                        trailing={
                          <Button
                            label="Completar"
                            onPress={() => handleCompleteTask(task)}
                            variant="tonal"
                            renderIcon={color => <CheckIcon color={color} size={16} />}
                            busy={busy}
                            accessibilityLabel={`Completar ${task.title}`}
                          />
                        }
                      />
                    );
                  })}
                </ListGroup>
              </View>
            )}

            <ListGroup>
              <ListRow
                title="Historial"
                subtitle={`${completedThisMonth} completado${completedThisMonth === 1 ? '' : 's'} este mes`}
                onPress={() => navigation.navigate('History')}
              />
            </ListGroup>
          </>
        )}
      </ScrollView>

      <StyledModal
        visible={showError}
        onClose={() => setShowError(false)}
        title={errorMessage.title}
        message={errorMessage.message}
        buttons={[{ text: 'Entendido', onPress: () => setShowError(false) }]}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 24, paddingTop: 16, paddingBottom: 32 },
  section: { marginBottom: 24 },
  sectionHeader: { minHeight: 40 },
});
