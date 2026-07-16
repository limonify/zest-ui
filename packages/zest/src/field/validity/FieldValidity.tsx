'use client';
import type * as React from 'react';
import { useFieldRootContext } from '../root/FieldRootContext';
import type { FieldRoot } from '../root/FieldRoot';

export interface FieldValidityState {
  /**
   * Whether the control passed validation. `null` before it has run.
   */
  valid: boolean | null;
  /**
   * The validation messages, or an empty array when valid.
   */
  errors: string[];
  /**
   * The field's broader state (disabled, touched, dirty, filled, focused).
   */
  field: FieldRoot.State;
}

/**
 * A headless part that hands the field's validity to a render function.
 * Renders nothing of its own.
 */
export function FieldValidity(props: FieldValidity.Props) {
  const { validityData, state } = useFieldRootContext();

  return props.children({
    valid: validityData.valid,
    errors: validityData.errors,
    field: state,
  }) as React.ReactElement | null;
}

export interface FieldValidityProps {
  children: (validity: FieldValidityState) => React.ReactNode;
}

export namespace FieldValidity {
  export type State = FieldValidityState;
  export type Props = FieldValidityProps;
}
