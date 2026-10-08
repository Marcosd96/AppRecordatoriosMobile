/**
 * @format
 */

import React from 'react';
import { Appearance, Text } from 'react-native';
import ReactTestRenderer from 'react-test-renderer';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  THEME_PREFERENCE_KEY,
  ThemePreference,
  ThemeProvider,
  parseThemePreference,
  resolveColorScheme,
  useTheme,
} from '../src/context/ThemeContext';

describe('resolveColorScheme', () => {
  it('sigue al sistema solo con la preferencia "system"', () => {
    expect(resolveColorScheme('system', 'dark')).toBe('dark');
    expect(resolveColorScheme('system', 'light')).toBe('light');
    expect(resolveColorScheme('light', 'dark')).toBe('light');
    expect(resolveColorScheme('dark', 'light')).toBe('dark');
  });

  it('usa el tema claro si el sistema no indica ninguno', () => {
    expect(resolveColorScheme('system', null)).toBe('light');
    expect(resolveColorScheme('system', 'unspecified')).toBe('light');
  });
});

describe('parseThemePreference', () => {
  it('acepta solo valores conocidos y si no, sigue al sistema', () => {
    expect(parseThemePreference('dark')).toBe('dark');
    expect(parseThemePreference('light')).toBe('light');
    expect(parseThemePreference(null)).toBe('system');
    expect(parseThemePreference('azul')).toBe('system');
  });
});

describe('ThemeProvider', () => {
  let setPreference: (preference: ThemePreference) => void = () => {};

  function Probe() {
    const theme = useTheme();
    setPreference = theme.setPreference;
    return <Text>{`${theme.preference}:${theme.colorScheme}`}</Text>;
  }

  const renderProvider = async () => {
    let renderer!: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(
        <ThemeProvider>
          <Probe />
        </ThemeProvider>,
      );
    });
    return () => renderer.root.findByType(Text).props.children;
  };

  beforeEach(async () => {
    await AsyncStorage.clear();
    jest.spyOn(Appearance, 'setColorScheme').mockImplementation(() => {});
  });
  afterEach(() => jest.restoreAllMocks());

  it('recupera la preferencia guardada al iniciar', async () => {
    await AsyncStorage.setItem(THEME_PREFERENCE_KEY, 'dark');
    const text = await renderProvider();
    expect(text()).toBe('dark:dark');
    expect(Appearance.setColorScheme).toHaveBeenLastCalledWith('dark');
  });

  it('guarda la preferencia elegida y aplica el tema', async () => {
    const text = await renderProvider();
    await ReactTestRenderer.act(async () => setPreference('light'));
    expect(text()).toBe('light:light');
    expect(await AsyncStorage.getItem(THEME_PREFERENCE_KEY)).toBe('light');

    await ReactTestRenderer.act(async () => setPreference('system'));
    expect(Appearance.setColorScheme).toHaveBeenLastCalledWith('unspecified');
  });
});
