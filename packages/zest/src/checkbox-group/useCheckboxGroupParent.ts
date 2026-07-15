'use client';
import * as React from 'react';
import { useStableCallback } from '../hooks/useStableCallback';
import type { ZestChangeEventDetails } from '../utils/createChangeEventDetails';
import type { ZestEventReasons } from '../utils/reasons';

const EMPTY_ARRAY: never[] = [];

/**
 * Derives the parent checkbox's checked/indeterminate state from its children and
 * implements the three-way parent toggle.
 *
 * Upstream's `id`/`aria-controls` wiring is omitted: it exists to point the parent
 * `<input>` at the child input ids, which have no React Native equivalent.
 */
export function useCheckboxGroupParent(
  params: UseCheckboxGroupParentParameters,
): UseCheckboxGroupParentReturnValue {
  const {
    allValues = EMPTY_ARRAY as string[],
    value = EMPTY_ARRAY as string[],
    onValueChange: onValueChangeProp,
  } = params;

  const uncontrolledStateRef = React.useRef(value);
  const disabledStatesRef = React.useRef(new Map<string, boolean>());

  const [status, setStatus] = React.useState<'on' | 'off' | 'mixed'>('mixed');

  const checked = value.length === allValues.length;
  const indeterminate = value.length !== allValues.length && value.length > 0;

  const onValueChange = useStableCallback(onValueChangeProp);

  const getParentProps: UseCheckboxGroupParentReturnValue['getParentProps'] = React.useCallback(
    () => ({
      indeterminate,
      checked,
      onCheckedChange(_, eventDetails) {
        const uncontrolledState = uncontrolledStateRef.current;

        // None except the disabled ones that are checked, which can't be changed.
        const none = allValues.filter(
          (v) => disabledStatesRef.current.get(v) && uncontrolledState.includes(v),
        );
        // "All" that are valid:
        // - any that aren't disabled
        // - disabled ones that are checked
        const all = allValues.filter(
          (v) => !disabledStatesRef.current.get(v) || uncontrolledState.includes(v),
        );

        const allOnOrOff = uncontrolledState.length === all.length || uncontrolledState.length === 0;

        if (allOnOrOff) {
          if (value.length === all.length) {
            onValueChange(none, eventDetails);
          } else {
            onValueChange(all, eventDetails);
          }
          return;
        }

        let nextStatus: 'on' | 'off' | 'mixed' = 'mixed';
        let nextValue = uncontrolledState;

        if (status === 'mixed') {
          nextStatus = 'on';
          nextValue = all;
        } else if (status === 'on') {
          nextStatus = 'off';
          nextValue = none;
        }

        onValueChange(nextValue, eventDetails);

        if (!eventDetails.isCanceled) {
          setStatus(nextStatus);
        }
      },
    }),
    [allValues, checked, indeterminate, onValueChange, status, value.length],
  );

  const getChildProps: UseCheckboxGroupParentReturnValue['getChildProps'] = React.useCallback(
    (childValue: string) => ({
      checked: value.includes(childValue),
      onCheckedChange(nextChecked, eventDetails) {
        const newValue = value.slice();
        if (nextChecked) {
          newValue.push(childValue);
        } else {
          newValue.splice(newValue.indexOf(childValue), 1);
        }

        onValueChange(newValue, eventDetails);

        if (!eventDetails.isCanceled) {
          uncontrolledStateRef.current = newValue;
          setStatus('mixed');
        }
      },
    }),
    [onValueChange, value],
  );

  return React.useMemo(
    () => ({
      getParentProps,
      getChildProps,
      disabledStatesRef,
    }),
    [getParentProps, getChildProps],
  );
}

export interface UseCheckboxGroupParentParameters {
  allValues?: string[] | undefined;
  value?: string[] | undefined;
  onValueChange?:
    | ((value: string[], eventDetails: ZestChangeEventDetails<ZestEventReasons['none']>) => void)
    | undefined;
}

export interface UseCheckboxGroupParentReturnValue {
  disabledStatesRef: React.RefObject<Map<string, boolean>>;
  getParentProps: () => {
    indeterminate: boolean;
    checked: boolean;
    onCheckedChange: (
      checked: boolean,
      eventDetails: ZestChangeEventDetails<ZestEventReasons['none']>,
    ) => void;
  };
  getChildProps: (value: string) => {
    checked: boolean;
    onCheckedChange: (
      checked: boolean,
      eventDetails: ZestChangeEventDetails<ZestEventReasons['none']>,
    ) => void;
  };
}
