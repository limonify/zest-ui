'use client';
import * as React from 'react';
import type { NumberFieldRoot, NumberFieldRootState } from './NumberFieldRoot';

export interface NumberFieldRootContext {
  state: NumberFieldRootState;
  id: string | undefined;
  min: number | undefined;
  max: number | undefined;
  minWithDefault: number;
  maxWithDefault: number;
  locale: Intl.LocalesArgument;
  /**
   * Commits a value, validated against min/max/step. Returns whether it was
   * applied — a vetoed change reports `false` so callers do not commit a value
   * that was never stored.
   */
  setValue: (value: number | null, eventDetails: NumberFieldRoot.ChangeEventDetails) => boolean;
  /**
   * Steps the value by `amount * direction` from the current value, seeding an
   * empty field with 0.
   */
  incrementValue: (amount: number, params: NumberFieldIncrementParameters) => boolean;
  getStepAmount: () => number;
  setInputValue: React.Dispatch<React.SetStateAction<string>>;
  setScrubbing: (scrubbing: boolean) => void;
  /**
   * Whether the visible text may be overwritten with the formatted value. It is
   * false while the user is typing, so their text is not reformatted underneath
   * them until blur.
   */
  allowInputSyncRef: React.RefObject<boolean>;
  valueRef: React.RefObject<number | null>;
  lastChangedValueRef: React.RefObject<number | null>;
  formatOptionsRef: React.RefObject<Intl.NumberFormatOptions | undefined>;
  onValueCommitted: (
    value: number | null,
    eventDetails: NumberFieldRoot.ChangeEventDetails,
  ) => void;
}

export interface NumberFieldIncrementParameters {
  direction: 1 | -1;
  reason: NumberFieldRoot.ChangeEventReason;
  currentValue?: number | null | undefined;
}

export const NumberFieldRootContext = React.createContext<NumberFieldRootContext | undefined>(
  undefined,
);

export function useNumberFieldRootContext() {
  const context = React.useContext(NumberFieldRootContext);
  if (context === undefined) {
    throw new Error(
      'Zest: NumberFieldRootContext is missing. NumberField parts must be placed within <NumberField.Root>.',
    );
  }

  return context;
}
