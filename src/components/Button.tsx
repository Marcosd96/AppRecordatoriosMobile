import React from 'react';
import { ActivityIndicator, Platform, Pressable, Text, View } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useThemeColors } from '../theme/colors';

export type ButtonVariant = 'filled' | 'tonal' | 'secondary' | 'text' | 'destructive';

interface ButtonProps {
  /** Verbo concreto: "Guardar tarea", no "OK" */
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  /** `medium` (40 dp, área táctil de 48) para cabeceras y filas; `large` (48 dp) para pies de hoja */
  size?: 'medium' | 'large';
  /** Recibe el color del contenido según la variante */
  renderIcon?: (color: string) => React.ReactNode;
  /** Acción en curso: muestra un indicador y no admite otra pulsación */
  busy?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  accessibilityLabel?: string;
  accessibilityHint?: string;
}

const containerClasses = (variant: ButtonVariant, isDark: boolean): string => {
  switch (variant) {
    case 'filled':
      return 'bg-blue-600';
    case 'tonal':
      return isDark ? 'bg-blue-500/15' : 'bg-blue-50';
    case 'secondary':
      return isDark ? 'bg-gray-700' : 'bg-gray-100';
    case 'destructive':
      return 'bg-red-600';
    case 'text':
      return '';
  }
};

const labelClasses = (variant: ButtonVariant, isDark: boolean): string => {
  switch (variant) {
    case 'filled':
    case 'destructive':
      return 'text-white';
    case 'tonal':
      return isDark ? 'text-blue-300' : 'text-blue-700';
    case 'secondary':
      return isDark ? 'text-gray-200' : 'text-gray-700';
    case 'text':
      return isDark ? 'text-blue-400' : 'text-blue-600';
  }
};

/**
 * Botón con texto del sistema de diseño (COMPONENT_GUIDELINES §2).
 * Pulsación con ripple nativo en Android y atenuación en iOS; deshabilitado al 38 %.
 */
export default function Button({
  label,
  onPress,
  variant = 'filled',
  size = 'medium',
  renderIcon,
  busy = false,
  disabled = false,
  fullWidth = false,
  accessibilityLabel,
  accessibilityHint,
}: ButtonProps) {
  const { isDark } = useTheme();
  const colors = useThemeColors();
  const inactive = disabled || busy;
  const onFilled = variant === 'filled' || variant === 'destructive';

  const contentColor = onFilled
    ? colors.onPrimary
    : variant === 'tonal'
    ? colors.onPrimaryContainer
    : variant === 'secondary'
    ? colors.secondary
    : colors.primary;

  return (
    <Pressable
      onPress={onPress}
      disabled={inactive}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: inactive, busy }}
      android_ripple={{ color: onFilled ? colors.rippleOnFilled : colors.ripple }}
      // El botón mediano mide 40 dp; el área táctil llega a 48
      hitSlop={size === 'medium' ? 4 : 0}
      className={`flex-row items-center justify-center rounded-xl overflow-hidden ${
        size === 'large' ? 'min-h-12 px-6' : 'min-h-10 px-4'
      } ${fullWidth ? 'w-full' : ''} ${containerClasses(variant, isDark)} ${
        disabled && !busy ? 'opacity-40' : ''
      }`}
    >
      {({ pressed }) => (
        // En iOS no hay ripple: el contenido se atenúa al pulsar
        <View style={pressed && Platform.OS === 'ios' ? pressedStyle : undefined}>
          {/* El contenido se mantiene (invisible) durante la carga para que el botón no cambie de tamaño */}
          <View className={`flex-row items-center py-2 ${busy ? 'opacity-0' : ''}`}>
            {renderIcon ? <View className="mr-2">{renderIcon(contentColor)}</View> : null}
            <Text className={`text-sm font-semibold text-center ${labelClasses(variant, isDark)}`}>
              {label}
            </Text>
          </View>
          {busy ? (
            <View className="absolute inset-0 items-center justify-center">
              <ActivityIndicator size="small" color={contentColor} />
            </View>
          ) : null}
        </View>
      )}
    </Pressable>
  );
}

const pressedStyle = { opacity: 0.85 };
