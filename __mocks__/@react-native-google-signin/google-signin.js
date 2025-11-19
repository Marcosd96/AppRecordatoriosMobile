// Mock para @react-native-google-signin/google-signin
const mockGoogleSignin = {
  configure: jest.fn(() => Promise.resolve()),
  hasPlayServices: jest.fn(() => Promise.resolve(true)),
  signIn: jest.fn(() => Promise.resolve({ user: { id: '123', email: 'test@example.com' } })),
  signInSilently: jest.fn(() => Promise.resolve({ user: { id: '123', email: 'test@example.com' } })),
  signOut: jest.fn(() => Promise.resolve()),
  revokeAccess: jest.fn(() => Promise.resolve()),
  isSignedIn: jest.fn(() => Promise.resolve(false)),
  getCurrentUser: jest.fn(() => Promise.resolve(null)),
  clearCachedAccessToken: jest.fn(() => Promise.resolve(null)),
  getTokens: jest.fn(() => Promise.resolve({ accessToken: 'mock-token' })),
  addScopes: jest.fn(() => Promise.resolve(null)),
  requestPermissions: jest.fn(() => Promise.resolve(null)),
};

module.exports = {
  GoogleSignin: mockGoogleSignin,
  statusCodes: {
    SIGN_IN_CANCELLED: 'SIGN_IN_CANCELLED',
    IN_PROGRESS: 'IN_PROGRESS',
    PLAY_SERVICES_NOT_AVAILABLE: 'PLAY_SERVICES_NOT_AVAILABLE',
  },
};

