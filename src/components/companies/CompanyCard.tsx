import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Company } from '../../types';
import { useResponsive } from '../../hooks/useResponsive';
import { CompanyStats } from './companyStats';

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

  return (
    <View
      className={`rounded-3xl border ${
        isDark
          ? 'bg-gray-800/80 border-gray-700'
          : 'bg-white border-gray-200'
      }`}
      style={{
        padding: responsive.spacing.lg,
        marginBottom: responsive.spacing.md,
      }}
    >
      <View
        className="flex-row justify-between items-start"
        style={{ marginBottom: responsive.spacing.md }}
      >
        <View className="flex-1">
          <Text
            className={`font-semibold ${
              isDark ? 'text-white' : 'text-gray-900'
            }`}
            style={{
              fontSize: responsive.fontSize.lg,
              marginBottom: responsive.spacing.xs,
            }}
          >
            {company.name}
          </Text>
          <Text
            className={`${
              isDark ? 'text-gray-400' : 'text-gray-600'
            }`}
            style={{ fontSize: responsive.fontSize.sm }}
          >
            NIT: {company.nit}
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => onDelete(company.id)}
          style={{ marginLeft: responsive.spacing.sm }}
          accessibilityRole="button"
          accessibilityLabel={`Eliminar empresa ${company.name}`}
          hitSlop={8}
        >
          <Text
            className="text-red-600"
            style={{ fontSize: responsive.fontSize.lg }}
          >
            🗑️
          </Text>
        </TouchableOpacity>
      </View>

      {/* Estadísticas */}
      <View
        className={`rounded-2xl ${
          isDark ? 'bg-gray-900/60' : 'bg-gray-50'
        }`}
        style={{
          padding: responsive.spacing.md,
          marginBottom: responsive.spacing.md,
        }}
      >
        <Text
          className={`font-semibold ${
            isDark ? 'text-gray-300' : 'text-gray-600'
          }`}
          style={{
            fontSize: responsive.fontSize.xs,
            marginBottom: responsive.spacing.md,
          }}
        >
          Estadísticas
        </Text>
        <View
          className="flex-row flex-wrap"
          style={{ marginHorizontal: -responsive.spacing.xs }}
        >
          <View
            style={{
              width: responsive.isTablet ? '33.33%' : '33.33%',
              paddingHorizontal: responsive.spacing.xs,
            }}
          >
            <View
              className={`rounded-xl ${
                isDark ? 'bg-blue-500/10' : 'bg-blue-50'
              }`}
              style={{ padding: responsive.spacing.md }}
            >
              <Text
                className={`${
                  isDark ? 'text-gray-400' : 'text-gray-600'
                }`}
                style={{
                  fontSize: responsive.fontSize.xs,
                  marginBottom: responsive.spacing.xs,
                }}
              >
                Total
              </Text>
              <Text
                className={`font-bold ${
                  isDark ? 'text-blue-200' : 'text-blue-700'
                }`}
                style={{ fontSize: responsive.fontSize.xl }}
              >
                {stats.total}
              </Text>
            </View>
          </View>
          <View
            style={{
              width: responsive.isTablet ? '33.33%' : '33.33%',
              paddingHorizontal: responsive.spacing.xs,
            }}
          >
            <View
              className={`rounded-xl ${
                isDark ? 'bg-yellow-500/10' : 'bg-yellow-50'
              }`}
              style={{ padding: responsive.spacing.md }}
            >
              <Text
                className={`${
                  isDark ? 'text-yellow-300' : 'text-yellow-700'
                }`}
                style={{
                  fontSize: responsive.fontSize.xs,
                  marginBottom: responsive.spacing.xs,
                }}
              >
                Pendientes
              </Text>
              <Text
                className={`font-bold ${
                  isDark ? 'text-yellow-200' : 'text-yellow-900'
                }`}
                style={{ fontSize: responsive.fontSize.xl }}
              >
                {stats.pending}
              </Text>
            </View>
          </View>
          <View
            style={{
              width: responsive.isTablet ? '33.33%' : '33.33%',
              paddingHorizontal: responsive.spacing.xs,
            }}
          >
            <View
              className={`rounded-xl ${
                isDark ? 'bg-red-500/10' : 'bg-red-50'
              }`}
              style={{ padding: responsive.spacing.md }}
            >
              <Text
                className={`${
                  isDark ? 'text-red-300' : 'text-red-700'
                }`}
                style={{
                  fontSize: responsive.fontSize.xs,
                  marginBottom: responsive.spacing.xs,
                }}
              >
                Vencidos
              </Text>
              <Text
                className={`font-bold ${
                  isDark ? 'text-red-200' : 'text-red-900'
                }`}
                style={{ fontSize: responsive.fontSize.xl }}
              >
                {stats.overdue}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Botones de acción */}
      <View
        className="flex-row flex-wrap"
        style={{ marginHorizontal: -responsive.spacing.xs }}
      >
        <View
          style={{
            width: responsive.isSmallDevice ? '100%' : '50%',
            paddingHorizontal: responsive.spacing.xs,
            marginBottom: responsive.spacing.sm,
          }}
        >
          <TouchableOpacity
            onPress={() => onOpenCalendars(company)}
            className={`rounded-2xl items-center justify-center ${
              isDark ? 'bg-green-900/40' : 'bg-green-100'
            }`}
            style={{ paddingVertical: responsive.spacing.sm }}
          >
            <Text
              className={`font-semibold ${
                isDark ? 'text-green-100' : 'text-green-800'
              }`}
              style={{
                fontSize: responsive.fontSize.sm,
                color: isDark ? '#d1fae5' : '#065f46',
              }}
            >
              📅 Calendarios
            </Text>
          </TouchableOpacity>
        </View>

        <View
          style={{
            width: responsive.isSmallDevice ? '100%' : '50%',
            paddingHorizontal: responsive.spacing.xs,
            marginBottom: responsive.spacing.sm,
          }}
        >
          <TouchableOpacity
            onPress={() => onOpenReminders(company.id)}
            className={`rounded-2xl items-center justify-center ${
              isDark ? 'bg-blue-900/40' : 'bg-blue-100'
            }`}
            style={{ paddingVertical: responsive.spacing.sm }}
          >
            <Text
              className={`font-semibold ${
                isDark ? 'text-blue-100' : 'text-blue-800'
              }`}
              style={{
                fontSize: responsive.fontSize.sm,
                color: isDark ? '#bfdbfe' : '#1e40af',
              }}
            >
              Ver Recordatorios
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
