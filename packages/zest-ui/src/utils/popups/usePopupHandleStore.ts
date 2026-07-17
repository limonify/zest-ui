'use client';
import * as React from 'react';
import type { PopupHandleStoreProvider } from './BasePopupHandle';

const NOOP = () => () => {};

/**
 * Reads the store a handle currently exposes, and follows it as roots attach and
 * detach: while none is attached the handle exposes its fallback store; once one
 * does, subscribers re-render and read the live root store.
 *
 * Returns `undefined` when no handle is given, so callers fall back to their root
 * context.
 *
 * Upstream reaches for the `use-sync-external-store` shim; zest is React 19-only
 * and uses `React.useSyncExternalStore` directly.
 */
export function usePopupHandleStore<HandleStore>(
  handle: PopupHandleStoreProvider<HandleStore> | undefined,
): HandleStore | undefined {
  const subscribe = React.useCallback(
    (listener: () => void) => (handle === undefined ? NOOP() : handle.subscribeStore(listener)),
    [handle],
  );

  const getSnapshot = React.useCallback(
    () => (handle === undefined ? undefined : handle.store),
    [handle],
  );

  return React.useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
