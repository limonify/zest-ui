'use client';
import * as React from 'react';
import type { ProgressRootState } from './ProgressRoot';

export interface ProgressRootContext {
  /**
   * The current value, or `null` while indeterminate.
   */
  value: number | null;
  /**
   * The value formatted for display, empty while indeterminate.
   */
  formattedValue: string;
  /**
   * The value's position in the range as a percentage, or `null` while
   * indeterminate. This is what the indicator is sized from.
   */
  percentageValue: number | null;
  state: ProgressRootState;
  setLabelId: (id: string | undefined) => void;
}

export const ProgressRootContext = React.createContext<ProgressRootContext | undefined>(undefined);

export function useProgressRootContext() {
  const context = React.useContext(ProgressRootContext);
  if (context === undefined) {
    throw new Error(
      'Zest: ProgressRootContext is missing. Progress parts must be placed within <Progress.Root>.',
    );
  }

  return context;
}
