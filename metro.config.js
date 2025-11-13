const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');
const { withNativeWind } = require('nativewind/metro');

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */
const defaultConfig = getDefaultConfig(__dirname);

const config = {
  ...defaultConfig,
  resolver: {
    ...defaultConfig.resolver,
    // Asegurar que Metro resuelva correctamente los módulos ES6
    sourceExts: [...(defaultConfig.resolver?.sourceExts || []), 'js', 'jsx', 'ts', 'tsx'],
  },
};

module.exports = withNativeWind(mergeConfig(config, {}), { input: './global.css' });
