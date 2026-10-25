import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Switch,
  Platform,
  StyleSheet,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import Button from '../Button';
import FormSheet, { FormField, inputClassName, placeholderColor } from '../FormSheet';
import Segmented from '../SegmentedControl';
import { RecurrenceType, TaskPriority } from '../../types';
import { useThemeColors } from '../../theme/colors';
import {
  REMINDER_LEAD_PRESETS,
  TaskFormField,
  TaskFormState,
  formatLeadTime,
  isPresetLead,
  priorityLabels,
} from './taskForm';

interface TaskFormModalProps {
  visible: boolean;
  isEditing: boolean;
  isDark: boolean;
  formState: TaskFormState;
  setFormState: React.Dispatch<React.SetStateAction<TaskFormState>>;
  submitting: boolean;
  /** Errores de validación por campo */
  errors?: Partial<Record<TaskFormField, string>>;
  onClose: () => void;
  onSubmit: () => void;
}

// Los mismos roles que la insignia de prioridad de TaskCard (neutral, primary, warning, error),
// en el tono más oscuro de cada uno para que el texto blanco contraste
const priorityActiveStyles: Record<TaskPriority, string> = {
  low: 'bg-gray-600 border-gray-600',
  medium: 'bg-blue-600 border-blue-600',
  high: 'bg-amber-700 border-amber-700',
  urgent: 'bg-red-600 border-red-600',
};

const CUSTOM_LEAD = 'custom';

const recurrenceLabels: Record<'daily' | 'weekly' | 'monthly', string> = {
  daily: 'Diaria',
  weekly: 'Semanal',
  monthly: 'Mensual',
};

const recurrenceUnits: Record<'daily' | 'weekly' | 'monthly', string> = {
  daily: 'días',
  weekly: 'semanas',
  monthly: 'meses',
};

/** Fila con título, descripción y un interruptor */
function SwitchRow({
  isDark,
  title,
  description,
  value,
  onChange,
}: {
  isDark: boolean;
  title: string;
  description: string;
  value: boolean;
  onChange: (value: boolean) => void;
}) {
  const colors = useThemeColors();
  return (
    <View className="flex-row items-center justify-between">
      <View className="flex-1 pr-4">
        <Text className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
          {title}
        </Text>
        <Text className={`text-xs mt-0.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
          {description}
        </Text>
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        accessibilityLabel={title}
        trackColor={{ false: colors.outline, true: colors.primary }}
        thumbColor={value ? colors.onPrimary : undefined}
      />
    </View>
  );
}

export default function TaskFormModal({
  visible,
  isEditing,
  isDark,
  formState,
  setFormState,
  submitting,
  errors,
  onClose,
  onSubmit,
}: TaskFormModalProps) {
  const colors = useThemeColors();
  // "Otro" se elige a mano; al abrir el formulario se deduce de la antelación guardada
  const [customLead, setCustomLead] = useState(false);
  useEffect(() => {
    if (visible) {
      setCustomLead(!isPresetLead(formState.reminderMinutes));
    }
    // Solo al abrir: después manda lo que elija el usuario
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);
  const pickerButtonClass = `flex-1 py-3 rounded-xl border ${isDark ? 'bg-gray-800' : 'bg-gray-50'} ${
    errors?.startDate
      ? isDark ? 'border-red-300' : 'border-red-600'
      : isDark ? 'border-gray-700' : 'border-gray-200'
  }`;
  const pickerLabelClass = `text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`;
  const pickerValueClass = `text-base font-semibold mt-0.5 ${isDark ? 'text-white' : 'text-gray-900'}`;
  // Bloques separados por un divisor, no por otra caja dentro de la hoja
  const sectionClass = `border-t pt-4 mb-5 ${isDark ? 'border-gray-800' : 'border-gray-200'}`;
  const recurrenceKey =
    formState.recurrenceType === 'daily' ||
    formState.recurrenceType === 'weekly' ||
    formState.recurrenceType === 'monthly'
      ? formState.recurrenceType
      : undefined;

  return (
    <>
    <FormSheet
      visible={visible}
      isDark={isDark}
      title={isEditing ? 'Editar tarea' : 'Nueva tarea'}
      closeDisabled={submitting}
      onClose={onClose}
      footer={
        <Button
          label={isEditing ? 'Guardar cambios' : 'Crear tarea'}
          onPress={onSubmit}
          size="large"
          busy={submitting}
          fullWidth
        />
      }
    >
      <FormField isDark={isDark} label="Título" required error={errors?.title}>
        <TextInput
          className={inputClassName(isDark, !!errors?.title)}
          accessibilityLabel="Título"
          accessibilityHint={errors?.title}
          placeholder="Ej: Revisar documentos importantes"
          placeholderTextColor={placeholderColor(isDark)}
          value={formState.title}
          onChangeText={text => setFormState(prev => ({ ...prev, title: text }))}
        />
      </FormField>

      <FormField isDark={isDark} label="Descripción" optional>
        <TextInput
          className={`${inputClassName(isDark)} h-24`}
          placeholder="Detalles adicionales"
          placeholderTextColor={placeholderColor(isDark)}
          value={formState.description}
          onChangeText={text => setFormState(prev => ({ ...prev, description: text }))}
          multiline
          textAlignVertical="top"
        />
      </FormField>

      <FormField isDark={isDark} label="Prioridad">
        <Segmented
          isDark={isDark}
          options={(Object.keys(priorityLabels) as TaskPriority[]).map(priority => ({
            key: priority,
            label: priorityLabels[priority],
            activeClass: priorityActiveStyles[priority],
          }))}
          selected={formState.priority}
          onSelect={priority => setFormState(prev => ({ ...prev, priority }))}
        />
      </FormField>

      <FormField
        isDark={isDark}
        label="Fecha y hora"
        hint="El recordatorio se envía antes de esta fecha y hora."
        error={errors?.startDate}
      >
        <View className="flex-row gap-2">
          <TouchableOpacity
            onPress={() => setFormState(prev => ({ ...prev, showDatePicker: true }))}
            accessibilityRole="button"
            accessibilityLabel="Cambiar fecha"
            className={`${pickerButtonClass} px-3.5`}
          >
            <Text className={pickerLabelClass}>Fecha</Text>
            <Text className={pickerValueClass} numberOfLines={1}>
              {new Intl.DateTimeFormat('es-CO', {
                weekday: 'short',
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              }).format(formState.startDate)}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setFormState(prev => ({ ...prev, showTimePicker: true }))}
            accessibilityRole="button"
            accessibilityLabel="Cambiar hora"
            className={`${pickerButtonClass} px-3.5`}
            style={styles.timeButton}
          >
            <Text className={pickerLabelClass}>Hora</Text>
            <Text className={pickerValueClass} numberOfLines={1}>
              {new Intl.DateTimeFormat('es-CO', {
                hour: '2-digit',
                minute: '2-digit',
              }).format(formState.startDate)}
            </Text>
          </TouchableOpacity>
        </View>
      </FormField>

      <View className={sectionClass}>
        <SwitchRow
          isDark={isDark}
          title="Recordatorio"
          description="Cuánto antes de la tarea quieres el aviso"
          value={formState.reminderEnabled}
          onChange={value => setFormState(prev => ({ ...prev, reminderEnabled: value }))}
        />
        {formState.reminderEnabled && (
          <View className="mt-3">
            <Segmented
              isDark={isDark}
              options={[
                ...REMINDER_LEAD_PRESETS.map(minutes => ({
                  key: String(minutes),
                  label: formatLeadTime(minutes),
                })),
                { key: CUSTOM_LEAD, label: 'Otro' },
              ]}
              selected={customLead ? CUSTOM_LEAD : formState.reminderMinutes}
              onSelect={key => {
                setCustomLead(key === CUSTOM_LEAD);
                if (key !== CUSTOM_LEAD) {
                  setFormState(prev => ({ ...prev, reminderMinutes: key }));
                }
              }}
            />
            {customLead && (
              <View className="flex-row items-center mt-3">
                <TextInput
                  keyboardType="number-pad"
                  className={`${inputClassName(isDark)} w-24 text-center`}
                  placeholder="60"
                  placeholderTextColor={placeholderColor(isDark)}
                  value={formState.reminderMinutes}
                  accessibilityLabel="Minutos de antelación"
                  onChangeText={text =>
                    setFormState(prev => ({
                      ...prev,
                      reminderMinutes: text.replace(/[^0-9]/g, ''),
                    }))
                  }
                />
                <Text className={`ml-3 text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                  minutos antes
                </Text>
              </View>
            )}
          </View>
        )}
      </View>

      <View className={sectionClass}>
        <SwitchRow
          isDark={isDark}
          title="Repetir tarea"
          description="Repetir con una frecuencia fija"
          value={formState.isRecurring}
          onChange={value =>
            setFormState(prev => ({
              ...prev,
              isRecurring: value,
              recurrenceType: value ? prev.recurrenceType : 'once',
            }))
          }
        />
        {formState.isRecurring && (
          <View className="mt-4">
            <Segmented
              isDark={isDark}
              options={(['daily', 'weekly', 'monthly'] as const).map(type => ({
                key: type,
                label: recurrenceLabels[type],
              }))}
              selected={recurrenceKey}
              onSelect={type =>
                setFormState(prev => ({ ...prev, recurrenceType: type as RecurrenceType }))
              }
            />
            <View className="flex-row items-center mt-3">
              <Text className={`text-sm mr-3 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                Cada
              </Text>
              <TextInput
                keyboardType="number-pad"
                className={`${inputClassName(isDark)} w-20 text-center`}
                placeholder="1"
                placeholderTextColor={placeholderColor(isDark)}
                value={formState.recurrenceInterval}
                accessibilityLabel="Intervalo de repetición"
                onChangeText={text =>
                  setFormState(prev => ({
                    ...prev,
                    recurrenceInterval: text.replace(/[^0-9]/g, ''),
                  }))
                }
              />
              <Text className={`ml-3 text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                {recurrenceKey ? recurrenceUnits[recurrenceKey] : 'días / semanas / meses'}
              </Text>
            </View>
          </View>
        )}
      </View>
    </FormSheet>

    {/* Date Picker */}
    {formState.showDatePicker && (
      <DateTimePicker
        value={formState.startDate}
        mode="date"
        display={Platform.OS === 'ios' ? 'spinner' : 'default'}
        onChange={(event, selectedDate) => {
          if (event.type === 'dismissed') {
            setFormState(prev => ({
              ...prev,
              showDatePicker: false,
            }));
            return;
          }

          if (selectedDate) {
            // Mantener la hora actual pero cambiar la fecha
            const newDate = new Date(formState.startDate);
            newDate.setFullYear(selectedDate.getFullYear());
            newDate.setMonth(selectedDate.getMonth());
            newDate.setDate(selectedDate.getDate());
            
            setFormState(prev => ({
              ...prev,
              startDate: newDate,
              showDatePicker: Platform.OS === 'ios',
            }));
          }
          
          // En Android, el picker se cierra automáticamente
          if (Platform.OS === 'android') {
            setFormState(prev => ({
              ...prev,
              showDatePicker: false,
            }));
          }
        }}
        minimumDate={new Date()} // No permitir fechas pasadas
        textColor={colors.onSurface}
      />
    )}

    {/* Time Picker */}
    {formState.showTimePicker && (
      <DateTimePicker
        value={formState.startDate}
        mode="time"
        display={Platform.OS === 'ios' ? 'spinner' : 'default'}
        is24Hour={false}
        onChange={(event, selectedDate) => {
          if (event.type === 'dismissed') {
            setFormState(prev => ({
              ...prev,
              showTimePicker: false,
            }));
            return;
          }

          if (selectedDate) {
            // Mantener la fecha actual pero cambiar la hora
            const newDate = new Date(formState.startDate);
            newDate.setHours(selectedDate.getHours());
            newDate.setMinutes(selectedDate.getMinutes());
            newDate.setSeconds(0);
            newDate.setMilliseconds(0);
            
            setFormState(prev => ({
              ...prev,
              startDate: newDate,
              showTimePicker: Platform.OS === 'ios',
            }));
          }
          
          // En Android, el picker se cierra automáticamente
          if (Platform.OS === 'android') {
            setFormState(prev => ({
              ...prev,
              showTimePicker: false,
            }));
          }
        }}
        textColor={colors.onSurface}
      />
    )}
    </>
  );
}

const styles = StyleSheet.create({
  // La hora ocupa menos que la fecha
  timeButton: { flexGrow: 0, flexBasis: '38%' },
});
