import React from 'react';
import { View, Text } from 'react-native';
import { useIsOnline } from '../hooks/queries';

/**
 * Franja que avisa de que no hay conexión y se están mostrando los datos guardados
 */
export default function OfflineBanner({ bottom }: { bottom: number }) {
  const isOnline = useIsOnline();

  if (isOnline) {
    return null;
  }

  return (
    <View
      pointerEvents="none"
      className="absolute left-0 right-0 bg-gray-800 px-4 py-2"
      style={{ bottom }}
    >
      <Text className="text-center text-sm font-semibold text-white">
        📡 Sin conexión · mostrando datos guardados
      </Text>
    </View>
  );
}
