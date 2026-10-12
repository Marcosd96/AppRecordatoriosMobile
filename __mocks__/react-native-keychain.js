// Mock de react-native-keychain: guarda las credenciales en memoria, por servicio
const store = new Map();

module.exports = {
  ACCESSIBLE: { AFTER_FIRST_UNLOCK: 'AccessibleAfterFirstUnlock' },
  setGenericPassword: jest.fn(async (username, password, options = {}) => {
    store.set(options.service, { username, password, service: options.service });
    return { service: options.service, storage: 'mock' };
  }),
  getGenericPassword: jest.fn(async (options = {}) => store.get(options.service) || false),
  resetGenericPassword: jest.fn(async (options = {}) => store.delete(options.service)),
  __reset: () => store.clear(),
};
