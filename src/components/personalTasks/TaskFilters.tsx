import React from 'react';
import { View, TextInput } from 'react-native';
import FilterChips, { FilterChipOption } from '../FilterChips';
import { StatusFilter } from './taskForm';

interface TaskFiltersProps {
  isDark: boolean;
  searchQuery: string;
  onChangeSearch: (query: string) => void;
  statusFilter: StatusFilter;
  statusOptions: FilterChipOption<StatusFilter>[];
  onChangeStatus: (status: StatusFilter) => void;
}

export default function TaskFilters({
  isDark,
  searchQuery,
  onChangeSearch,
  statusFilter,
  statusOptions,
  onChangeStatus,
}: TaskFiltersProps) {
  return (
    <View className="mt-4">
      <TextInput
        className={`border rounded-xl px-4 py-3 ${
          isDark
            ? 'bg-gray-800 border-gray-700 text-white'
            : 'bg-white border-gray-200 text-gray-900'
        }`}
        placeholder="Buscar por título o descripción"
        placeholderTextColor="#9ca3af"
        value={searchQuery}
        onChangeText={onChangeSearch}
        returnKeyType="search"
        clearButtonMode="while-editing"
        accessibilityLabel="Buscar tareas"
      />

      <View className="mt-2">
        <FilterChips
          isDark={isDark}
          options={statusOptions}
          selected={statusFilter}
          onSelect={onChangeStatus}
        />
      </View>
    </View>
  );
}
