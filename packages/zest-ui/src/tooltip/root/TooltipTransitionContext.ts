'use client';
import * as React from 'react';
import type { TransitionStatus } from '../../internals/useTransitionStatus';

export interface TooltipTransitionContext {
  transitionStatus: TransitionStatus;
}

export const TooltipTransitionContext = React.createContext<TooltipTransitionContext | undefined>(
  undefined,
);

export function useTooltipTransitionContext() {
  return React.useContext(TooltipTransitionContext);
}
