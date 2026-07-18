'use client';
import * as React from 'react';

const noop = () => {};

/*
 * `window` is defined in every client React Native runtime: InitializeCore
 * aliases it to `global` on native, react-native's jest setup does the same,
 * and it's native on react-native-web. It is only missing during
 * react-native-web server rendering, which is exactly when layout effects
 * must not run.
 */
export const useIsoLayoutEffect = typeof window !== 'undefined' ? React.useLayoutEffect : noop;
