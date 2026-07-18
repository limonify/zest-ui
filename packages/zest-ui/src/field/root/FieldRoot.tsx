'use client';
import * as React from 'react';
import { View } from 'react-native';
import { useRenderElement } from '../../use-render/useRenderElement';
import { useStableCallback } from '../../hooks/useStableCallback';
import { useControlled } from '../../hooks/useControlled';
import { useFieldsetRootContext } from '../../fieldset/root/FieldsetRootContext';
import type { ZestUIComponentProps } from '../../types';
import { FieldRootContext, type FieldValidityData } from './FieldRootContext';

/**
 * Groups a label, a control, and its description/error messages, wiring them
 * together for assistive technology and running validation.
 * Renders a `<View>`.
 *
 * **Adapted from upstream, not a verbatim port.** React Native has no HTML
 * constraint validation (`ValidityState`) and no form submission, so the
 * `validity` object collapses to `valid` + `errors`, and `name`/`Form`
 * integration are dropped. `validate` — a function returning an error message,
 * a list of them, or `null` — is what drives validity.
 */
export function FieldRoot(componentProps: FieldRoot.Props) {
  const {
    render,
    className,
    style,
    validate: validateProp,
    validationMode = 'onBlur',
    name,
    disabled: disabledProp = false,
    invalid,
    dirty: dirtyProp,
    touched: touchedProp,
    ref,
    ...elementProps
  } = componentProps;

  const disabledFieldset = useFieldsetRootContext(false)?.disabled;
  const disabled = Boolean(disabledFieldset) || disabledProp;

  const validate = useStableCallback(validateProp ?? (() => null));

  const [controlId, setControlId] = React.useState<string | undefined>(undefined);
  const [labelId, setLabelId] = React.useState<string | undefined>(undefined);
  const [messageIds, setMessageIdsState] = React.useState<string[]>([]);
  const [validityData, setValidityData] = React.useState<FieldValidityData>({
    valid: invalid === true ? false : null,
    errors: [],
  });
  const [filled, setFilled] = React.useState(false);
  const [focused, setFocused] = React.useState(false);

  const [touched, setTouched] = useControlled<boolean>({
    controlled: touchedProp,
    default: false,
    name: 'Field',
    state: 'touched',
  });
  const [dirty, setDirty] = useControlled<boolean>({
    controlled: dirtyProp,
    default: false,
    name: 'Field',
    state: 'dirty',
  });

  const setMessageIds = useStableCallback((updater: (previous: string[]) => string[]) => {
    setMessageIdsState(updater);
  });

  const runValidation = useStableCallback((value: unknown): string[] => {
    const result = validate(value);
    if (result == null) {
      return [];
    }
    return Array.isArray(result) ? result : [result];
  });

  const valid = invalid === true ? false : validityData.valid;

  const state: FieldRoot.State = React.useMemo(
    () => ({ disabled, valid, touched, dirty, filled, focused }),
    [disabled, valid, touched, dirty, filled, focused],
  );

  const contextValue: FieldRootContext = React.useMemo(
    () => ({
      disabled,
      name,
      controlId,
      setControlId,
      labelId,
      setLabelId,
      messageIds,
      setMessageIds,
      validityData: { valid, errors: validityData.errors },
      setValidityData,
      runValidation,
      validationMode,
      invalid,
      touched,
      setTouched,
      dirty,
      setDirty,
      filled,
      setFilled,
      focused,
      setFocused,
      state,
    }),
    [
      disabled,
      name,
      controlId,
      labelId,
      messageIds,
      setMessageIds,
      valid,
      validityData.errors,
      runValidation,
      validationMode,
      invalid,
      touched,
      setTouched,
      dirty,
      setDirty,
      filled,
      focused,
      state,
    ],
  );

  const element = useRenderElement(View, componentProps, {
    state,
    ref,
    props: [{ role: 'group' as const }, elementProps],
  });

  return <FieldRootContext.Provider value={contextValue}>{element}</FieldRootContext.Provider>;
}

export interface FieldRootState {
  /**
   * Whether the field is disabled.
   */
  disabled: boolean;
  /**
   * Whether the control passed validation. `null` before it has run.
   */
  valid: boolean | null;
  /**
   * Whether the control has been touched (blurred at least once).
   */
  touched: boolean;
  /**
   * Whether the control's value has changed from its initial value.
   */
  dirty: boolean;
  /**
   * Whether the control has a non-empty value.
   */
  filled: boolean;
  /**
   * Whether the control is focused.
   */
  focused: boolean;
}

export interface FieldRootProps extends ZestUIComponentProps<typeof View, FieldRootState> {
  /**
   * A validation function. Return an error message, a list of them, or `null`
   * when the value is valid.
   */
  validate?: ((value: unknown) => string | string[] | null) | undefined;
  /**
   * When validation runs: as the value changes, or when the control blurs.
   * @default 'onBlur'
   */
  validationMode?: 'onBlur' | 'onChange' | undefined;
  /**
   * The field's name. Used for identity and labelling; there is no form
   * submission in React Native.
   */
  name?: string | undefined;
  /**
   * Whether the field is disabled.
   * @default false
   */
  disabled?: boolean | undefined;
  /**
   * Forces the field into an invalid state, regardless of validation.
   */
  invalid?: boolean | undefined;
  /**
   * Controls the `dirty` state.
   */
  dirty?: boolean | undefined;
  /**
   * Controls the `touched` state.
   */
  touched?: boolean | undefined;
}

export namespace FieldRoot {
  export type State = FieldRootState;
  export type Props = FieldRootProps;
}
