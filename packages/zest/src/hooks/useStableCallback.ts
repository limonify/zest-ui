'use client';
import * as React from 'react';
import { useRefWithInit } from './useRefWithInit';

type Callback = (...args: any[]) => any;

type Stable<T extends Callback> = {
  /** The next value for callback */
  next: T | undefined;
  /** The function to be called by trampoline. This must fail during the initial render phase. */
  callback: T | undefined;
  trampoline: T;
  effect: () => void;
};

/**
 * Stabilizes the function passed so it's always the same between renders.
 *
 * The function becomes non-reactive to any values it captures.
 * It can safely be passed as a dependency of `React.useMemo` and `React.useEffect` without re-triggering them if its captured values change.
 *
 * The function must only be called inside effects and event handlers, never during render (which throws an error).
 */
export function useStableCallback<T extends Callback>(callback: T | undefined): T {
  const stable = useRefWithInit(createStableCallback).current;
  stable.next = callback;
  React.useInsertionEffect(stable.effect);
  return stable.trampoline;
}

function createStableCallback() {
  const stable: Stable<any> = {
    next: undefined,
    callback: assertNotCalled,
    trampoline: (...args: []) => stable.callback?.(...args),
    effect: () => {
      stable.callback = stable.next;
    },
  };
  return stable;
}

function assertNotCalled() {
  if (process.env.NODE_ENV !== 'production') {
    throw new Error('Zest: Cannot call an event handler while rendering.');
  }
}
