import * as React from 'react';
import type { ReadonlyStore } from './Store';

/*
 * Simplified from Base UI's useStore: zest requires React >= 19, so the
 * `use-sync-external-store` shim and the `fastHooks` batching layer are omitted.
 */

export function useStore<State, Value>(
  store: ReadonlyStore<State>,
  selector: (state: State) => Value,
): Value;
export function useStore<State, Value, A1>(
  store: ReadonlyStore<State>,
  selector: (state: State, a1: A1) => Value,
  a1: A1,
): Value;
export function useStore<State, Value, A1, A2>(
  store: ReadonlyStore<State>,
  selector: (state: State, a1: A1, a2: A2) => Value,
  a1: A1,
  a2: A2,
): Value;
export function useStore<State, Value, A1, A2, A3>(
  store: ReadonlyStore<State>,
  selector: (state: State, a1: A1, a2: A2, a3: A3) => Value,
  a1: A1,
  a2: A2,
  a3: A3,
): Value;
export function useStore(
  store: ReadonlyStore<unknown>,
  selector: Function,
  a1?: unknown,
  a2?: unknown,
  a3?: unknown,
): unknown {
  const getSelection = React.useCallback(
    () => selector(store.getSnapshot(), a1, a2, a3),
    [store, selector, a1, a2, a3],
  );

  return React.useSyncExternalStore(store.subscribe, getSelection, getSelection);
}
