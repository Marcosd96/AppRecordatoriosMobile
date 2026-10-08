import React from 'react';
import { Text, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface LoadingScreenProps {
  isDark: boolean;
  message: string;
}

/** Pantalla de carga común mientras no hay datos que mostrar */
export default function LoadingScreen({ isDark, message }: LoadingScreenProps) {
  return (
    <SafeAreaView
      className={`flex-1 items-center justify-center ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}
      edges={['top']}
    >
      <ActivityIndicator size="large" color={isDark ? '#60a5fa' : '#2563eb'} />
      <Text className={isDark ? 'text-gray-400 mt-4' : 'text-gray-500 mt-4'}>{message}</Text>
    </SafeAreaView>
  );
}
