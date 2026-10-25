import { useCallback, useEffect, useState } from 'react';
import { AccessibilityInfo, LayoutAnimation, Platform, UIManager } from 'react-native';

// Las animaciones de layout están desactivadas por defecto en Android con la arquitectura antigua
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

/**
 * Si el usuario activó "Reducir movimiento" (o "Quitar animaciones") en el sistema.
 * Con él activo no hay desplazamientos, escalas ni rebotes: como mucho, fundidos.
 */
export function useReducedMotion(): boolean {
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isReduceMotionEnabled()
      .then(enabled => {
        if (mounted) {
          setReduceMotion(enabled);
        }
      })
      .catch(() => {});
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    return () => {
      mounted = false;
      subscription.remove();
    };
  }, []);

  return reduceMotion;
}

// Duración de entrada de hoja/diálogo (DESIGN_SYSTEM §9): suficiente para seguir el cambio
const LIST_TRANSITION = LayoutAnimation.create(
  250,
  LayoutAnimation.Types.easeInEaseOut,
  LayoutAnimation.Properties.opacity,
);

/**
 * Prepara una transición para el siguiente cambio de la lista: lo que entra o sale se funde
 * y el resto se recoloca, así se ve adónde fue un elemento (p. ej. al completarlo pasa al
 * final). Se llama justo antes del cambio de estado. Con "Reducir movimiento" no anima.
 */
export function useListTransition(): () => void {
  const reduceMotion = useReducedMotion();
  return useCallback(() => {
    if (!reduceMotion) {
      LayoutAnimation.configureNext(LIST_TRANSITION);
    }
  }, [reduceMotion]);
}
