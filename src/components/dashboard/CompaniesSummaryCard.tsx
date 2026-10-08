import React from 'react';
import { View, Text } from 'react-native';
import AnimatedButton from '../AnimatedButton';
import { useResponsive } from '../../hooks/useResponsive';

interface CompaniesSummaryCardProps {
  isDark: boolean;
  companiesCount: number;
  onOpenCompanies: () => void;
}

export default function CompaniesSummaryCard({ isDark, companiesCount, onOpenCompanies }: CompaniesSummaryCardProps) {
  const responsive = useResponsive();

  return (
    <View style={{ paddingHorizontal: responsive.spacing.lg, paddingVertical: responsive.spacing.md }}>
      <View
        className={`rounded-3xl border ${
          isDark
            ? 'bg-gray-800 border-gray-700'
            : 'bg-white border-gray-200'
        }`}
        style={{ padding: responsive.spacing.lg }}
      >
        <View className="flex-row justify-between items-center" style={{ marginBottom: responsive.spacing.lg }}>
          <View className="flex-row items-center">
            <Text style={{ fontSize: responsive.fontSize['2xl'], marginRight: responsive.spacing.sm }}>🏢</Text>
            <Text
              className={`font-bold ${
                isDark ? 'text-white' : 'text-gray-900'
              }`}
              style={{ fontSize: responsive.fontSize.xl }}
            >
              Empresas
            </Text>
          </View>
          <AnimatedButton onPress={onOpenCompanies}>
            <View
              className={`px-3 py-1.5 rounded-lg ${
                isDark ? 'bg-blue-500/20' : 'bg-blue-50'
              }`}
            >
              <Text
                className={`text-sm font-semibold ${
                  isDark ? 'text-blue-300' : 'text-blue-700'
                }`}
              >
                Gestionar →
              </Text>
            </View>
          </AnimatedButton>
        </View>

        <View
          className={`rounded-2xl p-5 border ${
            isDark
              ? 'bg-gray-800/50 border-gray-700'
              : 'bg-gray-50 border-gray-200'
          }`}
        >
          <View className="flex-row items-center justify-between mb-4">
            <View className="flex-row items-center">
              <Text className="text-xl mr-2">📊</Text>
              <Text
                className={`text-lg font-bold ${
                  isDark ? 'text-white' : 'text-gray-900'
                }`}
              >
                Resumen
              </Text>
            </View>
            <View
              className={`px-3 py-1.5 rounded-full ${
                isDark ? 'bg-blue-500/20' : 'bg-blue-100'
              }`}
            >
              <Text
                className={`text-sm font-bold ${
                  isDark ? 'text-blue-300' : 'text-blue-700'
                }`}
              >
                {companiesCount}
              </Text>
            </View>
          </View>
          <Text
            className={`mb-4 text-sm ${
              isDark ? 'text-gray-300' : 'text-gray-600'
            }`}
          >
            Tienes {companiesCount} empresa{companiesCount !== 1 ? 's' : ''}{' '}
            registrada{companiesCount !== 1 ? 's' : ''} en tu cuenta.
            {companiesCount === 0 &&
              ' Agrega tu primera empresa para comenzar a recibir recordatorios automáticos.'}
          </Text>
          <AnimatedButton onPress={onOpenCompanies}>
            <View
              className={`py-3 rounded-xl ${
                isDark ? 'bg-blue-600' : 'bg-blue-600'
              }`}
            >
              <Text className="text-white text-center font-semibold">
                {companiesCount === 0
                  ? '➕ Agregar Primera Empresa'
                  : 'Ver Todas las Empresas'}
              </Text>
            </View>
          </AnimatedButton>
        </View>
      </View>
    </View>
  );
}
