'use client';
import * as React from 'react';
import type { ZestChangeEventDetails } from '../utils/createChangeEventDetails';
import type { ZestEventReasons } from '../utils/reasons';

export interface ToggleGroupContext<Value> {
  value: readonly Value[];
  setGroupValue: (
    newValue: Value,
    nextPressed: boolean,
    eventDetails: ZestChangeEventDetails<ZestEventReasons['none']>,
  ) => void;
  disabled: boolean;
  /**
   * Indicates whether the value has been initialized via `value` or `defaultValue` props.
   * Used to determine if Toggle should warn users about data inconsistency problems.
   */
  isValueInitialized: boolean;
}

export const ToggleGroupContext = React.createContext<ToggleGroupContext<any> | undefined>(
  undefined,
);

/**
 * Toggle may be used standalone, so the group context is optional by design.
 */
export function useToggleGroupContext<Value = string>() {
  return React.useContext<ToggleGroupContext<Value> | undefined>(ToggleGroupContext);
}
