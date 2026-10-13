import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { useCompaniesQuery, usePersonalTasksQuery, useRemindersQuery } from '../hooks/queries';
import { searchAll } from '../components/search/globalSearch';
import { formatDaysLabel, getDaysUntil } from '../components/dashboard/dashboardFormat';
import EmptyState from '../components/EmptyState';
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

interface ResultRowProps {
  isDark: boolean;
  title: string;
  subtitle?: string;
  detail?: string;
  onPress: () => void;
}

function ResultRow({ isDark, title, subtitle, detail, onPress }: ResultRowProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      accessibilityRole="button"
      className={`flex-row items-center p-4 rounded-2xl mb-2 border ${
        isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
      }`}
    >
      <View className="flex-1">
        <Text
          className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}
          numberOfLines={1}
        >
          {title}
        </Text>
        {subtitle ? (
          <Text
            className={`text-sm mt-0.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}
            numberOfLines={1}
          >
            {subtitle}
          </Text>
        ) : null}
      </View>
      {detail ? (
        <Text className={`text-xs ml-3 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
          {detail}
        </Text>
      ) : null}
    </TouchableOpacity>
  );
}

function GroupTitle({ title, count }: { title: string; count: number }) {
  return (
    <Text className="text-xs font-bold mb-3 mt-4 uppercase tracking-wide text-gray-500">
      {title} ({count})
    </Text>
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
              <>
                <GroupTitle title="Recordatorios" count={results.reminders.length} />
                {results.reminders.map(reminder => (
                  <ResultRow
                    key={reminder.id}
                    isDark={isDark}
                    title={reminder.description}
                    subtitle={reminder.companyName}
                    detail={
                      reminder.status === 'completed'
                        ? 'Completado'
                        : formatDaysLabel(getDaysUntil(reminder.dueDate))
                    }
                    onPress={() =>
                      openTab({
                        screen: 'Reminders',
                        params: { reminderId: reminder.id, highlightAt: Date.now() },
                      })
                    }
                  />
                ))}
              </>
            )}

            {results.tasks.length > 0 && (
              <>
                <GroupTitle title="Tareas" count={results.tasks.length} />
                {results.tasks.map(task => (
                  <ResultRow
                    key={task.id}
                    isDark={isDark}
                    title={task.title}
                    subtitle={task.description || undefined}
                    detail={TASK_STATUS_LABELS[task.status]}
                    onPress={() =>
                      openTab({
                        screen: 'PersonalTasks',
                        params: { taskId: task.id, highlightAt: Date.now() },
                      })
                    }
                  />
                ))}
              </>
            )}

            {results.companies.length > 0 && (
              <>
                <GroupTitle title="Empresas" count={results.companies.length} />
                {results.companies.map(company => (
                  <ResultRow
                    key={company.id}
                    isDark={isDark}
                    title={company.name}
                    subtitle={`NIT ${company.nit}`}
                    detail="Ver recordatorios"
                    onPress={() => openTab({ screen: 'Reminders', params: { companyId: company.id } })}
                  />
                ))}
              </>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, paddingBottom: 32 },
});
