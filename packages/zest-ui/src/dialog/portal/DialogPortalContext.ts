'use client';
import * as React from 'react';

export const DialogPortalContext = React.createContext<boolean | undefined>(undefined);

export function useDialogPortalContext() {
  const context = React.useContext(DialogPortalContext);
  if (context === undefined) {
    throw new Error('Zest: <Dialog.Popup> and <Dialog.Viewport> must be used within <Dialog.Portal>.');
  }
  return context;
}
