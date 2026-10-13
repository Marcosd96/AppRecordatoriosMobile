import React from 'react';
import { View } from 'react-native';
import FilterChips, { FilterChipOption } from '../FilterChips';
import SearchField from '../SearchField';
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
    <View>
      <SearchField
        value={searchQuery}
        onChangeText={onChangeSearch}
        placeholder="Buscar por título o descripción"
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
