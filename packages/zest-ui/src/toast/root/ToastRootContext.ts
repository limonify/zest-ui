'use client';
import * as React from 'react';
import type { ToastObject } from '../useToastManager';
import type { ToastRootState } from './ToastRoot';

export interface ToastRootContext {
  toast: ToastObject<any>;
  state: ToastRootState;
  titleId: string | undefined;
  setTitleId: (id: string | undefined) => void;
  descriptionId: string | undefined;
  setDescriptionId: (id: string | undefined) => void;
}

export const ToastRootContext = React.createContext<ToastRootContext | undefined>(undefined);

export function useToastRootContext() {
  const context = React.useContext(ToastRootContext);
  if (context === undefined) {
    throw new Error(
      'Zest: ToastRootContext is missing. Toast parts must be placed within <Toast.Root>.',
    );
  }

  return context;
}
