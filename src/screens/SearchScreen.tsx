import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { useCompaniesQuery, usePersonalTasksQuery, useRemindersQuery } from '../hooks/queries';
import { searchAll } from '../components/search/globalSearch';
import { formatDaysLabel, getDaysUntil } from '../components/dashboard/dashboardFormat';
import EmptyState from '../components/EmptyState';
import ListGroup from '../components/ListGroup';
import ListRow from '../components/ListRow';
import { SearchIcon } from '../components/icons/ActionIcons';
import StackHeader from '../components/StackHeader';
import SearchField from '../components/SearchField';
import { TaskStatus } from '../types';
import { NavigatorScreenParams } from '@react-navigation/native';
import { MainTabParamList, RootStackScreenProps } from '../navigation/types';

const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  active: 'Activa',
  paused: 'Pausada',
  completed: 'Completada',
  cancelled: 'Cancelada',
};

/** Estado del resultado a la derecha de la fila ("En 3 días", "Completada"…) */
function Detail({ isDark, text }: { isDark: boolean; text: string }) {
  return (
    <Text className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{text}</Text>
  );
}

/**
 * Búsqueda en recordatorios, tareas y empresas a la vez. Busca en los datos guardados,
 * así que también funciona sin conexión.
 */
export default function SearchScreen({ navigation }: RootStackScreenProps<'Search'>) {
  const { isDark } = useTheme();
  const [query, setQuery] = useState('');
  const { data: reminders } = useRemindersQuery();
  const { data: tasks } = usePersonalTasksQuery();
  const { data: companies } = useCompaniesQuery();

  const results = useMemo(
    () => searchAll(query, { reminders, tasks, companies }),
    [query, reminders, tasks, companies],
  );

  const openTab = (target: NavigatorScreenParams<MainTabParamList>) =>
    navigation.navigate('Main', target);

  const hasQuery = query.trim().length > 0;

  return (
    <SafeAreaView className={`flex-1 ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <StackHeader onBack={() => navigation.goBack()}>
        <SearchField
          value={query}
          onChangeText={setQuery}
          placeholder="Buscar recordatorios, tareas o empresas"
          accessibilityLabel="Buscar"
          autoFocus
        />
      </StackHeader>

      <ScrollView
        className="flex-1"
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
        {!hasQuery ? (
          <Text className={`text-sm text-center mt-6 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            Escribe parte de una descripción, una empresa, un NIT o el título de una tarea.
          </Text>
        ) : results.total === 0 ? (
          <EmptyState
            isDark={isDark}
            renderIcon={color => <SearchIcon color={color} />}
            title="Sin resultados"
            message={`No encontramos nada para "${query.trim()}".`}
          />
        ) : (
          <>
            {results.reminders.length > 0 && (
              <View style={styles.group}>
                <ListGroup title="Recordatorios" count={results.reminders.length}>
                  {results.reminders.map((reminder, index) => (
                    <ListRow
                      key={reminder.id}
                      divider={index > 0}
                      title={reminder.description}
                      subtitle={reminder.companyName}
                      trailing={
                        <Detail
                          isDark={isDark}
                          text={
                            reminder.status === 'completed'
                              ? 'Completado'
                              : formatDaysLabel(getDaysUntil(reminder.dueDate))
                          }
                        />
                      }
                      onPress={() =>
                        openTab({
                          screen: 'Reminders',
                          params: { reminderId: reminder.id, highlightAt: Date.now() },
                        })
                      }
                    />
                  ))}
                </ListGroup>
              </View>
            )}

            {results.tasks.length > 0 && (
              <View style={styles.group}>
                <ListGroup title="Tareas" count={results.tasks.length}>
                  {results.tasks.map((task, index) => (
                    <ListRow
                      key={task.id}
                      divider={index > 0}
                      title={task.title}
                      subtitle={task.description || undefined}
                      trailing={<Detail isDark={isDark} text={TASK_STATUS_LABELS[task.status]} />}
                      onPress={() =>
                        openTab({
                          screen: 'PersonalTasks',
                          params: { taskId: task.id, highlightAt: Date.now() },
                        })
                      }
                    />
                  ))}
                </ListGroup>
              </View>
            )}

            {results.companies.length > 0 && (
              <View style={styles.group}>
                <ListGroup title="Empresas" count={results.companies.length}>
                  {results.companies.map((company, index) => (
                    <ListRow
                      key={company.id}
                      divider={index > 0}
                      title={company.name}
                      subtitle={`NIT ${company.nit}`}
                      accessibilityHint="Abre sus recordatorios"
                      onPress={() =>
                        openTab({ screen: 'Reminders', params: { companyId: company.id } })
                      }
                    />
                  ))}
                </ListGroup>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, paddingBottom: 32 },
  group: { marginTop: 16 },
});
