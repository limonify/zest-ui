/** @type {import('jest').Config} */
module.exports = {
  preset: 'jest-expo',
  testMatch: ['<rootDir>/src/**/*.test.(ts|tsx)'],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  // jest-expo's default pattern handles .pnpm but not bun's isolated ".bun"
  // store layout, so RN/Expo sources under node_modules/.bun/<pkg>/node_modules
  // would be excluded from transformation.
  transformIgnorePatterns: [
    '/node_modules/(?!(\\.pnpm|\\.bun|react-native|react-native-gesture-handler|@react-native|@react-native-community|expo|@expo|@expo-google-fonts|react-navigation|@react-navigation|@sentry/react-native|native-base|standard-navigation))',
    '/node_modules/react-native-reanimated/plugin/',
    '/node_modules/@react-native/babel-preset/',
  ],
};
