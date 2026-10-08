import React from 'react';
import { Text, View } from 'react-native';
import SectionCard from '../SectionCard';
import SegmentedControl from '../SegmentedControl';
import { ThemePreference, useTheme } from '../../context/ThemeContext';

const options: { key: ThemePreference; label: string }[] = [
  { key: 'system', label: 'Sistema' },
  { key: 'light', label: 'Claro' },
  { key: 'dark', label: 'Oscuro' },
];

/** Elección del tema: seguir al sistema o fijar claro/oscuro */
export default function AppearanceCard() {
  const { isDark, preference, setPreference } = useTheme();

  return (
    <SectionCard isDark={isDark} title="Apariencia">
      <SegmentedControl
        isDark={isDark}
        options={options}
        selected={preference}
        onSelect={setPreference}
      />
      <View className="mt-2">
        <Text className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
          {preference === 'system'
            ? 'Se ajusta al tema claro u oscuro de tu dispositivo.'
            : 'Se mantiene aunque cambie el tema del dispositivo.'}
        </Text>
      </View>
    </SectionCard>
  );
}
