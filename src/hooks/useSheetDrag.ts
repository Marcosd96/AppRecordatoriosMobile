import { useEffect, useMemo, useRef } from 'react';
import { Animated, LayoutChangeEvent, PanResponder } from 'react-native';
import { useReducedMotion } from './useReducedMotion';

// Fracción de la altura de la hoja que hay que arrastrar para cerrarla al soltar
const DISMISS_FRACTION = 0.3;
// Un gesto rápido hacia abajo la cierra aunque no llegue a esa distancia (px/ms)
const DISMISS_VELOCITY = 1;
// Hacia arriba la hoja no crece: cede un poco, con resistencia, y vuelve
const PULL_UP_RESISTANCE = 0.25;
const MAX_PULL_UP = 32;
// Un toque (p. ej. en la X) no debe empezar un arrastre
const DRAG_START_DISTANCE = 6;
const DISMISS_DURATION_MS = 200;
const RETURN_DURATION_MS = 150;

/** Desplazamiento de la hoja para un arrastre de `dy` px: abajo, 1:1; arriba, elástico */
export function sheetOffset(dy: number): number {
  return dy >= 0 ? dy : Math.max(dy * PULL_UP_RESISTANCE, -MAX_PULL_UP);
}

/** Si al soltar la hoja se cierra: pasó un tercio de su altura o se lanzó hacia abajo */
export function shouldDismissSheet(dy: number, vy: number, height: number): boolean {
  if (dy <= 0) {
    return false;
  }
  return dy > height * DISMISS_FRACTION || vy > DISMISS_VELOCITY;
}

/**
 * Arrastrar una hoja inferior hacia abajo para cerrarla (M3 *modal bottom sheet*). Los
 * `panHandlers` van en el asa y la cabecera, no en el contenido, para no chocar con su
 * desplazamiento. Es un atajo: la X y Atrás siguen cerrando la hoja.
 *
 * - `disabled` (p. ej. mientras se guarda): se puede arrastrar, pero siempre vuelve.
 * - Con "Reducir movimiento" vuelve sin rebote.
 */
export function useSheetDrag({
  visible,
  onClose,
  disabled = false,
  enabled = true,
}: {
  visible: boolean;
  onClose: () => void;
  disabled?: boolean;
  /** false en tablet, donde la hoja es un diálogo centrado */
  enabled?: boolean;
}) {
  const reduceMotion = useReducedMotion();
  const translateY = useRef(new Animated.Value(0)).current;
  const height = useRef(0);

  // Las props cambian entre renders; el PanResponder se crea una vez y las lee de aquí
  const latest = useRef({ onClose, disabled, reduceMotion });
  latest.current = { onClose, disabled, reduceMotion };

  // Cada apertura empieza en su sitio, aunque la anterior se cerrara arrastrando
  useEffect(() => {
    if (visible) {
      translateY.setValue(0);
    }
  }, [visible, translateY]);

  const panResponder = useMemo(() => {
    const moveBack = () => {
      if (latest.current.reduceMotion) {
        Animated.timing(translateY, {
          toValue: 0,
          duration: RETURN_DURATION_MS,
          useNativeDriver: true,
        }).start();
      } else {
        Animated.spring(translateY, { toValue: 0, bounciness: 4, useNativeDriver: true }).start();
      }
    };

    const isVerticalDrag = (dx: number, dy: number) =>
      Math.abs(dy) > DRAG_START_DISTANCE && Math.abs(dy) > Math.abs(dx);

    return PanResponder.create({
      // La cabecera toma el gesto desde el primer toque (en burbuja: la X, más profunda, lo
      // recibe antes y sigue funcionando). Sin esto otra vista se quedaba el gesto y los
      // movimientos nunca llegaban a la hoja. Un toque sin arrastre la deja donde está
      onStartShouldSetPanResponder: () => true,
      // En captura: el arrastre empieza aunque el dedo esté sobre la X o el título
      onMoveShouldSetPanResponderCapture: (_, { dx, dy }) => isVerticalDrag(dx, dy),
      onMoveShouldSetPanResponder: (_, { dx, dy }) => isVerticalDrag(dx, dy),
      onPanResponderMove: (_, { dy }) => translateY.setValue(sheetOffset(dy)),
      onPanResponderRelease: (_, { dy, vy }) => {
        if (!latest.current.disabled && shouldDismissSheet(dy, vy, height.current)) {
          Animated.timing(translateY, {
            toValue: height.current,
            duration: DISMISS_DURATION_MS,
            useNativeDriver: true,
          }).start(() => latest.current.onClose());
        } else {
          moveBack();
        }
      },
      onPanResponderTerminate: moveBack,
    });
  }, [translateY]);

  const onLayout = (event: LayoutChangeEvent) => {
    height.current = event.nativeEvent.layout.height;
  };

  return {
    /** Para el `transform` de la hoja */
    sheetStyle: enabled ? { transform: [{ translateY }] } : undefined,
    /** Para el asa y la cabecera */
    dragHandlers: enabled ? panResponder.panHandlers : {},
    onLayout,
  };
}
