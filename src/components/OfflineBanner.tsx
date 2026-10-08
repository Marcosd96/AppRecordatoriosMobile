import React from 'react';
import { View, Text } from 'react-native';
import { useIsOnline } from '../hooks/queries';
import { WifiOffIcon } from './icons/ActionIcons';

/**
 * Aviso flotante de que no hay conexión y se están mostrando los datos guardados
 */
export default function OfflineBanner({ bottom }: { bottom: number }) {
  const isOnline = useIsOnline();

  if (isOnline) {
    return null;
  }

  return (
    <View
      pointerEvents="none"
      className="absolute left-0 right-0 items-center px-4"
      style={{ bottom: bottom + 8 }}
      accessibilityLiveRegion="polite"
    >
      <View className="flex-row items-center rounded-full bg-gray-900/95 px-4 py-2 border border-gray-700">
        <WifiOffIcon color="#fcd34d" size={16} />
        <Text className="ml-2 text-sm font-semibold text-white">
          Sin conexión · mostrando datos guardados
        </Text>
      </View>
    </View>
  );
}
