import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { Company, MunicipalSubtype } from '../types';
import { CalendarType, CALENDAR_CONFIGS } from '../config/calendarTypes';
import { useTheme } from '../context/ThemeContext';
import { useThemeColors } from '../theme/colors';
import StyledModal from './StyledModal';
import Button from './Button';
import { CheckIcon } from './icons/ActionIcons';
import {
  CalendarSelection,
  MUNICIPAL_CALENDAR,
  buildCalendarSelection,
  initialSubtypeIds,
} from './companies/calendarSelection';

interface CalendarSelectorProps {
  company: Company;
  availableCalendars: CalendarType[];
  /** Impuestos municipales de la ciudad de la empresa (vacío si no tiene ciudad) */
  municipalSubtypes: MunicipalSubtype[];
  visible: boolean;
  onClose: () => void;
  onSave: (selection: CalendarSelection) => Promise<void>;
}

/** Casilla de verificación visual; el rol y el estado los lleva la fila que la contiene */
function Checkbox({ checked }: { checked: boolean }) {
  const { isDark } = useTheme();
  const colors = useThemeColors();
  return (
    <View
      style={styles.checkboxBase}
      className={
        checked
          ? 'bg-blue-600 border-blue-600'
          : isDark
          ? 'bg-gray-700 border-gray-600'
          : 'bg-white border-gray-300'
      }
    >
      {checked && <CheckIcon color={colors.onPrimary} size={14} />}
    </View>
  );
}

export default function CalendarSelector({
  company,
  availableCalendars,
  municipalSubtypes,
  visible,
  onClose,
  onSave,
}: CalendarSelectorProps) {
  const { isDark } = useTheme();
  const colors = useThemeColors();
  const [selectedCalendars, setSelectedCalendars] = useState<CalendarType[]>(
    company.calendarTypes || []
  );
  const [selectedSubtypes, setSelectedSubtypes] = useState<string[]>(() =>
    initialSubtypeIds(company.municipalSubtypeIds, municipalSubtypes)
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Actualizar la selección cuando se abre el modal o cambia la empresa
  React.useEffect(() => {
    if (visible) {
      setSelectedCalendars(company.calendarTypes || []);
      setSelectedSubtypes(initialSubtypeIds(company.municipalSubtypeIds, municipalSubtypes));
    }
  }, [availableCalendars, municipalSubtypes, company, visible]);

  const handleToggleCalendar = (calendarType: CalendarType) => {
    const willSelect = !selectedCalendars.includes(calendarType);
    setSelectedCalendars(prev =>
      willSelect ? [...prev, calendarType] : prev.filter(c => c !== calendarType)
    );
    // Al volver a marcar el municipal sin ningún impuesto elegido, se marcan todos
    if (calendarType === MUNICIPAL_CALENDAR && willSelect && selectedSubtypes.length === 0) {
      setSelectedSubtypes(municipalSubtypes.map(subtype => subtype.id));
    }
  };

  const handleToggleSubtype = (subtypeId: string) => {
    setSelectedSubtypes(prev =>
      prev.includes(subtypeId) ? prev.filter(id => id !== subtypeId) : [...prev, subtypeId]
    );
  };

  const handleSave = async () => {
    setLoading(true);
    setError('');

    try {
      await onSave(buildCalendarSelection(selectedCalendars, selectedSubtypes, municipalSubtypes));
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error al guardar los calendarios');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const renderSubtypes = () => (
    <View className="ml-8 mt-1">
      <Text className={`text-xs font-semibold mb-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
        {selectedSubtypes.length} de {municipalSubtypes.length} impuestos de la ciudad
      </Text>
      {municipalSubtypes.map(subtype => {
        const isChecked = selectedSubtypes.includes(subtype.id);
        return (
          <Pressable
            key={subtype.id}
            onPress={() => handleToggleSubtype(subtype.id)}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: isChecked }}
            android_ripple={{ color: colors.ripple }}
            className="flex-row items-center py-2 min-h-12"
          >
            <Checkbox checked={isChecked} />
            <Text className={`flex-1 text-sm ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
              {subtype.name}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );

  return (
    <StyledModal
      visible={visible}
      onClose={onClose}
      title={`Calendarios - ${company.name}`}
      animationType="slide"
    >
      <View>
        <View className="mb-4">
          <Text className={`text-sm ${
            isDark ? 'text-gray-300' : 'text-gray-600'
          }`}>
            Selecciona los tipos de calendarios que deseas usar para esta empresa.
            Los recordatorios se generarán solo para los calendarios seleccionados.
          </Text>
          {selectedCalendars.length > 0 && (
            <View className={`mt-3 px-3 py-2 rounded-xl ${
              isDark ? 'bg-blue-900/30' : 'bg-blue-50'
            }`}>
              <Text className={`text-sm font-medium ${
                isDark ? 'text-blue-300' : 'text-blue-700'
              }`}>
                {selectedCalendars.length} calendario{selectedCalendars.length !== 1 ? 's' : ''} seleccionado{selectedCalendars.length !== 1 ? 's' : ''}
              </Text>
            </View>
          )}
        </View>

        {error && (
          <View className={`mb-4 p-3 rounded-xl ${isDark ? 'bg-red-500/10' : 'bg-red-50'}`}>
            <Text className={`text-sm ${isDark ? 'text-red-300' : 'text-red-600'}`}>{error}</Text>
          </View>
        )}

        <ScrollView
          showsVerticalScrollIndicator={true}
          style={styles.calendarScroll}
          nestedScrollEnabled={true}
        >
          {availableCalendars.length === 0 ? (
            <View className={`p-4 rounded-xl border ${
              isDark
                ? 'bg-gray-800 border-gray-700'
                : 'bg-gray-100 border-gray-200'
            }`}>
              <Text className={`font-semibold mb-2 ${
                isDark ? 'text-white' : 'text-gray-900'
              }`}>
                No hay calendarios disponibles
              </Text>
              <Text className={`text-sm ${
                isDark ? 'text-gray-400' : 'text-gray-500'
              }`}>
                Los calendarios deben ser agregados por un administrador. Una vez que
                se agreguen, podrás seleccionarlos para esta empresa.
              </Text>
            </View>
          ) : (
            <View>
              {availableCalendars.map((calendarType, index) => {
                const config = CALENDAR_CONFIGS[calendarType];
                const isSelected = selectedCalendars.includes(calendarType);
                const isMunicipal = calendarType === MUNICIPAL_CALENDAR;
                // Sin ciudad, el municipal no genera nada: se avisa en su descripción
                const description =
                  isMunicipal && !company.cityId
                    ? 'Requiere la ciudad de la empresa: elígela en «Más acciones» › Ciudad.'
                    : config.description;

                return (
                  <View
                    key={calendarType}
                    style={index < availableCalendars.length - 1 ? styles.calendarItemSpacing : undefined}
                  >
                    <Pressable
                      onPress={() => handleToggleCalendar(calendarType)}
                      accessibilityRole="checkbox"
                      accessibilityState={{ checked: isSelected }}
                      android_ripple={{ color: colors.ripple }}
                      className={`flex-row items-start p-3 border rounded-xl overflow-hidden ${
                        isSelected
                          ? isDark
                            ? 'border-blue-500 bg-blue-500/15'
                            : 'border-blue-500 bg-blue-50'
                          : isDark
                          ? 'border-gray-700 bg-gray-800'
                          : 'border-gray-200 bg-white'
                      }`}
                    >
                      <View style={styles.checkboxOffset}>
                        <Checkbox checked={isSelected} />
                      </View>
                      <View className="flex-1">
                        <Text
                          className={`font-medium mb-1 ${
                            isDark ? 'text-white' : 'text-gray-900'
                          }`}
                        >
                          {config.name}
                        </Text>
                        <Text
                          className={`text-sm ${
                            isDark ? 'text-gray-400' : 'text-gray-600'
                          }`}
                        >
                          {description}
                        </Text>
                      </View>
                    </Pressable>
                    {/* Impuestos municipales concretos: solo si el calendario está marcado */}
                    {isMunicipal && isSelected && municipalSubtypes.length > 0 && renderSubtypes()}
                  </View>
                );
              })}
            </View>
          )}
        </ScrollView>

        <View className={`pt-4 border-t ${
          isDark ? 'border-gray-700' : 'border-gray-200'
        }`}>
          <View className="flex-row" style={styles.buttonRowGap}>
            <View className="flex-1">
              <Button
                label="Cancelar"
                onPress={onClose}
                variant="secondary"
                size="large"
                disabled={loading}
                fullWidth
              />
            </View>
            <View className="flex-1">
              <Button
                label="Guardar"
                onPress={handleSave}
                size="large"
                busy={loading}
                disabled={availableCalendars.length === 0}
                fullWidth
              />
            </View>
          </View>
        </View>
      </View>
    </StyledModal>
  );
}

const styles = StyleSheet.create({
  calendarScroll: {
    maxHeight: 350,
    marginBottom: 16,
  },
  calendarItemSpacing: {
    marginBottom: 8,
  },
  checkboxBase: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxOffset: {
    marginTop: 2,
  },
  buttonRowGap: {
    gap: 12,
  },
});
