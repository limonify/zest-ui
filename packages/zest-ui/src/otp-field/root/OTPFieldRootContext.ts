'use client';
import * as React from 'react';
import type { OTPFieldRoot, OTPFieldRootState } from './OTPFieldRoot';
import type { OTPFieldInputState } from '../input/OTPFieldInput';

export interface OTPFieldRootContext {
  state: OTPFieldRootState;
  value: string;
  length: number;
  mask: boolean;
  disabled: boolean;
  readOnly: boolean;
  autoComplete: string | undefined;
  keyboardType: 'number-pad' | 'default';
  activeIndex: number;
  setActiveIndex: (index: number) => void;
  validationType: OTPFieldRoot.ValidationType;
  normalizeValue: ((value: string) => string) | undefined;
  /**
   * The id of the first slot; the rest derive theirs from it.
   */
  id: string | undefined;
  registerInput: (index: number, node: { focus: () => void } | null) => void;
  focusInput: (index: number) => void;
  reportValueInvalid: (value: string, eventDetails: OTPFieldRoot.InvalidEventDetails) => void;
  /**
   * Commits a value, normalized and clamped to `length`. Returns the stored value,
   * or `null` when the change was vetoed.
   */
  setValue: (value: string, eventDetails: OTPFieldRoot.ChangeEventDetails) => string | null;
}

export const OTPFieldRootContext = React.createContext<OTPFieldRootContext | undefined>(undefined);

export function useOTPFieldRootContext() {
  const context = React.useContext(OTPFieldRootContext);
  if (context === undefined) {
    throw new Error(
      'Zest: OTPFieldRootContext is missing. OTPField parts must be placed within <OTPField.Root>.',
    );
  }

  return context;
}

export function getOTPFieldInputState(
  state: OTPFieldRootState,
  value: string,
  index: number,
): OTPFieldInputState {
  return { ...state, value, index, filled: value !== '' };
}
