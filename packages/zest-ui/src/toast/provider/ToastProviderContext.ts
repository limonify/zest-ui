'use client';
import * as React from 'react';
import type { ToastStore } from '../store';

export type ToastContext = ToastStore;

export const ToastContext = React.createContext<ToastContext | undefined>(undefined);

export function useToastProviderContext() {
  const context = React.useContext(ToastContext);
  if (context === undefined) {
    throw new Error('Zest: Toast parts and useToastManager must be used within <Toast.Provider>.');
  }

  return context;
}
