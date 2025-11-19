module.exports = {
  preset: 'react-native',
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': '<rootDir>/__mocks__/styleMock.js',
    '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$':
      '<rootDir>/__mocks__/fileMock.js',
    '^@notifee/react-native$': '<rootDir>/__mocks__/@notifee/react-native.js',
    '^@react-native-google-signin/google-signin$': '<rootDir>/__mocks__/@react-native-google-signin/google-signin.js',
    '^@react-native-community/datetimepicker$': '<rootDir>/__mocks__/@react-native-community/datetimepicker.js',
  },
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|@react-navigation|@notifee|nativewind|tailwindcss|react-native-css-interop|@react-native-community|@react-native-google-signin)/)',
  ],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
};
