import React from 'react';
import { Text, View } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import IconButton from './IconButton';
import { BackIcon } from './icons/ActionIcons';

interface StackHeaderProps {
  title?: string;
  onBack: () => void;
  /** Sustituye al título (p. ej. el campo de la búsqueda global) */
  children?: React.ReactNode;
  /** Acción opcional a la derecha */
  right?: React.ReactNode;
}

/** Cabecera de las pantallas del stack: botón Atrás, título y acción opcional */
export default function StackHeader({ title, onBack, children, right }: StackHeaderProps) {
  const { isDark } = useTheme();

  return (
    <View
      className={`flex-row items-center px-1 py-1 border-b ${
        isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'
      }`}
    >
      <IconButton accessibilityLabel="Volver" onPress={onBack} renderIcon={color => <BackIcon color={color} />} />
      <View className="flex-1 ml-1 mr-2">
        {children ?? (
          <Text
            accessibilityRole="header"
            className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}
            numberOfLines={1}
          >
            {title}
          </Text>
        )}
      </View>
      {right}
    </View>
  );
}
