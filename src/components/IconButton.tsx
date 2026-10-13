import React from 'react';
import { Pressable } from 'react-native';
import { useThemeColors } from '../theme/colors';

interface IconButtonProps {
  /** Obligatoria: el botón no tiene texto visible */
  accessibilityLabel: string;
  onPress: () => void;
  /** Recibe el color del icono según el tema */
  renderIcon: (color: string) => React.ReactNode;
  disabled?: boolean;
}

/** Botón solo icono de 48 × 48 dp, con ripple circular en Android */
export default function IconButton({
  accessibilityLabel,
  onPress,
  renderIcon,
  disabled,
}: IconButtonProps) {
  const colors = useThemeColors();

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled: !!disabled }}
      android_ripple={{ color: colors.ripple, borderless: true, radius: 24 }}
      className={`h-12 w-12 items-center justify-center rounded-full ${disabled ? 'opacity-40' : ''}`}
    >
      {renderIcon(colors.onSurface)}
    </Pressable>
  );
}
