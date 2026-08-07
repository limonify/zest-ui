'use client';
import * as React from 'react';
import type { FieldRoot } from './FieldRoot';

/**
 * The validity of a field's control. `valid` is `null` before the first
 * validation runs, then `true`/`false`; `errors` carries the messages returned
 * by `validate` (or an empty array when valid).
 *
 * Upstream mirrors the browser's `ValidityState` (with `valueMissing`,
 * `typeMismatch`, …). React Native has no constraint-validation API, so a field
 * is valid or not, plus whatever messages `validate` produced.
 */
export interface FieldValidityData {
  valid: boolean | null;
  errors: string[];
}

/**
 * What a control offers its field so a surrounding `Form` can drive it.
 */
export interface FieldControlEntry {
  /**
   * Revalidates against the control's current value, returning the messages.
   */
  validate: () => string[];
  /**
   * Focuses the control, where there is something focusable. A `Pressable`
   * control (checkbox, slider, select trigger) has nothing to focus.
   */
  focus: () => void;
}

export interface FieldRootContext {
  /**
   * Whether the field, or the fieldset it belongs to, is disabled.
   */
  disabled: boolean;
  /**
   * The field's name. Kept for identity and labelling only — React Native has no
   * form submission.
   */
  name: string | undefined;
  /**
   * The id of the control, associated with `Field.Label`'s `accessibilityLabelledBy`.
   */
  controlId: string | undefined;
  setControlId: (id: string | undefined) => void;
  labelId: string | undefined;
  setLabelId: (id: string | undefined) => void;
  /**
   * The ids of the description and error messages, which the control points at
   * with `accessibilityDescribedBy`.
   */
  messageIds: string[];
  setMessageIds: (updater: (previous: string[]) => string[]) => void;
  validityData: FieldValidityData;
  setValidityData: (data: FieldValidityData) => void;
  /**
   * Runs the consumer's `validate`, returning the messages (or none).
   */
  runValidation: (value: unknown) => string[];
  /**
   * Validates a user-driven change, honouring `validationDebounceTime`.
   */
  validateOnChange: (value: unknown) => void;
  /**
   * Validates immediately, cancelling anything the debounce still has pending,
   * and returns the messages. This is what a blur and a form submitting use.
   */
  validateNow: (value: unknown) => string[];
  /**
   * Registers the field's control, so a surrounding `Form` can revalidate it on
   * submit and focus it when it fails. Returns the cleanup.
   */
  registerControl: (entry: FieldControlEntry) => () => void;
  /**
   * Drops any error a surrounding `Form` put on this field. Controls call it
   * when the user changes the value: a server's complaint describes the value
   * that was sent, not the one being typed now.
   */
  clearExternalError: () => void;
  validationMode: 'onBlur' | 'onChange';
  invalid: boolean | undefined;
  touched: boolean;
  setTouched: (touched: boolean) => void;
  dirty: boolean;
  setDirty: (dirty: boolean) => void;
  filled: boolean;
  setFilled: (filled: boolean) => void;
  focused: boolean;
  setFocused: (focused: boolean) => void;
  state: FieldRoot.State;
}

export const FieldRootContext = React.createContext<FieldRootContext | undefined>(undefined);

/**
 * Reads the field context. Parts inside a `Field.Root` pass `true`; standalone
 * parts (like a bare `Input`) pass `false` and cope with `undefined`.
 */
export function useFieldRootContext(optional: false): FieldRootContext | undefined;
export function useFieldRootContext(optional?: true): FieldRootContext;
export function useFieldRootContext(optional = true): FieldRootContext | undefined {
  const context = React.useContext(FieldRootContext);
  if (context === undefined && optional) {
    throw new Error(
      'Zest: FieldRootContext is missing. Field parts must be placed within <Field.Root>.',
    );
  }

  return context;
}
