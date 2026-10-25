import React from 'react';
import { Pressable } from 'react-native';
import { useThemeColors } from '../theme/colors';
import { useFocusRing } from '../hooks/useFocusRing';
import FocusRing from './FocusRing';

interface IconButtonProps {
  /** Obligatoria: el botón no tiene texto visible */
  accessibilityLabel: string;
  onPress: () => void;
  /** Recibe el color del icono según el tema */
  renderIcon: (color: string) => React.ReactNode;
  disabled?: boolean;
}

/** Botón solo icono de 48 × 48 dp, con ripple circular y anillo de foco */
export default function IconButton({
  accessibilityLabel,
  onPress,
  renderIcon,
  disabled,
}: IconButtonProps) {
  const colors = useThemeColors();
  const { focused, focusProps } = useFocusRing();

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled: !!disabled }}
      {...focusProps}
      // Ripple recortado al círculo: con `borderless` el resaltado de foco nativo salía cuadrado
      android_ripple={{ color: colors.ripple }}
      className={`h-12 w-12 items-center justify-center rounded-full overflow-hidden ${
        disabled ? 'opacity-40' : ''
      }`}
    >
      {renderIcon(colors.onSurface)}
      <FocusRing visible={focused} radius={24} />
    </Pressable>
  );
}
