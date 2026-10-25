import { useCallback, useEffect, useRef, useState } from 'react';
import { FlatList } from 'react-native';

const HIGHLIGHT_DURATION_MS = 4000;
// Margen para que, tras quitar filtros, la lista termine de dibujarse antes de desplazarla
const SCROLL_DELAY_MS = 300;
// Si el elemento aún no estaba medido, se reintenta una vez cuando la lista lo haya dibujado
const RETRY_DELAY_MS = 150;

/**
 * Lleva la lista hasta un elemento y lo resalta unos segundos (p. ej. al abrir la app
 * desde una notificación). `highlightAt` cambia en cada apertura para repetirlo aunque el
 * elemento sea el mismo.
 *
 * La FlatList solo dibuja lo que está cerca de la pantalla, así que se desplaza por índice;
 * si ese índice aún no está medido, `onScrollToIndexFailed` se acerca y lo reintenta.
 */
export function useHighlightItem<T extends { id: string }>(
  itemId: string | undefined,
  highlightAt: number | undefined,
  isReady: boolean,
  items: T[],
) {
  const listRef = useRef<FlatList<T>>(null);
  const itemsRef = useRef(items);
  itemsRef.current = items;
  const [highlightedId, setHighlightedId] = useState<string | null>(null);

  useEffect(() => {
    if (!itemId || !highlightAt || !isReady) {
      return;
    }
    setHighlightedId(itemId);

    const scrollTimer = setTimeout(() => {
      const index = itemsRef.current.findIndex(item => item.id === itemId);
      if (index < 0) {
        console.warn('[Resaltado] El elemento no está en la lista');
        return;
      }
      listRef.current?.scrollToIndex({ index, animated: true, viewOffset: 16 });
    }, SCROLL_DELAY_MS);
    const clearTimer = setTimeout(() => setHighlightedId(null), HIGHLIGHT_DURATION_MS);

    return () => {
      clearTimeout(scrollTimer);
      clearTimeout(clearTimer);
    };
  }, [itemId, highlightAt, isReady]);

  const onScrollToIndexFailed = useCallback(
    (info: { index: number; averageItemLength: number }) => {
      listRef.current?.scrollToOffset({
        offset: info.index * info.averageItemLength,
        animated: false,
      });
      setTimeout(
        () => listRef.current?.scrollToIndex({ index: info.index, animated: true, viewOffset: 16 }),
        RETRY_DELAY_MS,
      );
    },
    [],
  );

  return { listRef, highlightedId, onScrollToIndexFailed };
}
