'use client';
import * as React from 'react';
import type { TransitionStatus } from '../../internals/useTransitionStatus';

export interface SelectTransitionContext {
  transitionStatus: TransitionStatus;
}

export const SelectTransitionContext = React.createContext<SelectTransitionContext | undefined>(
  undefined,
);

export function useSelectTransitionContext() {
  return React.useContext(SelectTransitionContext);
}
