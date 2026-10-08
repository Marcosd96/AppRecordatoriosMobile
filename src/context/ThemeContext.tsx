import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useColorScheme, Appearance } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

type ColorScheme = 'light' | 'dark';
export type ThemePreference = 'system' | 'light' | 'dark';

export const THEME_PREFERENCE_KEY = 'theme_preference';

// El sistema puede devolver null o 'unspecified': en ese caso se usa el tema claro
const toColorScheme = (scheme: string | null | undefined): ColorScheme =>
  scheme === 'dark' ? 'dark' : 'light';

/** Tema que se aplica según lo elegido por el usuario y el tema del sistema */
export const resolveColorScheme = (
  preference: ThemePreference,
  systemScheme: string | null | undefined,
): ColorScheme => (preference === 'system' ? toColorScheme(systemScheme) : preference);

export const parseThemePreference = (value: string | null): ThemePreference =>
  value === 'light' || value === 'dark' ? value : 'system';

interface ThemeContextType {
  colorScheme: ColorScheme;
  isDark: boolean;
  preference: ThemePreference;
  setPreference: (preference: ThemePreference) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  colorScheme: 'light',
  isDark: false,
  preference: 'system',
  setPreference: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // useColorScheme ya se actualiza solo cuando cambia el tema del sistema
  const systemColorScheme = useColorScheme();
  const [preference, setPreferenceState] = useState<ThemePreference>('system');

  useEffect(() => {
    AsyncStorage.getItem(THEME_PREFERENCE_KEY)
      .then(stored => setPreferenceState(parseThemePreference(stored)))
      .catch(error => console.error('Error leyendo la preferencia de tema:', error));
  }, []);

  useEffect(() => {
    // Forzar también el tema de los componentes nativos (selector de fecha, diálogos…);
    // 'unspecified' vuelve a seguir al sistema
    Appearance.setColorScheme(preference === 'system' ? 'unspecified' : preference);
  }, [preference]);

  const setPreference = useCallback((next: ThemePreference) => {
    setPreferenceState(next);
    AsyncStorage.setItem(THEME_PREFERENCE_KEY, next).catch(error =>
      console.error('Error guardando la preferencia de tema:', error),
    );
  }, []);

  const value = useMemo(() => {
    const colorScheme = resolveColorScheme(preference, systemColorScheme);
    return { colorScheme, isDark: colorScheme === 'dark', preference, setPreference };
  }, [preference, systemColorScheme, setPreference]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}
