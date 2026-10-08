import React from 'react';
import { View, Text } from 'react-native';
import AnimatedButton from '../AnimatedButton';
import { Reminder } from '../../types';
import { formatDate, getDaysUntil } from './dashboardFormat';
import { useResponsive } from '../../hooks/useResponsive';

interface UpcomingRemindersCardProps {
  isDark: boolean;
  reminders: Reminder[];
  onOpenReminders: () => void;
  onAddCompany: () => void;
}

export default function UpcomingRemindersCard({ isDark, reminders, onOpenReminders, onAddCompany }: UpcomingRemindersCardProps) {
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
        <View className="flex-row items-center" style={{ marginBottom: responsive.spacing.lg }}>
          <Text style={{ fontSize: responsive.fontSize['2xl'], marginRight: responsive.spacing.sm }}>📅</Text>
          <Text
            className={`font-bold ${
              isDark ? 'text-white' : 'text-gray-900'
            }`}
            style={{ fontSize: responsive.fontSize.xl }}
          >
            Próximos Recordatorios
          </Text>
        </View>

        {reminders.length === 0 ? (
          <View
            className={`rounded-2xl p-8 border items-center ${
              isDark
                ? 'bg-gray-800/50 border-gray-700'
                : 'bg-gray-50 border-gray-200'
            }`}
          >
            <Text className="text-5xl mb-4">📋</Text>
            <Text
              className={`text-base font-semibold text-center mb-2 ${
                isDark ? 'text-white' : 'text-gray-900'
              }`}
            >
              No hay recordatorios próximos
            </Text>
            <Text
              className={`text-center text-sm ${
                isDark ? 'text-gray-400' : 'text-gray-500'
              }`}
            >
              Agrega empresas para generar recordatorios automáticos.
            </Text>
            <AnimatedButton
              onPress={onAddCompany}
            >
              <View
                className={`px-4 py-2 rounded-lg mt-4 ${
                  isDark ? 'bg-blue-500/20' : 'bg-blue-50'
                }`}
              >
                <Text
                  className={`text-sm font-semibold ${
                    isDark ? 'text-blue-300' : 'text-blue-700'
                  }`}
                >
                  Agregar Empresa
                </Text>
              </View>
            </AnimatedButton>
          </View>
        ) : (
          <View>
            {reminders.map((reminder) => {
              const daysUntil = getDaysUntil(reminder.dueDate);
              const isUrgent = daysUntil <= 7;
              return (
                <AnimatedButton
                  key={reminder.id}
                  onPress={onOpenReminders}
                >
                  <View
                    className={`rounded-2xl p-4 border mb-3 ${
                      isDark
                        ? isUrgent
                          ? 'bg-orange-500/10 border-orange-500/30'
                          : 'bg-gray-800/80 border-gray-700'
                        : isUrgent
                        ? 'bg-orange-50 border-orange-200'
                        : 'bg-white border-gray-200'
                    }`}
                  >
                    <View className="flex-row justify-between items-start mb-2">
                      <View className="flex-1 pr-3">
                        <View className="flex-row items-center mb-1">
                          <Text className="text-base mr-2">
                            {isUrgent ? '⚠️' : '📅'}
                          </Text>
                          <Text
                            className={`text-base font-semibold flex-1 ${
                              isDark ? 'text-white' : 'text-gray-900'
                            }`}
                          >
                            {reminder.description}
                          </Text>
                        </View>
                        <Text
                          className={`text-sm mt-1 ${
                            isDark ? 'text-gray-400' : 'text-gray-600'
                          }`}
                        >
                          🏢 {reminder.companyName}
                        </Text>
                      </View>
                      <View
                        className={`px-2.5 py-1 rounded-full ${
                          isDark ? 'bg-blue-900/50' : 'bg-blue-100'
                        }`}
                      >
                        <Text
                          className={`text-xs font-semibold ${
                            isDark ? 'text-blue-200' : 'text-blue-800'
                          }`}
                        >
                          {reminder.type}
                        </Text>
                      </View>
                    </View>
                    <View
                      className={`flex-row justify-between items-center mt-3 pt-3 border-t ${
                        isDark ? 'border-gray-700' : 'border-gray-200'
                      }`}
                    >
                      <Text
                        className={`text-xs ${
                          isDark ? 'text-gray-400' : 'text-gray-500'
                        }`}
                      >
                        📆 {formatDate(reminder.dueDate)}
                      </Text>
                      <Text
                        className={`text-sm font-semibold ${
                          isUrgent
                            ? 'text-orange-600'
                            : isDark
                            ? 'text-blue-400'
                            : 'text-blue-600'
                        }`}
                      >
                        {daysUntil > 0
                          ? `${daysUntil} día${daysUntil === 1 ? '' : 's'} restante${daysUntil === 1 ? '' : 's'}`
                          : 'Vence hoy'}
                      </Text>
                    </View>
                  </View>
                </AnimatedButton>
              );
            })}
          </View>
        )}

        {/* Botón Ver todos al final */}
        {reminders.length > 0 && (
          <AnimatedButton 
            onPress={onOpenReminders}
            style={{ marginTop: responsive.spacing.md }}
          >
            <View
              className={`px-4 py-3 rounded-xl ${
                isDark ? 'bg-blue-500/20' : 'bg-blue-50'
              }`}
            >
              <Text
                className={`text-sm font-semibold text-center ${
                  isDark ? 'text-blue-300' : 'text-blue-700'
                }`}
              >
                Ver todos →
              </Text>
            </View>
          </AnimatedButton>
        )}
      </View>
    </View>
  );
}
