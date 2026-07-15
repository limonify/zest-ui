'use client';
import * as React from 'react';
import type { UseCheckboxGroupParentReturnValue } from './useCheckboxGroupParent';
import type { ZestChangeEventDetails } from '../utils/createChangeEventDetails';
import type { ZestEventReasons } from '../utils/reasons';

export interface CheckboxGroupContext {
  value: string[] | undefined;
  defaultValue: string[] | undefined;
  setValue: (
    value: string[],
    eventDetails: ZestChangeEventDetails<ZestEventReasons['none']>,
  ) => void;
  allValues: string[] | undefined;
  parent: UseCheckboxGroupParentReturnValue;
  disabled: boolean;
}

export const CheckboxGroupContext = React.createContext<CheckboxGroupContext | undefined>(
  undefined,
);

/**
 * Checkbox may be used standalone, so the group context is optional by design.
 */
export function useCheckboxGroupContext() {
  return React.useContext(CheckboxGroupContext);
}
