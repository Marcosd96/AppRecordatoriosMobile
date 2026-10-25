import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { useThemeColors } from '../theme/colors';
import { useFocusRing } from '../hooks/useFocusRing';
import FocusRing from './FocusRing';

export interface SegmentOption<K extends string> {
  key: K;
  label: string;
  /** Clases de la opción activa; por defecto, azul */
  activeClass?: string;
}

function Segment<K extends string>({
  isDark,
  option,
  isActive,
  onSelect,
}: {
  isDark: boolean;
  option: SegmentOption<K>;
  isActive: boolean;
  onSelect: (key: K) => void;
}) {
  const colors = useThemeColors();
  const { focused, focusProps } = useFocusRing();
  return (
    <Pressable
      onPress={() => onSelect(option.key)}
      accessibilityRole="button"
      accessibilityState={{ selected: isActive }}
      {...focusProps}
      android_ripple={{ color: isActive ? colors.rippleOnFilled : colors.ripple }}
      className={`flex-1 py-2.5 rounded-xl border overflow-hidden ${
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
      <FocusRing visible={focused} radius={12} onFilled={isActive} />
    </Pressable>
  );
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
      {options.map(option => (
        <Segment
          key={option.key}
          isDark={isDark}
          option={option}
          isActive={option.key === selected}
          onSelect={onSelect}
        />
      ))}
    </View>
  );
}
