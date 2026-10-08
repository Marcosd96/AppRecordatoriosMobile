import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import AnimatedButton from '../AnimatedButton';
import { StatusFilter } from './taskForm';

interface StatusFilterOption {
  key: StatusFilter;
  label: string;
  subtitle: string;
}

interface TaskFiltersProps {
  isDark: boolean;
  searchQuery: string;
  onChangeSearch: (query: string) => void;
  statusFilter: StatusFilter;
  statusOptions: StatusFilterOption[];
  onChangeStatus: (status: StatusFilter) => void;
  onCreate: () => void;
}

export default function TaskFilters({
  isDark,
  searchQuery,
  onChangeSearch,
  statusFilter,
  statusOptions,
  onChangeStatus,
  onCreate,
}: TaskFiltersProps) {
  return (
    <View
      className={`mt-6 rounded-3xl p-4 border ${
        isDark
          ? 'border-gray-700 bg-gray-800/80'
          : 'border-gray-200 bg-white'
      }`}
    >
      <Text
        className={`text-sm font-semibold mb-2 ${
          isDark ? 'text-gray-100' : 'text-gray-800'
        }`}
      >
        Búsqueda rápida
      </Text>
      <TextInput
        className={`border rounded-2xl px-4 py-3 ${
          isDark
            ? 'bg-gray-900 border-gray-700 text-white'
            : 'bg-gray-50 border-gray-200 text-gray-900'
        }`}
        placeholder="Buscar por título o descripción"
        placeholderTextColor="#9ca3af"
        value={searchQuery}
        onChangeText={onChangeSearch}
      />

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingVertical: 12 }}
      >
        {statusOptions.map(status => (
          <TouchableOpacity
            key={status.key}
            onPress={() => onChangeStatus(status.key)}
            className={`px-4 py-2 mr-3 rounded-2xl border ${
              statusFilter === status.key
                ? 'bg-blue-600 border-blue-600'
                : isDark
                ? 'bg-gray-900 border-gray-700'
                : 'bg-white border-gray-200'
            }`}
          >
            <Text
              className={`text-sm font-semibold ${
                statusFilter === status.key
                  ? 'text-white'
                  : isDark
                  ? 'text-gray-100'
                  : 'text-gray-800'
              }`}
            >
              {status.label}
            </Text>
            <Text
              className={`text-xs mt-0.5 ${
                statusFilter === status.key
                  ? 'text-white/80'
                  : isDark
                  ? 'text-gray-400'
                  : 'text-gray-500'
              }`}
            >
              {status.subtitle}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <AnimatedButton onPress={onCreate}>
        <View className="bg-blue-600 py-3 rounded-2xl">
          <Text className="text-white text-center font-semibold">
            + Nueva tarea
          </Text>
        </View>
      </AnimatedButton>
    </View>
  );
}
