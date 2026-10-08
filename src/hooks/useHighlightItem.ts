import { useCallback, useEffect, useRef, useState } from 'react';
import { ScrollView, View } from 'react-native';

const HIGHLIGHT_DURATION_MS = 4000;
// Margen para que, tras quitar filtros, la lista termine de dibujarse antes de medir
const SCROLL_DELAY_MS = 300;

export const highlightStyle = { borderColor: '#3b82f6', borderWidth: 2 };

/**
 * Lleva la lista hasta un elemento y lo resalta unos segundos (p. ej. al abrir la app
 * desde una notificación). `highlightAt` cambia en cada apertura para repetirlo aunque el
 * elemento sea el mismo.
 */
export function useHighlightItem(
  itemId: string | undefined,
  highlightAt: number | undefined,
  isReady: boolean,
) {
  const scrollRef = useRef<ScrollView>(null);
  const itemRefs = useRef(new Map<string, View>());
  const [highlightedId, setHighlightedId] = useState<string | null>(null);

  useEffect(() => {
    if (!itemId || !highlightAt || !isReady) {
      return;
    }
    setHighlightedId(itemId);

    const scrollTimer = setTimeout(() => {
      const item = itemRefs.current.get(itemId);
      // getInnerViewRef existe en RN 0.82 pero falta en sus tipos (.d.ts)
      const scrollView = scrollRef.current as
        | (ScrollView & { getInnerViewRef?: () => View | null })
        | null;
      const content = scrollView?.getInnerViewRef?.();
      if (!item || !content) {
        return;
      }
      item.measureLayout(
        content,
        (_x, y) => scrollRef.current?.scrollTo({ y: Math.max(y - 16, 0), animated: true }),
        () => console.warn('[Notificaciones] No se pudo ubicar el elemento en la lista'),
      );
    }, SCROLL_DELAY_MS);
    const clearTimer = setTimeout(() => setHighlightedId(null), HIGHLIGHT_DURATION_MS);

    return () => {
      clearTimeout(scrollTimer);
      clearTimeout(clearTimer);
    };
  }, [itemId, highlightAt, isReady]);

  const registerItem = useCallback(
    (id: string) => (ref: View | null) => {
      if (ref) {
        itemRefs.current.set(id, ref);
      } else {
        itemRefs.current.delete(id);
      }
    },
    [],
  );

  return { scrollRef, registerItem, highlightedId };
}
