'use client';
import * as React from 'react';
import { EMPTY_ARRAY } from '../utils/empty';

/**
 * A React.useEffect equivalent that runs once, when the component is mounted.
 */
export function useOnMount(fn: React.EffectCallback) {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  React.useEffect(fn, EMPTY_ARRAY);
}
