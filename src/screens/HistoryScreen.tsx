import React, { useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { usePersonalTasksQuery, useRemindersQuery } from '../hooks/queries';
import { HISTORY_MONTHS, HistoryEntry, buildHistory } from '../components/history/historyStats';
import MonthlyChart, { LATE_COLOR, ON_TIME_COLOR } from '../components/history/MonthlyChart';
import EmptyState from '../components/EmptyState';
import LoadingScreen from '../components/LoadingScreen';
import { BackIcon, CheckIcon } from '../components/icons/ActionIcons';
import { RootStackScreenProps } from '../navigation/types';

const MAX_ENTRIES = 50;

const dayFormat = new Intl.DateTimeFormat('es-CO', { day: 'numeric', month: 'short' });
const monthFormat = new Intl.DateTimeFormat('es-CO', { month: 'long', year: 'numeric' });

function StatTile({ isDark, value, label }: { isDark: boolean; value: string; label: string }) {
  return (
    <View
      className={`flex-1 rounded-2xl p-3 border ${
        isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
      }`}
    >
      <Text className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{value}</Text>
      <Text className={`text-xs mt-0.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{label}</Text>
    </View>
  );
}

function EntryRow({ isDark, entry, onPress }: { isDark: boolean; entry: HistoryEntry; onPress: () => void }) {
  const badge =
    entry.onTime === undefined
      ? null
      : { label: entry.onTime ? 'A tiempo' : 'Tarde', color: entry.onTime ? ON_TIME_COLOR : LATE_COLOR };

  return (
    <TouchableOpacity
      onPress={onPress}
      accessibilityRole="button"
      className={`flex-row items-center p-3 rounded-xl mb-2 border ${
        isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
      }`}
    >
      <View className="flex-1">
        <Text className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`} numberOfLines={1}>
          {entry.title}
        </Text>
        <Text className={`text-xs mt-0.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} numberOfLines={1}>
          {entry.kind === 'task' ? 'Tarea' : entry.subtitle} · {dayFormat.format(entry.completedAt)}
        </Text>
      </View>
      {badge && (
        <View className="flex-row items-center ml-3">
          <View style={[styles.dot, { backgroundColor: badge.color }]} />
          <Text className={`text-xs ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>{badge.label}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

/**
 * Lo completado en los últimos meses: cumplimiento de los recordatorios y tareas hechas
 */
export default function HistoryScreen({ navigation }: RootStackScreenProps<'History'>) {
  const { isDark } = useTheme();
  const remindersQuery = useRemindersQuery();
  const tasksQuery = usePersonalTasksQuery();

  const history = useMemo(
    () => buildHistory(remindersQuery.data ?? [], tasksQuery.data ?? []),
    [remindersQuery.data, tasksQuery.data],
  );

  // Entradas agrupadas por mes, en el orden en que llegan (más reciente primero)
  const groups = useMemo(() => {
    const result: Array<{ title: string; entries: HistoryEntry[] }> = [];
    for (const entry of history.entries.slice(0, MAX_ENTRIES)) {
      const title = monthFormat.format(entry.completedAt);
      const last = result[result.length - 1];
      if (last?.title === title) {
        last.entries.push(entry);
      } else {
        result.push({ title, entries: [entry] });
      }
    }
    return result;
  }, [history.entries]);

  if (remindersQuery.isLoading || tasksQuery.isLoading) {
    return <LoadingScreen isDark={isDark} message="Cargando historial..." />;
  }

  const openEntry = (entry: HistoryEntry) =>
    navigation.navigate(
      'Main',
      entry.kind === 'reminder'
        ? { screen: 'Reminders', params: { reminderId: entry.id, highlightAt: Date.now() } }
        : { screen: 'PersonalTasks', params: { taskId: entry.id, highlightAt: Date.now() } },
    );

  const refreshing = remindersQuery.isRefetching || tasksQuery.isRefetching;
  const onRefresh = () => {
    remindersQuery.refetch();
    tasksQuery.refetch();
  };

  return (
    <SafeAreaView className={`flex-1 ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <View
        className={`flex-row items-center px-2 py-2 border-b ${
          isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'
        }`}
      >
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          accessibilityRole="button"
          accessibilityLabel="Volver"
          className="h-11 w-11 items-center justify-center rounded-full mr-1"
        >
          <BackIcon color={isDark ? '#f9fafb' : '#111827'} />
        </TouchableOpacity>
        <Text
          accessibilityRole="header"
          className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}
        >
          Historial
        </Text>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {history.entries.length === 0 ? (
          <EmptyState
            isDark={isDark}
            renderIcon={color => <CheckIcon color={color} />}
            title="Aún no hay nada completado"
            message={`Aquí verás los recordatorios y tareas que completes en los últimos ${HISTORY_MONTHS} meses.`}
          />
        ) : (
          <>
            <View className="flex-row" style={styles.tiles}>
              <StatTile isDark={isDark} value={String(history.remindersCompleted)} label="Recordatorios completados" />
              <StatTile
                isDark={isDark}
                value={history.onTimeRate === null ? '—' : `${history.onTimeRate}%`}
                label="A tiempo"
              />
              <StatTile isDark={isDark} value={String(history.taskCompletions)} label="Tareas completadas" />
            </View>

            <View
              className={`rounded-2xl p-4 border ${
                isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
              }`}
              style={styles.chartCard}
            >
              <Text className={`font-bold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Recordatorios completados por mes
              </Text>
              <MonthlyChart isDark={isDark} months={history.months} />
            </View>

            {groups.map(group => (
              <View key={group.title}>
                <Text className="text-xs font-bold mb-3 mt-2 uppercase tracking-wide text-gray-500">
                  {group.title}
                </Text>
                {group.entries.map(entry => (
                  <EntryRow
                    key={`${entry.kind}-${entry.id}-${entry.completedAt.getTime()}`}
                    isDark={isDark}
                    entry={entry}
                    onPress={() => openEntry(entry)}
                  />
                ))}
              </View>
            ))}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, paddingBottom: 32 },
  tiles: { gap: 8, marginBottom: 12 },
  chartCard: { marginBottom: 16 },
  dot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
});
