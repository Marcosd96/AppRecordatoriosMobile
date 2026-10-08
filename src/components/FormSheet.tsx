import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Modal,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from 'react-native';
import { useResponsive } from '../hooks/useResponsive';

interface FormSheetProps {
  visible: boolean;
  isDark: boolean;
  title: string;
  subtitle?: string;
  /** Desactiva el botón de cerrar (p. ej. mientras se guarda) */
  closeDisabled?: boolean;
  onClose: () => void;
  /** Botones fijos al pie, siempre visibles aunque el formulario sea largo */
  footer: React.ReactNode;
  children: React.ReactNode;
}

/**
 * Hoja inferior para formularios (en tablet, centrada): cabecera con título y botón
 * de cerrar, contenido desplazable y acciones fijas al pie.
 */
export default function FormSheet({
  visible,
  isDark,
  title,
  subtitle,
  closeDisabled,
  onClose,
  footer,
  children,
}: FormSheetProps) {
  const responsive = useResponsive();
  const { isTablet } = responsive;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
      >
        <View className={`flex-1 bg-black/50 ${isTablet ? 'justify-center px-8' : 'justify-end'}`}>
          <View
            className={`w-full self-center ${isTablet ? 'rounded-3xl' : 'rounded-t-3xl'} ${
              isDark ? 'bg-gray-900' : 'bg-white'
            }`}
            style={[
              styles.sheet,
              isTablet && { maxWidth: Math.min(responsive.width * 0.8, 640) },
            ]}
          >
            {/* Asa: indica que es una hoja */}
            {!isTablet && (
              <View className="items-center pt-2">
                <View className={`h-1 w-10 rounded-full ${isDark ? 'bg-gray-700' : 'bg-gray-300'}`} />
              </View>
            )}

            <View
              className={`flex-row items-start border-b ${
                isDark ? 'border-gray-800' : 'border-gray-100'
              }`}
              style={{
                paddingHorizontal: responsive.spacing.lg,
                paddingTop: responsive.spacing.md,
                paddingBottom: responsive.spacing.md,
              }}
            >
              <View className="flex-1 pr-4">
                <Text
                  accessibilityRole="header"
                  className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}
                >
                  {title}
                </Text>
                {subtitle ? (
                  <Text className={`text-sm mt-0.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    {subtitle}
                  </Text>
                ) : null}
              </View>
              <TouchableOpacity
                onPress={onClose}
                accessibilityRole="button"
                accessibilityLabel="Cerrar"
                disabled={closeDisabled}
                hitSlop={8}
                className={`h-9 w-9 rounded-full items-center justify-center ${
                  isDark ? 'bg-gray-800' : 'bg-gray-100'
                }`}
              >
                <Text
                  className={`text-base ${isDark ? 'text-gray-300' : 'text-gray-600'}`}
                  // El texto es solo un icono: la etiqueta la pone el botón
                  importantForAccessibility="no"
                >
                  ✕
                </Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{
                paddingHorizontal: responsive.spacing.lg,
                paddingTop: responsive.spacing.md,
                paddingBottom: responsive.spacing.md,
              }}
            >
              {children}
            </ScrollView>

            <View
              className={`border-t ${isDark ? 'border-gray-800' : 'border-gray-100'}`}
              style={{
                paddingHorizontal: responsive.spacing.lg,
                paddingTop: responsive.spacing.sm + 4,
                paddingBottom: isTablet ? responsive.spacing.lg : responsive.spacing.xl,
              }}
            >
              {footer}
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

interface FormFieldProps {
  isDark: boolean;
  label: string;
  required?: boolean;
  optional?: boolean;
  hint?: string;
  children: React.ReactNode;
}

/** Etiqueta + control + ayuda opcional, con el mismo espaciado en todos los formularios */
export function FormField({ isDark, label, required, optional, hint, children }: FormFieldProps) {
  return (
    <View className="mb-5">
      <Text className={`text-sm font-semibold mb-2 ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
        {label}
        {required ? <Text className="text-red-500"> *</Text> : null}
        {optional ? (
          <Text className="text-xs font-normal text-gray-500"> (opcional)</Text>
        ) : null}
      </Text>
      {children}
      {hint ? (
        <Text className="text-xs mt-1.5 text-gray-500">{hint}</Text>
      ) : null}
    </View>
  );
}

/** Clases de un TextInput de formulario según el tema */
export const inputClassName = (isDark: boolean) =>
  `border rounded-xl px-4 py-3 text-base ${
    isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'
  }`;

export const placeholderColor = (isDark: boolean) => (isDark ? '#6b7280' : '#9ca3af');

const styles = StyleSheet.create({
  sheet: { maxHeight: '92%' },
});
