import { useCallback, useMemo, useState } from 'react';

/**
 * Si el control tiene el foco del teclado o del D-pad (Tab, flechas, Chromebook). El toque no
 * da foco en Android, así que el anillo solo aparece al navegar con teclado. Las props se
 * pasan al `Pressable`/`Touchable` y el estado, a `FocusRing`.
 */
export function useFocusRing() {
  const [focused, setFocused] = useState(false);
  const onFocus = useCallback(() => setFocused(true), []);
  const onBlur = useCallback(() => setFocused(false), []);
  const focusProps = useMemo(() => ({ onFocus, onBlur }), [onFocus, onBlur]);
  return { focused, focusProps };
}
