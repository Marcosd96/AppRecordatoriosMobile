import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { useIsOnline } from '../hooks/queries';
import { darkColors } from '../theme/colors';

export interface SnackbarMessage {
  message: string;
  /** Acción opcional, normalmente "Deshacer" */
  actionLabel?: string;
  onAction?: () => void;
}

interface SnackbarContextType {
  showSnackbar: (snackbar: SnackbarMessage) => void;
}

// Fuera de un SnackbarProvider no hace nada (p. ej. en pantallas que aún no lo usan)
const SnackbarContext = createContext<SnackbarContextType>({ showSnackbar: () => {} });

// Material 3: 4 s sin acción; con acción, algo más para que dé tiempo a pulsarla
export const SNACKBAR_DURATION_MS = 4000;
export const SNACKBAR_WITH_ACTION_DURATION_MS = 6000;

/**
 * Mensajes breves al pie de la pantalla para confirmar una acción sin interrumpir.
 * Sustituye a los diálogos "Éxito". Uno a la vez: un mensaje nuevo reemplaza al anterior.
 */
export function SnackbarProvider({
  children,
  bottomOffset,
}: {
  children: React.ReactNode;
  /** Distancia al borde inferior (p. ej. la altura de la barra de pestañas) */
  bottomOffset: number;
}) {
  const [current, setCurrent] = useState<(SnackbarMessage & { id: number }) | null>(null);
  const opacity = useRef(new Animated.Value(0)).current;
  const nextId = useRef(0);
  // Sin conexión, el aviso de OfflineBanner ocupa el mismo sitio: el mensaje se coloca encima
  const isOnline = useIsOnline();
  const offlineBannerSpace = isOnline ? 0 : 48;

  const showSnackbar = useCallback((snackbar: SnackbarMessage) => {
    nextId.current += 1;
    setCurrent({ ...snackbar, id: nextId.current });
    // TalkBack no lee por sí solo un elemento que aparece fuera del foco
    AccessibilityInfo.announceForAccessibility(snackbar.message);
  }, []);

  const dismiss = useCallback(() => setCurrent(null), []);

  useEffect(() => {
    if (!current) {
      return;
    }
    opacity.setValue(0);
    Animated.timing(opacity, { toValue: 1, duration: 150, useNativeDriver: true }).start();
    const timer = setTimeout(
      dismiss,
      current.actionLabel ? SNACKBAR_WITH_ACTION_DURATION_MS : SNACKBAR_DURATION_MS,
    );
    return () => clearTimeout(timer);
  }, [current, dismiss, opacity]);

  const value = useMemo(() => ({ showSnackbar }), [showSnackbar]);

  return (
    <SnackbarContext.Provider value={value}>
      {children}
      {current ? (
        <Animated.View
          pointerEvents="box-none"
          className="absolute left-0 right-0 items-center px-4"
          style={{ bottom: bottomOffset + offlineBannerSpace + 8, opacity }}
        >
          {/* Superficie invertida de M3: contrasta con la pantalla en ambos temas */}
          <View
            className="flex-row items-center w-full rounded-lg bg-gray-800 pl-4 min-h-12"
            style={styles.surface}
            accessibilityLiveRegion="polite"
          >
            <Text className="flex-1 py-3 text-sm text-white">{current.message}</Text>
            {current.actionLabel && current.onAction ? (
              <Pressable
                onPress={() => {
                  current.onAction?.();
                  dismiss();
                }}
                accessibilityRole="button"
                android_ripple={{ color: darkColors.ripple }}
                className="px-4 min-h-12 justify-center"
              >
                <Text className="text-sm font-semibold text-blue-300">{current.actionLabel}</Text>
              </Pressable>
            ) : (
              <View className="w-4" />
            )}
          </View>
        </Animated.View>
      ) : null}
    </SnackbarContext.Provider>
  );
}

export function useSnackbar(): SnackbarContextType {
  return useContext(SnackbarContext);
}

const styles = StyleSheet.create({
  // En pantallas anchas no se estira de lado a lado
  surface: { maxWidth: 560 },
});
