module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      'module:@react-native/babel-preset',
      'nativewind/babel',
    ],
    env: {
      production: {
        // Los console.log de depuración no llegan a la app publicada; los errores y avisos sí
        plugins: [['transform-remove-console', { exclude: ['error', 'warn'] }]],
      },
    },
  };
};
