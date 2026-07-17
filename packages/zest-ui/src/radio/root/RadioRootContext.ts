'use client';
import * as React from 'react';
import type { RadioRootState } from './RadioRoot';

export type RadioRootContext = RadioRootState;

export const RadioRootContext = React.createContext<RadioRootContext | undefined>(undefined);

export function useRadioRootContext() {
  const context = React.useContext(RadioRootContext);
  if (context === undefined) {
    throw new Error(
      'Zest: RadioRootContext is missing. Radio parts must be placed within <Radio.Root>.',
    );
  }

  return context;
}
