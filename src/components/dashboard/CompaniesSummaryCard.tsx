import React from 'react';
import { View, Text } from 'react-native';
import AnimatedButton from '../AnimatedButton';
import SectionCard from '../SectionCard';
import { useResponsive } from '../../hooks/useResponsive';

interface CompaniesSummaryCardProps {
  isDark: boolean;
  companiesCount: number;
  onOpenCompanies: () => void;
}

export default function CompaniesSummaryCard({ isDark, companiesCount, onOpenCompanies }: CompaniesSummaryCardProps) {
  const responsive = useResponsive();
  const hasCompanies = companiesCount > 0;

  return (
    <SectionCard
      isDark={isDark}
      title="Empresas"
      actionLabel={hasCompanies ? 'Gestionar' : undefined}
      onAction={onOpenCompanies}
    >
      {hasCompanies ? (
        <View className="flex-row items-baseline">
          <Text
            className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}
            style={{ fontSize: responsive.fontSize['3xl'] }}
          >
            {companiesCount}
          </Text>
          <Text
            className={`ml-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}
            style={{ fontSize: responsive.fontSize.base }}
          >
            empresa{companiesCount === 1 ? '' : 's'} registrada{companiesCount === 1 ? '' : 's'}
          </Text>
        </View>
      ) : (
        <>
          <Text className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            Agrega tu primera empresa para empezar a recibir recordatorios automáticos.
          </Text>
          <AnimatedButton onPress={onOpenCompanies}>
            <View className="py-3 rounded-xl mt-3 bg-blue-600">
              <Text className="text-white text-center font-semibold">
                Agregar primera empresa
              </Text>
            </View>
          </AnimatedButton>
        </>
      )}
    </SectionCard>
  );
}
