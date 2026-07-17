'use client';
import * as React from 'react';

export interface MeterRootContext {
  /**
   * The current value.
   */
  value: number;
  /**
   * The value formatted for display.
   */
  formattedValue: string;
  /**
   * The value's position in the range as a percentage. This is what the
   * indicator is sized from.
   */
  percentageValue: number;
  setLabelId: (id: string | undefined) => void;
}

export const MeterRootContext = React.createContext<MeterRootContext | undefined>(undefined);

export function useMeterRootContext() {
  const context = React.useContext(MeterRootContext);
  if (context === undefined) {
    throw new Error(
      'Zest: MeterRootContext is missing. Meter parts must be placed within <Meter.Root>.',
    );
  }

  return context;
}
