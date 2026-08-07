'use client';
import * as React from 'react';
import type { NativeSyntheticEvent, TextInput, TextInputFocusEventData } from 'react-native';
import { useControlled } from '../../hooks/useControlled';
import { useId } from '../../hooks/useId';
import { useIsoLayoutEffect } from '../../hooks/useIsoLayoutEffect';
import { useStableCallback } from '../../hooks/useStableCallback';
import { useFieldRootContext, type FieldRootContext } from '../root/FieldRootContext';

export interface UseFieldControlParameters {
  value?: string | undefined;
  defaultValue?: string | undefined;
  onValueChange?: ((value: string) => void) | undefined;
  nativeID?: string | undefined;
  /**
   * The input element, so a surrounding `Form` can focus it when submission
   * stops here.
   */
  inputRef?: React.RefObject<TextInput | null> | undefined;
  /**
   * Whether a surrounding `Field.Root` is required. `Field.Control` passes
   * `true`; a standalone `Input` passes `false` and works without one.
   */
  requireField: boolean;
}

/**
 * The behaviour shared by `Field.Control` and `Input`: controlled/uncontrolled
 * text, validation timing, the field's `filled`/`dirty`/`touched`/`focused`
 * bookkeeping, and the accessibility wiring to the label and messages.
 */
export function useFieldControl(parameters: UseFieldControlParameters) {
  const {
    value: valueProp,
    defaultValue,
    onValueChange,
    nativeID,
    inputRef,
    requireField,
  } = parameters;

  const field: FieldRootContext | undefined = useFieldRootContext(false);
  if (requireField && field === undefined) {
    throw new Error(
      'Zest: FieldRootContext is missing. <Field.Control> must be placed within <Field.Root>.',
    );
  }

  const [value, setValueState] = useControlled<string>({
    controlled: valueProp,
    default: defaultValue ?? '',
    name: 'FieldControl',
    state: 'value',
  });

  const id = useId(nativeID ?? undefined);
  const initialValueRef = React.useRef(value);

  // Point the field's label/messages at this control.
  useIsoLayoutEffect(() => {
    field?.setControlId(id);
    return () => field?.setControlId(undefined);
  }, [field, id]);

  useIsoLayoutEffect(() => {
    field?.setFilled(value.length > 0);
  }, [field, value]);

  const validateNow = useStableCallback((nextValue: string) => {
    if (!field) {
      return;
    }
    const errors = field.runValidation(nextValue);
    field.setValidityData({ valid: errors.length === 0, errors });
  });

  // The form's copy of the value is what `validate()` runs against on submit,
  // and the change handler is not the only way it moves (a controlled consumer
  // can set it), so track render rather than the handler.
  const valueRef = React.useRef(value);
  useIsoLayoutEffect(() => {
    valueRef.current = value;
  });

  useIsoLayoutEffect(() => {
    if (!field) {
      return undefined;
    }

    return field.registerControl({
      validate: () => {
        const errors = field.runValidation(valueRef.current);
        field.setValidityData({ valid: errors.length === 0, errors });
        return errors;
      },
      focus: () => inputRef?.current?.focus(),
    });
  }, [field, inputRef]);

  const handleChangeText = useStableCallback((text: string) => {
    if (field?.disabled) {
      return;
    }

    setValueState(text);
    onValueChange?.(text);

    // A server's complaint was about the value that was sent, not this one.
    field?.clearExternalError();
    field?.setDirty(text !== initialValueRef.current);

    if (field?.validationMode === 'onChange') {
      validateNow(text);
    }
  });

  const handleFocus = useStableCallback(() => {
    field?.setFocused(true);
  });

  const handleBlur = useStableCallback((_event: NativeSyntheticEvent<TextInputFocusEventData>) => {
    field?.setFocused(false);
    field?.setTouched(true);

    if (field?.validationMode === 'onBlur') {
      validateNow(value);
    }
  });

  const describedBy = field && field.messageIds.length > 0 ? field.messageIds.join(' ') : undefined;

  return {
    field,
    value,
    props: {
      nativeID: id,
      value,
      onChangeText: handleChangeText,
      onFocus: handleFocus,
      onBlur: handleBlur,
      editable: !field?.disabled,
      accessibilityLabelledBy: field?.labelId,
      accessibilityDescribedBy: describedBy,
      'aria-labelledby': field?.labelId,
      'aria-describedby': describedBy,
      accessibilityState: { disabled: field?.disabled || undefined },
      'aria-invalid': field?.validityData.valid === false || undefined,
    },
  };
}
