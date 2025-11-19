import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { Company } from '../types';
import { CalendarType, CALENDAR_CONFIGS } from '../config/calendarTypes';
import { useTheme } from '../context/ThemeContext';
import StyledModal from './StyledModal';

interface CalendarSelectorProps {
  company: Company;
  availableCalendars: CalendarType[];
  visible: boolean;
  onClose: () => void;
  onSave: (selectedCalendars: CalendarType[]) => Promise<void>;
}

export default function CalendarSelector({
  company,
  availableCalendars,
  visible,
  onClose,
  onSave,
}: CalendarSelectorProps) {
  const { isDark } = useTheme();
  const [selectedCalendars, setSelectedCalendars] = useState<CalendarType[]>(
    company.calendarTypes || []
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const isSaveDisabled = loading || availableCalendars.length === 0;

  const checkboxStyles = React.useMemo(
    () => ({
      selected: {
        borderColor: '#2563eb',
        backgroundColor: '#2563eb',
      },
      unselected: isDark
        ? { borderColor: '#4b5563', backgroundColor: '#374151' }
        : { borderColor: '#d1d5db', backgroundColor: '#ffffff' },
    }),
    [isDark]
  );

  const buttonStyles = React.useMemo(
    () => ({
      cancel: {
        backgroundColor: isDark ? '#374151' : '#e5e7eb',
        opacity: loading ? 0.5 : 1,
      },
      save: {
        backgroundColor: isSaveDisabled ? '#9ca3af' : '#2563eb',
        opacity: isSaveDisabled ? 0.5 : 1,
      },
    }),
    [isDark, isSaveDisabled, loading]
  );

  // Actualizar calendarios seleccionados cuando se abre el modal o cambia la empresa
  React.useEffect(() => {
    if (visible) {
      setSelectedCalendars(company.calendarTypes || []);
      console.log('[CalendarSelector] Modal abierto');
      console.log('[CalendarSelector] Empresa:', company.name);
      console.log('[CalendarSelector] Calendarios disponibles:', availableCalendars);
      console.log('[CalendarSelector] Cantidad:', availableCalendars.length);
      console.log('[CalendarSelector] Calendarios seleccionados:', company.calendarTypes || []);
    }
  }, [availableCalendars, company, visible]);

  const handleToggleCalendar = (calendarType: CalendarType) => {
    setSelectedCalendars((prev) => {
      const newSelection = prev.includes(calendarType)
        ? prev.filter((c) => c !== calendarType)
        : [...prev, calendarType];
      
      console.log('[CalendarSelector] Toggle:', calendarType);
      console.log('[CalendarSelector] Nueva selección:', newSelection);
      return newSelection;
    });
  };

  const handleSave = async () => {
    setLoading(true);
    setError('');

    try {
      await onSave(selectedCalendars);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error al guardar los calendarios');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

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
            <View className={`mt-2 px-3 py-2 rounded-lg ${
              isDark ? 'bg-blue-900/30' : 'bg-blue-50'
            }`}>
              <Text className={`text-sm font-medium ${
                isDark ? 'text-blue-300' : 'text-blue-700'
              }`}>
                ✓ {selectedCalendars.length} calendario{selectedCalendars.length !== 1 ? 's' : ''} seleccionado{selectedCalendars.length !== 1 ? 's' : ''}
              </Text>
            </View>
          )}
        </View>

        {error && (
          <View className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <Text className="text-sm text-red-600">{error}</Text>
          </View>
        )}

        <ScrollView
          showsVerticalScrollIndicator={true}
          style={styles.calendarScroll}
          nestedScrollEnabled={true}
        >
          {availableCalendars.length === 0 ? (
            <View className={`p-4 rounded-lg border ${
              isDark 
                ? 'bg-yellow-900/30 border-yellow-800' 
                : 'bg-yellow-50 border-yellow-200'
            }`}>
              <Text className={`font-semibold mb-2 ${
                isDark ? 'text-yellow-300' : 'text-yellow-800'
              }`}>
                ⚠️ No hay calendarios disponibles
              </Text>
              <Text className={`text-sm ${
                isDark ? 'text-yellow-200' : 'text-yellow-700'
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
                
                 return (
                   <TouchableOpacity
                     key={calendarType}
                     onPress={() => {
                       console.log('[CalendarSelector] Click en:', calendarType, 'isSelected:', isSelected);
                       handleToggleCalendar(calendarType);
                     }}
                     style={index < availableCalendars.length - 1 ? styles.calendarItemSpacing : undefined}
                     activeOpacity={0.7}
                   >
                     <View
                       className={`flex-row items-start p-3 border-2 rounded-lg ${
                         isSelected
                           ? 'border-blue-500 bg-blue-50'
                           : isDark
                           ? 'border-gray-700 bg-gray-800'
                           : 'border-gray-200 bg-white'
                       }`}
                      >
                       <View
                          style={[
                            styles.checkboxBase,
                            isSelected ? checkboxStyles.selected : checkboxStyles.unselected,
                          ]}
                       >
                         {isSelected && (
                            <Text style={styles.checkmarkText}>✓</Text>
                         )}
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
                           {config.description}
                         </Text>
                       </View>
                     </View>
                   </TouchableOpacity>
                );
              })}
            </View>
          )}
        </ScrollView>

        <View className={`pt-4 border-t ${
          isDark ? 'border-gray-700' : 'border-gray-200'
        }`}>
          <View className="flex-row justify-end" style={styles.buttonRowGap}>
            <TouchableOpacity
              onPress={onClose}
              disabled={loading}
              className="px-5 py-3 rounded-lg"
              style={buttonStyles.cancel}
              activeOpacity={0.7}
            >
              <Text className={`font-semibold ${
                isDark ? 'text-gray-200' : 'text-gray-700'
              }`}>
                Cancelar
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleSave}
              disabled={isSaveDisabled}
              className="px-5 py-3 rounded-lg"
              style={buttonStyles.save}
              activeOpacity={0.7}
            >
              {loading ? (
                <View style={styles.loadingRow}>
                  <ActivityIndicator color="#ffffff" size="small" />
                  <Text className="text-white font-semibold">Guardando...</Text>
                </View>
              ) : (
                <Text className="text-white font-semibold">
                  Guardar y Regenerar
                </Text>
              )}
            </TouchableOpacity>
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
    marginTop: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmarkText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  buttonRowGap: {
    gap: 12,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
});

