import React, { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet } from 'react-native';
import { useThemeColors } from '../theme/colors';

// Aparece rápido para captar la vista; se apaga más despacio para que se note que terminó
const FADE_IN_MS = 150;
const FADE_OUT_MS = 300;

/**
 * Borde de resaltado sobre una tarjeta (al llegar desde una notificación o la búsqueda).
 * Se funde al aparecer y al desaparecer en lugar de cortarse de golpe. Va superpuesto, así
 * que no cambia el tamaño de la tarjeta. El contenedor debe tener `overflow-hidden` y el
 * mismo radio (rounded-2xl). Solo cambia la opacidad: vale también con "Reducir movimiento".
 */
export default function HighlightRing({ visible }: { visible: boolean }) {
  const colors = useThemeColors();
  const opacity = useRef(new Animated.Value(0)).current;
  // Montado mientras se ve o se está apagando; el resto del tiempo no hay vista extra
  const [mounted, setMounted] = useState(visible);

  useEffect(() => {
    if (visible) {
      setMounted(true);
    }
    const animation = Animated.timing(opacity, {
      toValue: visible ? 1 : 0,
      duration: visible ? FADE_IN_MS : FADE_OUT_MS,
      useNativeDriver: true,
    });
    animation.start(({ finished }) => {
      if (finished && !visible) {
        setMounted(false);
      }
    });
    return () => animation.stop();
  }, [visible, opacity]);

  if (!mounted) {
    return null;
  }

  return (
    <Animated.View
      pointerEvents="none"
      importantForAccessibility="no-hide-descendants"
      style={[styles.ring, { borderColor: colors.primary, opacity }]}
    />
  );
}

const styles = StyleSheet.create({
  ring: { ...StyleSheet.absoluteFillObject, borderWidth: 2, borderRadius: 16 },
});
