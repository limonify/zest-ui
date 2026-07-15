'use client';
import * as React from 'react';
import type { ZestChangeEventDetails } from '../utils/createChangeEventDetails';
import type { ZestEventReasons } from '../utils/reasons';

export interface RadioGroupContext<Value> {
  checkedValue: Value | undefined;
  setCheckedValue: (
    value: Value,
    eventDetails: ZestChangeEventDetails<ZestEventReasons['none']>,
  ) => void;
  disabled: boolean;
  readOnly: boolean;
  required: boolean;
}

export const RadioGroupContext = React.createContext<RadioGroupContext<any> | undefined>(undefined);

/**
 * Unlike the web, a standalone radio has no hidden `<input>` to fall back on, so
 * it cannot hold state of its own. `Radio.Root` therefore requires a group.
 */
export function useRadioGroupContext<Value = any>() {
  const context = React.useContext<RadioGroupContext<Value> | undefined>(RadioGroupContext);
  if (context === undefined) {
    throw new Error(
      'Zest: RadioGroupContext is missing. Radio parts must be placed within <RadioGroup>.',
    );
  }

  return context;
}
