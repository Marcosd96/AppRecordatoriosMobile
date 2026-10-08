import React from 'react';
import { ScrollView, Text, TouchableOpacity } from 'react-native';

export interface FilterChipOption<K extends string> {
  key: K;
  label: string;
  count?: number;
}

interface FilterChipsProps<K extends string> {
  isDark: boolean;
  options: FilterChipOption<K>[];
  selected: K;
  onSelect: (key: K) => void;
}

/** Fila horizontal de filtros: la opción elegida se ve de un vistazo y se cambia con un toque */
export default function FilterChips<K extends string>({
  isDark,
  options,
  selected,
  onSelect,
}: FilterChipsProps<K>) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingVertical: 4 }}
    >
      {options.map(option => {
        const isSelected = option.key === selected;
        return (
          <TouchableOpacity
            key={option.key}
            onPress={() => onSelect(option.key)}
            accessibilityRole="button"
            accessibilityState={{ selected: isSelected }}
            hitSlop={{ top: 6, bottom: 6 }}
            className={`flex-row items-center px-4 py-2 mr-2 rounded-full border ${
              isSelected
                ? 'bg-blue-600 border-blue-600'
                : isDark
                ? 'bg-gray-800 border-gray-700'
                : 'bg-white border-gray-200'
            }`}
          >
            <Text
              className={`text-sm font-semibold ${
                isSelected ? 'text-white' : isDark ? 'text-gray-200' : 'text-gray-700'
              }`}
            >
              {option.label}
            </Text>
            {option.count !== undefined && (
              <Text
                className={`ml-1.5 text-xs font-semibold ${
                  isSelected ? 'text-blue-100' : isDark ? 'text-gray-400' : 'text-gray-400'
                }`}
              >
                {option.count}
              </Text>
            )}
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}
