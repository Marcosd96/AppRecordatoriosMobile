import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Company } from '../../types';
import { useResponsive } from '../../hooks/useResponsive';
import { CompanyStats } from './companyStats';
import { TrashIcon } from '../icons/ActionIcons';

interface CompanyCardProps {
  company: Company;
  stats: CompanyStats;
  isDark: boolean;
  onDelete: (companyId: string) => void;
  onOpenCalendars: (company: Company) => void;
  onOpenReminders: (companyId: string) => void;
}

export default function CompanyCard({
  company,
  stats,
  isDark,
  onDelete,
  onOpenCalendars,
  onOpenReminders,
}: CompanyCardProps) {
  const responsive = useResponsive();
  const initial = company.name.trim().charAt(0).toUpperCase() || '?';

  const statItems = [
    {
      key: 'overdue',
      label: 'Vencidos',
      value: stats.overdue,
      dot: 'bg-red-500',
      highlight: stats.overdue > 0 ? (isDark ? 'text-red-300' : 'text-red-600') : undefined,
    },
    { key: 'pending', label: 'Pendientes', value: stats.pending, dot: 'bg-amber-500' },
    { key: 'total', label: 'Total', value: stats.total, dot: 'bg-blue-500' },
  ];

  return (
    <View
      className={`rounded-2xl border ${
        isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
      }`}
      style={{ padding: responsive.spacing.md, marginBottom: responsive.spacing.sm + 4 }}
    >
      {/* Encabezado: inicial, nombre y NIT */}
      <View className="flex-row items-center">
        <View
          className={`h-11 w-11 rounded-xl items-center justify-center ${
            isDark ? 'bg-blue-500/15' : 'bg-blue-50'
          }`}
        >
          <Text className={`text-lg font-bold ${isDark ? 'text-blue-300' : 'text-blue-700'}`}>
            {initial}
          </Text>
        </View>
        <View className="flex-1 ml-3">
          <Text
            className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}
            style={{ fontSize: responsive.fontSize.lg }}
            numberOfLines={1}
          >
            {company.name}
          </Text>
          <Text
            className={isDark ? 'text-gray-400' : 'text-gray-500'}
            style={{ fontSize: responsive.fontSize.sm }}
          >
            NIT {company.nit}
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => onDelete(company.id)}
          accessibilityRole="button"
          accessibilityLabel={`Eliminar empresa ${company.name}`}
          hitSlop={8}
          className={`h-9 w-9 rounded-lg items-center justify-center ${
            isDark ? 'bg-red-500/10' : 'bg-red-50'
          }`}
        >
          <TrashIcon color={isDark ? '#fca5a5' : '#dc2626'} />
        </TouchableOpacity>
      </View>

      {/* Estadísticas en una sola fila */}
      <View
        className={`flex-row rounded-xl ${isDark ? 'bg-gray-900/60' : 'bg-gray-50'}`}
        style={{ marginTop: responsive.spacing.md, paddingVertical: responsive.spacing.sm + 2 }}
      >
        {statItems.map((item, index) => (
          <View
            key={item.key}
            className={`flex-1 items-center ${
              index > 0 ? (isDark ? 'border-l border-gray-700' : 'border-l border-gray-200') : ''
            }`}
          >
            <Text
              className={`font-bold ${item.highlight ?? (isDark ? 'text-white' : 'text-gray-900')}`}
              style={{ fontSize: responsive.fontSize.xl }}
            >
              {item.value}
            </Text>
            <View className="flex-row items-center mt-0.5">
              <View className={`w-1.5 h-1.5 rounded-full mr-1.5 ${item.dot}`} />
              <Text
                className={isDark ? 'text-gray-400' : 'text-gray-500'}
                style={{ fontSize: responsive.fontSize.xs }}
              >
                {item.label}
              </Text>
            </View>
          </View>
        ))}
      </View>

      {/* Acciones */}
      <View className="flex-row" style={{ marginTop: responsive.spacing.md, gap: responsive.spacing.sm }}>
        <TouchableOpacity
          onPress={() => onOpenCalendars(company)}
          accessibilityRole="button"
          accessibilityLabel={`Calendarios de ${company.name}`}
          className={`flex-1 rounded-xl items-center justify-center ${
            isDark ? 'bg-gray-700' : 'bg-gray-100'
          }`}
          style={{ paddingVertical: responsive.spacing.sm + 2 }}
        >
          <Text
            className={`font-semibold ${isDark ? 'text-gray-100' : 'text-gray-800'}`}
            style={{ fontSize: responsive.fontSize.sm }}
          >
            Calendarios
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => onOpenReminders(company.id)}
          accessibilityRole="button"
          accessibilityLabel={`Ver recordatorios de ${company.name}`}
          className="flex-1 rounded-xl items-center justify-center bg-blue-600"
          style={{ paddingVertical: responsive.spacing.sm + 2 }}
        >
          <Text className="font-semibold text-white" style={{ fontSize: responsive.fontSize.sm }}>
            Ver recordatorios
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
