'use client';
import * as React from 'react';
import type { Align, Side } from '../../utils/useAnchorPositioning';

export interface ToastPositionerContext {
  side: Side;
  align: Align;
  arrowRef: React.RefObject<unknown>;
  arrowStyles: { left?: number; top?: number };
}

export const ToastPositionerContext = React.createContext<ToastPositionerContext | undefined>(
  undefined,
);

export function useToastPositionerContext() {
  const context = React.useContext(ToastPositionerContext);
  if (context === undefined) {
    throw new Error(
      'Zest: ToastPositionerContext is missing. Toast.Arrow must be placed within <Toast.Positioner>.',
    );
  }

  return context;
}
