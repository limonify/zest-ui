'use client';
import * as React from 'react';
import { View } from 'react-native';
import { useRenderElement } from '../../use-render/useRenderElement';
import { useStableCallback } from '../../hooks/useStableCallback';
import { useControlled } from '../../hooks/useControlled';
import { useFieldsetRootContext } from '../../fieldset/root/FieldsetRootContext';
import type { ZestUIComponentProps } from '../../types';
import { useRefWithInit } from '../../hooks/useRefWithInit';
import { useTimeout } from '../../hooks/useTimeout';
import { useIsoLayoutEffect } from '../../hooks/useIsoLayoutEffect';
import { useFormContext } from '../../form/FormContext';
import {
  FieldRootContext,
  type FieldControlEntry,
  type FieldValidityData,
} from './FieldRootContext';

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
    validationDebounceTime = 0,
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

  const form = useFormContext(false);

  // Errors the consumer put on the form for this field, by name.
  const externalErrors = React.useMemo(() => {
    if (!form || !name || !(name in form.errors)) {
      return undefined;
    }
    const entry = form.errors[name]!;
    return Array.isArray(entry) ? entry : [entry];
  }, [form, name]);

  // A control registers itself so the form can revalidate and focus it. There is
  // normally exactly one; a Set copes with a field that renders none, or two.
  const controls = useRefWithInit(() => new Set<FieldControlEntry>()).current;

  const registerControl = useStableCallback((entry: FieldControlEntry) => {
    controls.add(entry);
    return () => {
      controls.delete(entry);
    };
  });

  const clearExternalError = useStableCallback(() => {
    if (name) {
      form?.clearError(name);
    }
  });

  // Registering with the form from a layout effect is what puts fields in tree
  // order, which is the order "the first invalid field" is resolved in.
  useIsoLayoutEffect(() => {
    if (!form || !name) {
      return undefined;
    }

    return form.registerField(name, {
      validate() {
        const messages: string[] = [];
        controls.forEach((control) => {
          messages.push(...control.validate());
        });
        return messages;
      },
      focus() {
        controls.forEach((control) => control.focus());
      },
      markTouched() {
        setTouched(true);
      },
    });
  }, [form, name, controls, setTouched]);

  // An error from outside outranks the local verdict: the field cannot know the
  // server disagreed with it.
  // `onChange` validation runs on every keystroke, which is wasteful for an
  // expensive `validate` and makes the error flicker while the user is still
  // typing. The timer lives here so every control in the field shares it.
  const debounce = useTimeout();

  const commitValidation = useStableCallback((value: unknown) => {
    const errors = runValidation(value);
    setValidityData({ valid: errors.length === 0, errors });
    return errors;
  });

  const validateOnChange = useStableCallback((value: unknown) => {
    if (validationDebounceTime > 0) {
      debounce.start(validationDebounceTime, () => commitValidation(value));
      return;
    }

    debounce.clear();
    commitValidation(value);
  });

  const validateNow = useStableCallback((value: unknown) => {
    // A blur, or a form submitting, outranks anything still pending.
    debounce.clear();
    return commitValidation(value);
  });

  const valid = invalid === true || externalErrors ? false : validityData.valid;
  const errors = externalErrors ?? validityData.errors;

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
      validityData: { valid, errors },
      setValidityData,
      runValidation,
      validateOnChange,
      validateNow,
      registerControl,
      clearExternalError,
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
      errors,
      runValidation,
      validateOnChange,
      validateNow,
      registerControl,
      clearExternalError,
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
   * How long to wait, in milliseconds, before running `validate` after a change.
   * Only applies to `validationMode="onChange"`; a blur or a form submitting
   * validates immediately and cancels anything pending.
   *
   * `0` validates on every keystroke, which is fine for a cheap synchronous
   * check and wasteful for anything else.
   * @default 0
   */
  validationDebounceTime?: number | undefined;
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
