import React from 'react';
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
import AnimatedButton from '../AnimatedButton';
import FormSheet, { FormField, inputClassName, placeholderColor } from '../FormSheet';
import Segmented from '../SegmentedControl';
import { RecurrenceType, TaskPriority } from '../../types';
import { TaskFormState, priorityLabels } from './taskForm';

interface TaskFormModalProps {
  visible: boolean;
  isEditing: boolean;
  isDark: boolean;
  formState: TaskFormState;
  setFormState: React.Dispatch<React.SetStateAction<TaskFormState>>;
  submitting: boolean;
  onClose: () => void;
  onSubmit: () => void;
}

const priorityActiveStyles: Record<TaskPriority, string> = {
  low: 'bg-emerald-600 border-emerald-600',
  medium: 'bg-blue-600 border-blue-600',
  high: 'bg-orange-500 border-orange-500',
  urgent: 'bg-red-600 border-red-600',
};

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
        trackColor={{ false: isDark ? '#374151' : '#e5e7eb', true: '#3b82f6' }}
        thumbColor={value ? '#ffffff' : '#f3f4f6'}
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
  onClose,
  onSubmit,
}: TaskFormModalProps) {
  const pickerButtonClass = `flex-1 py-3 rounded-xl border ${
    isDark ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'
  }`;
  const pickerLabelClass = `text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`;
  const pickerValueClass = `text-base font-semibold mt-0.5 ${isDark ? 'text-white' : 'text-gray-900'}`;
  const sectionClass = `rounded-2xl border p-4 mb-5 ${
    isDark ? 'border-gray-800' : 'border-gray-200'
  }`;
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
        <AnimatedButton
          onPress={onSubmit}
          disabled={submitting}
          accessibilityState={{ disabled: submitting, busy: submitting }}
        >
          <View className={`py-3.5 rounded-xl bg-blue-600 ${submitting ? 'opacity-60' : ''}`}>
            <Text className="text-white text-center font-semibold text-base">
              {submitting ? 'Guardando...' : isEditing ? 'Guardar cambios' : 'Crear tarea'}
            </Text>
          </View>
        </AnimatedButton>
      }
    >
      <FormField isDark={isDark} label="Título" required>
        <TextInput
          className={inputClassName(isDark)}
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
          description="Notificar antes de la tarea"
          value={formState.reminderEnabled}
          onChange={value => setFormState(prev => ({ ...prev, reminderEnabled: value }))}
        />
        {formState.reminderEnabled && (
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
                activeClass: 'bg-purple-600 border-purple-600',
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
        textColor={isDark ? '#ffffff' : '#000000'}
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
        textColor={isDark ? '#ffffff' : '#000000'}
      />
    )}
    </>
  );
}

const styles = StyleSheet.create({
  // La hora ocupa menos que la fecha
  timeButton: { flexGrow: 0, flexBasis: '38%' },
});
