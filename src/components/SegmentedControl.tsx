import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

export interface SegmentOption<K extends string> {
  key: K;
  label: string;
  /** Clases de la opción activa; por defecto, azul */
  activeClass?: string;
}

/** Control segmentado: una opción activa entre varias, todas visibles */
export default function SegmentedControl<K extends string>({
  isDark,
  options,
  selected,
  onSelect,
}: {
  isDark: boolean;
  options: SegmentOption<K>[];
  selected: K | undefined;
  onSelect: (key: K) => void;
}) {
  return (
    <View className="flex-row gap-2">
      {options.map(option => {
        const isActive = option.key === selected;
        return (
          <TouchableOpacity
            key={option.key}
            onPress={() => onSelect(option.key)}
            accessibilityRole="button"
            accessibilityState={{ selected: isActive }}
            className={`flex-1 py-2.5 rounded-xl border ${
              isActive
                ? option.activeClass ?? 'bg-blue-600 border-blue-600'
                : isDark
                ? 'bg-gray-800 border-gray-700'
                : 'bg-white border-gray-200'
            }`}
          >
            <Text
              className={`text-sm font-semibold text-center ${
                isActive ? 'text-white' : isDark ? 'text-gray-200' : 'text-gray-700'
              }`}
              numberOfLines={1}
              adjustsFontSizeToFit
            >
              {option.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
