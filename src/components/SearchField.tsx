import React from 'react';
import { TextInput, View } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useThemeColors } from '../theme/colors';
import { useFocusRing } from '../hooks/useFocusRing';
import FocusRing from './FocusRing';
import IconButton from './IconButton';
import { CloseIcon, SearchIcon } from './icons/ActionIcons';

interface SearchFieldProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  accessibilityLabel: string;
  autoFocus?: boolean;
}

/** Campo de búsqueda con icono y botón para borrar; el mismo en todas las pantallas */
export default function SearchField({
  value,
  onChangeText,
  placeholder,
  accessibilityLabel,
  autoFocus,
}: SearchFieldProps) {
  const { isDark } = useTheme();
  const colors = useThemeColors();
  // El campo no tiene borde: sin el anillo no se ve que está activo (teclado o toque)
  const { focused, focusProps } = useFocusRing();

  return (
    <View
      className={`flex-row items-center rounded-xl pl-3 min-h-12 ${
        isDark ? 'bg-gray-800' : 'bg-gray-100'
      }`}
    >
      <SearchIcon color={colors.onSurfaceVariant} size={18} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.placeholder}
        autoFocus={autoFocus}
        autoCorrect={false}
        returnKeyType="search"
        accessibilityLabel={accessibilityLabel}
        {...focusProps}
        className={`flex-1 py-3 ml-2 text-base ${isDark ? 'text-white' : 'text-gray-900'}`}
      />
      {value ? (
        <IconButton
          accessibilityLabel="Borrar búsqueda"
          onPress={() => onChangeText('')}
          renderIcon={() => <CloseIcon color={colors.onSurfaceVariant} size={18} />}
        />
      ) : (
        // Mantiene el alto y evita que el texto salte al aparecer el botón
        <View className="w-3" />
      )}
      <FocusRing visible={focused} radius={12} />
    </View>
  );
}
