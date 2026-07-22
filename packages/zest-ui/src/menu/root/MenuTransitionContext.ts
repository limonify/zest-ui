'use client';
import * as React from 'react';
import type { TransitionStatus } from '../../internals/useTransitionStatus';

export interface MenuTransitionContext {
  transitionStatus: TransitionStatus;
}

export const MenuTransitionContext = React.createContext<MenuTransitionContext | undefined>(
  undefined,
);

export function useMenuTransitionContext() {
  return React.useContext(MenuTransitionContext);
}
