'use client';
import * as React from 'react';
import type { TransitionStatus } from '../../internals/useTransitionStatus';

export interface ComboboxTransitionContext {
  transitionStatus: TransitionStatus;
}

export const ComboboxTransitionContext = React.createContext<
  ComboboxTransitionContext | undefined
>(undefined);

export function useComboboxTransitionContext() {
  return React.useContext(ComboboxTransitionContext);
}
