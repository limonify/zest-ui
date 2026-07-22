'use client';
import * as React from 'react';
import type { TransitionStatus } from '../../internals/useTransitionStatus';

export interface PopoverTransitionContext {
  transitionStatus: TransitionStatus;
}

export const PopoverTransitionContext = React.createContext<PopoverTransitionContext | undefined>(
  undefined,
);

export function usePopoverTransitionContext() {
  return React.useContext(PopoverTransitionContext);
}
