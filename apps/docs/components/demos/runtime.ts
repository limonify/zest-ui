/**
 * Metro defines `__DEV__`; web bundlers do not, and React Native packages read
 * it at module scope — so importing one without this crashes with
 * `__DEV__ is not defined`.
 *
 * This has to be evaluated before anything React Native, which is why every
 * module that pulls one in imports it first. The type is already declared by
 * `@types/react-native`, so this only assigns.
 */
const g = globalThis as typeof globalThis & { __DEV__?: boolean };

g.__DEV__ ??= process.env.NODE_ENV !== 'production';

export {};
