'use client';
import type * as React from 'react';
import { useIsoLayoutEffect } from '../../hooks/useIsoLayoutEffect';
import { useStableCallback } from '../../hooks/useStableCallback';
import { createChangeEventDetails } from '../createChangeEventDetails';
import { REASONS } from '../reasons';
import type { BasePopupHandle } from './BasePopupHandle';

export interface PopupRootActions {
  /**
   * Unmounts the popup without firing `onOpenChange`. Call it after an
   * externally controlled closing animation finishes.
   */
  unmount: () => void;
  /**
   * Closes the popup, reporting the `imperative-action` reason.
   */
  close: () => void;
}

interface PopupRootHandleStore {
  set(key: 'open', value: boolean): void;
  setOpen(open: boolean, eventDetails: any): void;
}

/**
 * Wires a root's store to its `handle` and `actionsRef`.
 *
 * Shared by every popup root that supports them (Dialog and its variants,
 * Popover, Menu) — the wiring is identical, only the store type differs.
 */
export function usePopupRootHandle<Store extends PopupRootHandleStore>(params: {
  store: Store;
  handle: BasePopupHandle<any, any> | undefined;
  actionsRef: React.RefObject<PopupRootActions | null> | undefined;
}) {
  const { store, handle, actionsRef } = params;

  // Points the handle at this root, so its imperative methods and any detached
  // triggers reach this store rather than the handle's inert fallback.
  useIsoLayoutEffect(() => {
    if (!handle) {
      return undefined;
    }

    return handle.attachStore(store as never);
  }, [handle, store]);

  // Sets the uncontrolled key directly rather than going through `setOpen`:
  // unmounting is not a state change the consumer asked about, and it must not
  // fire `onOpenChange` a second time after their closing animation.
  const unmount = useStableCallback(() => {
    store.set('open', false);
  });

  const close = useStableCallback(() => {
    store.setOpen(false, createChangeEventDetails(REASONS.imperativeAction));
  });

  useIsoLayoutEffect(() => {
    if (!actionsRef) {
      return undefined;
    }

    actionsRef.current = { unmount, close };

    return () => {
      actionsRef.current = null;
    };
  }, [actionsRef, unmount, close]);
}
