'use client';
import * as React from 'react';
import type { TransitionStatus } from '../../internals/useTransitionStatus';

export interface DialogTransitionContext {
  transitionStatus: TransitionStatus;
}

export const DialogTransitionContext = React.createContext<DialogTransitionContext | undefined>(
  undefined,
);

export function useDialogTransitionContext() {
  return React.useContext(DialogTransitionContext);
}
