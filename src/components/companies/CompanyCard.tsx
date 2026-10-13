import React from 'react';
import { AccessibilityActionEvent, Pressable, Text, View } from 'react-native';
import { Company } from '../../types';
import { useTheme } from '../../context/ThemeContext';
import { useThemeColors } from '../../theme/colors';
import Button from '../Button';
import IconButton from '../IconButton';
import StatusBadge from '../StatusBadge';
import { MoreIcon } from '../icons/ActionIcons';
import { CompanyStats } from './companyStats';

interface CompanyCardProps {
  company: Company;
  stats: CompanyStats;
  /** Tocar la tarjeta: ver los recordatorios de la empresa */
  onOpenReminders: (company: Company) => void;
  onOpenCalendars: (company: Company) => void;
  /** Resto de acciones (calendarios, eliminar) en una hoja */
  onOpenActions: (company: Company) => void;
}

const plural = (count: number, singular: string, pluralForm: string) =>
  `${count} ${count === 1 ? singular : pluralForm}`;

/**
 * Empresa en la lista: nombre, NIT y estado de sus recordatorios en una línea. Tocarla abre
 * sus recordatorios; calendarios y eliminar están en ⋮ (eliminar ya no queda a un toque).
 */
export default function CompanyCard({
  company,
  stats,
  onOpenReminders,
  onOpenCalendars,
  onOpenActions,
}: CompanyCardProps) {
  const { isDark } = useTheme();
  const colors = useThemeColors();
  const hasReminders = stats.total > 0;

  const summary = [
    stats.pending > 0 ? plural(stats.pending, 'pendiente', 'pendientes') : null,
    plural(stats.total, 'recordatorio en total', 'recordatorios en total'),
  ]
    .filter(Boolean)
    .join(' · ');

  const accessibilityLabel = [
    company.name,
    `NIT ${company.nit}`,
    stats.overdue > 0 ? plural(stats.overdue, 'vencido', 'vencidos') : null,
    hasReminders ? summary : 'sin recordatorios, elige sus calendarios',
  ]
    .filter(Boolean)
    .join(', ');

  const onAccessibilityAction = ({ nativeEvent }: AccessibilityActionEvent) => {
    if (nativeEvent.actionName === 'activate') {
      onOpenReminders(company);
    } else if (nativeEvent.actionName === 'calendars') {
      onOpenCalendars(company);
    } else if (nativeEvent.actionName === 'more') {
      onOpenActions(company);
    }
  };

  return (
    <Pressable
      onPress={() => onOpenReminders(company)}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint="Abre sus recordatorios"
      accessibilityActions={[
        { name: 'activate', label: 'Ver recordatorios' },
        { name: 'calendars', label: 'Calendarios' },
        { name: 'more', label: 'Más acciones' },
      ]}
      onAccessibilityAction={onAccessibilityAction}
      android_ripple={{ color: colors.ripple }}
      className={`rounded-2xl border mb-3 overflow-hidden ${
        isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
      }`}
    >
      <View className="pl-4 pr-1 pt-3 pb-4">
        <View className="flex-row items-start">
          <View className="flex-1 pt-1 pr-2">
            <Text
              numberOfLines={2}
              className={`text-base font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}
            >
              {company.name}
            </Text>
            <Text className={`text-sm mt-0.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              NIT {company.nit}
            </Text>
          </View>
          <IconButton
            accessibilityLabel={`Más acciones de ${company.name}`}
            onPress={() => onOpenActions(company)}
            renderIcon={color => <MoreIcon color={color} />}
          />
        </View>

        {hasReminders ? (
          <View className="flex-row items-center flex-wrap gap-2 mt-2 pr-3">
            {stats.overdue > 0 && (
              <StatusBadge label={plural(stats.overdue, 'vencido', 'vencidos')} tone="error" />
            )}
            <Text className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>{summary}</Text>
          </View>
        ) : (
          // Sin calendarios la empresa no genera nada: es el único caso con una acción a la vista
          <View className="flex-row items-center mt-2 pr-3">
            <Text className={`flex-1 text-sm pr-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              Aún no tiene recordatorios.
            </Text>
            <Button
              label="Elegir calendarios"
              onPress={() => onOpenCalendars(company)}
              variant="tonal"
            />
          </View>
        )}
      </View>
    </Pressable>
  );
}
