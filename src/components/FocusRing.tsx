import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useThemeColors } from '../theme/colors';

interface FocusRingProps {
  visible: boolean;
  /** Radio del control (rounded-xl = 12, rounded-2xl = 16, rounded-full = la mitad del alto) */
  radius?: number;
  /** Sobre un relleno `primary` (botón, chip elegido) el anillo va en `onPrimary` para verse */
  onFilled?: boolean;
}

/**
 * Anillo de foco de 2 dp (DESIGN_SYSTEM §2.4). Va superpuesto dentro del control, así que no
 * cambia su tamaño ni lo recorta un `overflow-hidden`. Se usa con `useFocusRing`.
 */
export default function FocusRing({ visible, radius = 0, onFilled = false }: FocusRingProps) {
  const colors = useThemeColors();
  if (!visible) {
    return null;
  }
  return (
    <View
      pointerEvents="none"
      importantForAccessibility="no-hide-descendants"
      style={[
        styles.ring,
        { borderRadius: radius, borderColor: onFilled ? colors.onPrimary : colors.primary },
      ]}
    />
  );
}

const styles = StyleSheet.create({
  ring: { ...StyleSheet.absoluteFillObject, borderWidth: 2 },
});
