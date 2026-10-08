import React, { useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Switch,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import AnimatedButton from '../AnimatedButton';
import AnimatedView from '../AnimatedView';
import { useResponsive } from '../../hooks/useResponsive';
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
  const responsive = useResponsive();

  const modalLayout = useMemo(() => {
    const modalMaxWidth = responsive.isTablet
      ? Math.min(responsive.width * 0.8, 720)
      : responsive.width;

    return {
      maxWidth: modalMaxWidth,
      horizontalPadding: responsive.isTablet ? responsive.spacing.xl : responsive.spacing.sm,
      justifyContent: responsive.isTablet ? 'center' : 'flex-end',
      borderRadiusClass: responsive.isTablet ? 'rounded-3xl' : 'rounded-t-3xl',
    };
  }, [responsive]);

  return (
    <>
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <View
          className="flex-1 bg-black/60"
          style={{
            justifyContent: modalLayout.justifyContent as 'center' | 'flex-end',
            paddingHorizontal: modalLayout.horizontalPadding,
            paddingBottom: responsive.isTablet ? responsive.spacing.xl : 0,
          }}
        >
          <View
            className={`${modalLayout.borderRadiusClass} ${
              isDark ? 'bg-gray-900' : 'bg-white'
            }`}
            style={{
              maxHeight: '90%',
              width: '100%',
              maxWidth: modalLayout.maxWidth,
              alignSelf: 'center',
            }}
          >
            {/* Header mejorado */}
            <AnimatedView animationType="slideDown" delay={0} duration={400}>
              <View className="px-6 pt-6 pb-4">
                <View className="flex-row justify-between items-start mb-2">
                  <View className="flex-1 pr-4">
                    <View className="flex-row items-center mb-2">
                      <View
                        className={`h-10 w-10 rounded-2xl items-center justify-center mr-3 ${
                          isDark ? 'bg-blue-500/20' : 'bg-blue-100'
                        }`}
                      >
                        <Text className="text-xl">
                          {isEditing ? '✏️' : '✨'}
                        </Text>
                      </View>
                      <View className="flex-1">
                        <Text
                          className={`text-2xl font-bold ${
                            isDark ? 'text-white' : 'text-gray-900'
                          }`}
                        >
                          {isEditing ? 'Editar tarea' : 'Nueva tarea'}
                        </Text>
                        <Text
                          className={`text-sm mt-0.5 ${
                            isDark ? 'text-gray-400' : 'text-gray-500'
                          }`}
                        >
                          {isEditing
                            ? 'Modifica los detalles de tu tarea'
                            : 'Completa la información para crear tu tarea'}
                        </Text>
                      </View>
                    </View>
                  </View>
                  <TouchableOpacity
                    onPress={onClose}
                    accessibilityRole="button"
                    accessibilityLabel="Cerrar"
                    disabled={submitting}
                    className={`h-10 w-10 rounded-xl items-center justify-center ${
                      isDark ? 'bg-gray-800' : 'bg-gray-100'
                    }`}
                  >
                    <Text
                      className={`text-lg ${isDark ? 'text-gray-200' : 'text-gray-700'}`}
                      // El texto es solo un icono: la etiqueta la pone el botón
                      importantForAccessibility="no"
                    >
                      ✕
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </AnimatedView>

            <ScrollView
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: responsive.spacing.lg }}
            >
              <View
                className="space-y-6"
                style={{ paddingHorizontal: responsive.spacing.lg }}
              >
                {/* Sección: Información básica */}
                <AnimatedView
                  animationType="fadeIn"
                  delay={100}
                  duration={400}
                >
                  <View
                    className={`rounded-3xl p-5 border ${
                      isDark
                        ? 'bg-gray-800/50 border-gray-700'
                        : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                  <Text
                    className={`text-base font-bold mb-4 ${
                      isDark ? 'text-white' : 'text-gray-900'
                    }`}
                  >
                    📝 Información básica
                  </Text>

                  <View className="mb-4">
                    <Text
                      className={`text-sm font-semibold mb-2 ${
                        isDark ? 'text-gray-200' : 'text-gray-700'
                      }`}
                    >
                      Título de la tarea
                      <Text className="text-red-500"> *</Text>
                    </Text>
                    <TextInput
                      className={`border-2 rounded-2xl px-4 py-3.5 ${
                        isDark
                          ? 'bg-gray-900 border-gray-600 text-white'
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                      placeholder="Ej: Revisar documentos importantes"
                      placeholderTextColor={isDark ? '#6b7280' : '#9ca3af'}
                      value={formState.title}
                      onChangeText={text =>
                        setFormState(prev => ({ ...prev, title: text }))
                      }
                    />
                  </View>

                  <View>
                    <Text
                      className={`text-sm font-semibold mb-2 ${
                        isDark ? 'text-gray-200' : 'text-gray-700'
                      }`}
                    >
                      Descripción
                      <Text
                        className={`text-xs font-normal ${
                          isDark ? 'text-gray-500' : 'text-gray-500'
                        }`}
                      >
                        {' '}
                        (opcional)
                      </Text>
                    </Text>
                    <TextInput
                      className={`border-2 rounded-2xl px-4 py-3.5 h-28 text-top ${
                        isDark
                          ? 'bg-gray-900 border-gray-600 text-white'
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                      placeholder="Agrega detalles adicionales sobre esta tarea..."
                      placeholderTextColor={isDark ? '#6b7280' : '#9ca3af'}
                      value={formState.description}
                      onChangeText={text =>
                        setFormState(prev => ({
                          ...prev,
                          description: text,
                        }))
                      }
                      multiline
                      textAlignVertical="top"
                    />
                  </View>
                </View>
                </AnimatedView>

                {/* Sección: Configuración */}
                <AnimatedView
                  animationType="fadeIn"
                  delay={200}
                  duration={400}
                >
                  <View
                    className={`rounded-3xl p-5 border ${
                      isDark
                        ? 'bg-gray-800/50 border-gray-700'
                        : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                  <Text
                    className={`text-base font-bold mb-4 ${
                      isDark ? 'text-white' : 'text-gray-900'
                    }`}
                  >
                    ⚙️ Configuración
                  </Text>

                  <View className="mb-5">
                    <Text
                      className={`text-sm font-semibold mb-3 ${
                        isDark ? 'text-gray-200' : 'text-gray-700'
                      }`}
                    >
                      Prioridad
                    </Text>
                    <View className="flex-row flex-wrap -mx-1">
                      {(Object.keys(priorityLabels) as TaskPriority[]).map(
                        (priority, index) => {
                          const isActive = formState.priority === priority;
                          const getButtonStyle = () => {
                            if (isActive) {
                              const activeStyles = {
                                low: 'bg-emerald-500 border-emerald-500',
                                medium: 'bg-blue-500 border-blue-500',
                                high: 'bg-orange-500 border-orange-500',
                                urgent: 'bg-red-500 border-red-500',
                              };
                              return activeStyles[priority];
                            } else {
                              return isDark
                                ? 'bg-gray-700 border-gray-600'
                                : 'bg-gray-100 border-gray-300';
                            }
                          };
                          const getTextStyle = () => {
                            if (isActive) {
                              return 'text-white';
                            } else {
                              return isDark ? 'text-gray-200' : 'text-gray-800';
                            }
                          };
                          return (
                            <AnimatedView
                              key={priority}
                              animationType="scale"
                              delay={250 + index * 50}
                              duration={300}
                              style={{ width: '48%', marginHorizontal: '1%', marginBottom: 8 }}
                            >
                              <TouchableOpacity
                                onPress={() =>
                                  setFormState(prev => ({
                                    ...prev,
                                    priority,
                                  }))
                                }
                                className={`px-4 py-3 rounded-2xl border-2 ${getButtonStyle()}`}
                              >
                                <Text
                                  className={`text-sm font-semibold text-center ${getTextStyle()}`}
                                  numberOfLines={1}
                                  adjustsFontSizeToFit
                                >
                                  {priorityLabels[priority]}
                                </Text>
                              </TouchableOpacity>
                            </AnimatedView>
                          );
                        },
                      )}
                    </View>
                  </View>

                  {/* Fecha y Hora */}
                  <View
                    className={`rounded-2xl p-4 mb-4 ${
                      isDark ? 'bg-gray-900/60' : 'bg-white'
                    }`}
                  >
                    <View className="flex-row items-center mb-3">
                      <Text className="text-lg mr-2">📅</Text>
                      <Text
                        className={`text-sm font-semibold ${
                          isDark ? 'text-white' : 'text-gray-900'
                        }`}
                      >
                        Fecha y Hora de la tarea
                      </Text>
                    </View>
                    
                    <View
                      className={`rounded-2xl p-4 border-2 ${
                        isDark
                          ? 'bg-gray-800 border-gray-600'
                          : 'bg-gray-50 border-gray-300'
                      }`}
                    >
                      <Text
                        className={`text-center text-lg font-bold mb-3 ${
                          isDark ? 'text-white' : 'text-gray-900'
                        }`}
                      >
                        {new Intl.DateTimeFormat('es-CO', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        }).format(formState.startDate)}
                      </Text>
                      
                      <View className="flex-row justify-center space-x-2">
                        <TouchableOpacity
                          onPress={() =>
                            setFormState(prev => ({
                              ...prev,
                              showDatePicker: true,
                            }))
                          }
                          className={`flex-1 py-3 rounded-xl mr-2 ${
                            isDark ? 'bg-blue-600' : 'bg-blue-500'
                          }`}
                        >
                          <Text className="text-white text-center font-semibold">
                            📅 Cambiar Fecha
                          </Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity
                          onPress={() =>
                            setFormState(prev => ({
                              ...prev,
                              showTimePicker: true,
                            }))
                          }
                          className={`flex-1 py-3 rounded-xl ${
                            isDark ? 'bg-blue-600' : 'bg-blue-500'
                          }`}
                        >
                          <Text className="text-white text-center font-semibold">
                            🕐 Cambiar Hora
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                    
                    <Text
                      className={`text-xs mt-2 ml-7 ${
                        isDark ? 'text-gray-400' : 'text-gray-500'
                      }`}
                    >
                      La notificación se enviará antes de esta fecha/hora según
                      la configuración del recordatorio
                    </Text>
                  </View>

                  {/* Recordatorio */}
                  <View
                    className={`rounded-2xl p-4 mb-4 ${
                      isDark ? 'bg-gray-900/60' : 'bg-white'
                    }`}
                  >
                    <View className="flex-row justify-between items-center">
                      <View className="flex-1 pr-4">
                        <View className="flex-row items-center mb-1">
                          <Text className="text-lg mr-2">🔔</Text>
                          <Text
                            className={`text-sm font-semibold ${
                              isDark ? 'text-white' : 'text-gray-900'
                            }`}
                          >
                            Recordatorio
                          </Text>
                        </View>
                        <Text
                          className={`text-xs ml-7 ${
                            isDark ? 'text-gray-400' : 'text-gray-500'
                          }`}
                        >
                          Notificar antes de la tarea
                        </Text>
                      </View>
                      <Switch
                        value={formState.reminderEnabled}
                        onValueChange={value =>
                          setFormState(prev => ({
                            ...prev,
                            reminderEnabled: value,
                          }))
                        }
                        trackColor={{
                          false: isDark ? '#374151' : '#e5e7eb',
                          true: '#3b82f6',
                        }}
                        thumbColor={
                          formState.reminderEnabled ? '#ffffff' : '#f3f4f6'
                        }
                      />
                    </View>
                    {formState.reminderEnabled && (
                      <AnimatedView
                        animationType="slideDown"
                        delay={0}
                        duration={250}
                      >
                        <View className="mt-3 ml-7">
                          <TextInput
                            keyboardType="number-pad"
                            className={`border-2 rounded-2xl px-4 py-3 ${
                              isDark
                                ? 'bg-gray-800 border-gray-600 text-white'
                                : 'bg-gray-50 border-gray-300 text-gray-900'
                            }`}
                            placeholder="Minutos antes (ej: 60)"
                            placeholderTextColor={
                              isDark ? '#6b7280' : '#9ca3af'
                            }
                            value={formState.reminderMinutes}
                            onChangeText={text =>
                              setFormState(prev => ({
                                ...prev,
                                reminderMinutes: text.replace(/[^0-9]/g, ''),
                              }))
                            }
                          />
                        </View>
                      </AnimatedView>
                    )}
                  </View>

                  {/* Recurrencia */}
                  <View
                    className={`rounded-2xl p-4 ${
                      isDark ? 'bg-gray-900/60' : 'bg-white'
                    }`}
                  >
                    <View className="flex-row justify-between items-center">
                      <View className="flex-1 pr-4">
                        <View className="flex-row items-center mb-1">
                          <Text className="text-lg mr-2">🔄</Text>
                          <Text
                            className={`text-sm font-semibold ${
                              isDark ? 'text-white' : 'text-gray-900'
                            }`}
                          >
                            Repetir tarea
                          </Text>
                        </View>
                        <Text
                          className={`text-xs ml-7 ${
                            isDark ? 'text-gray-400' : 'text-gray-500'
                          }`}
                        >
                          Configura recurrencia si lo necesitas
                        </Text>
                      </View>
                      <Switch
                        value={formState.isRecurring}
                        onValueChange={value =>
                          setFormState(prev => ({
                            ...prev,
                            isRecurring: value,
                            recurrenceType: value
                              ? prev.recurrenceType
                              : 'once',
                          }))
                        }
                        trackColor={{
                          false: isDark ? '#374151' : '#e5e7eb',
                          true: '#3b82f6',
                        }}
                        thumbColor={
                          formState.isRecurring ? '#ffffff' : '#f3f4f6'
                        }
                      />
                    </View>
                  </View>
                </View>
                </AnimatedView>

                {formState.isRecurring && (
                  <AnimatedView
                    animationType="slideUp"
                    delay={0}
                    duration={300}
                  >
                    <View
                      className={`rounded-3xl p-5 border ${
                        isDark
                          ? 'bg-gray-800/50 border-gray-700'
                          : 'bg-gray-50 border-gray-200'
                      }`}
                    >
                    <Text
                      className={`text-base font-bold mb-4 ${
                        isDark ? 'text-white' : 'text-gray-900'
                      }`}
                    >
                      🔄 Configuración de recurrencia
                    </Text>

                    <View className="mb-4">
                      <Text
                        className={`text-sm font-semibold mb-3 ${
                          isDark ? 'text-gray-200' : 'text-gray-700'
                        }`}
                      >
                        Tipo de recurrencia
                      </Text>
                      <View
                        className="flex-row gap-3"
                        style={{
                          flexWrap: responsive.isSmallDevice
                            ? 'wrap'
                            : 'nowrap',
                        }}
                      >
                        {(['daily', 'weekly', 'monthly'] as const).map(
                          (type, index) => {
                            const typeLabels: Record<
                              'daily' | 'weekly' | 'monthly',
                              string
                            > = {
                              daily: 'Diaria',
                              weekly: 'Semanal',
                              monthly: 'Mensual',
                            };
                            return (
                              <AnimatedView
                                key={type}
                                animationType="scale"
                                delay={100 + index * 50}
                                duration={300}
                                style={{
                                  flexGrow: responsive.isSmallDevice ? 0 : 1,
                                  flexShrink: 1,
                                  flexBasis: responsive.isSmallDevice
                                    ? '100%'
                                    : undefined,
                                  minWidth: responsive.isSmallDevice
                                    ? '100%'
                                    : 0,
                                  maxWidth: responsive.isSmallDevice
                                    ? '100%'
                                    : undefined,
                                }}
                              >
                                <TouchableOpacity
                                  onPress={() =>
                                    setFormState(prev => ({
                                      ...prev,
                                      recurrenceType: type as RecurrenceType,
                                    }))
                                  }
                                  className={`px-5 py-3.5 rounded-2xl border-2 ${
                                    formState.recurrenceType === type
                                      ? 'bg-purple-500 border-purple-500'
                                      : isDark
                                      ? 'bg-gray-700 border-gray-600'
                                      : 'bg-white border-gray-300'
                                  }`}
                                  style={{
                                    width: '100%',
                                    marginBottom: responsive.spacing.sm,
                                  }}
                                >
                                  <Text
                                    className={`font-semibold text-center ${
                                      formState.recurrenceType === type
                                        ? 'text-white'
                                        : isDark
                                        ? 'text-gray-100'
                                        : 'text-gray-900'
                                    }`}
                                    style={{
                                      fontSize: responsive.isSmallDevice
                                        ? responsive.fontSize.lg
                                        : responsive.fontSize.xl,
                                    }}
                                    numberOfLines={1}
                                    adjustsFontSizeToFit
                                  >
                                    {typeLabels[type]}
                                  </Text>
                                </TouchableOpacity>
                              </AnimatedView>
                            );
                          },
                        )}
                      </View>
                    </View>

                    <View>
                      <Text
                        className={`text-sm font-semibold mb-2 ${
                          isDark ? 'text-gray-200' : 'text-gray-700'
                        }`}
                      >
                        Intervalo
                      </Text>
                      <TextInput
                        keyboardType="number-pad"
                        className={`border-2 rounded-2xl px-4 py-3 ${
                          isDark
                            ? 'bg-gray-900 border-gray-600 text-white'
                            : 'bg-white border-gray-300 text-gray-900'
                        }`}
                        placeholder="Ej: 2 (cada 2 días/semanas/meses)"
                        placeholderTextColor={isDark ? '#6b7280' : '#9ca3af'}
                        value={formState.recurrenceInterval}
                        onChangeText={text =>
                          setFormState(prev => ({
                            ...prev,
                            recurrenceInterval: text.replace(/[^0-9]/g, ''),
                          }))
                        }
                      />
                    </View>
                  </View>
                  </AnimatedView>
                )}

                {/* Botón de acción */}
                <AnimatedView
                  animationType="fadeIn"
                  delay={300}
                  duration={400}
                >
                  <View className="pt-2 pb-6">
                  <AnimatedButton
                    onPress={onSubmit}
                    disabled={submitting}
                  >
                    <View
                      className={`py-4 rounded-2xl ${
                        submitting ? 'bg-blue-400' : 'bg-blue-600'
                      } shadow-lg`}
                    >
                      <Text className="text-white text-center font-bold text-base">
                        {submitting
                          ? 'Guardando...'
                          : isEditing
                          ? '💾 Guardar cambios'
                          : '✨ Crear tarea'}
                      </Text>
                    </View>
                  </AnimatedButton>
                  </View>
                </AnimatedView>
              </View>
            </ScrollView>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>

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
