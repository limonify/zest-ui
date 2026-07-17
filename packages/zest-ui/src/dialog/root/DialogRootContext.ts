'use client';
import * as React from 'react';
import type { DialogStore } from '../store/DialogStore';

// `any` rather than a concrete reason: the store is generic over the reasons its
// variant can emit, and typing the context with one variant's union would make
// the others' stores unassignable. See DialogStore.
export const DialogRootContext = React.createContext<DialogStore<any> | undefined>(undefined);

export function useDialogRootContext() {
  const context = React.useContext(DialogRootContext);
  if (context === undefined) {
    throw new Error(
      'Zest: DialogRootContext is missing. Dialog parts must be placed within <Dialog.Root>.',
    );
  }

  return context;
}
