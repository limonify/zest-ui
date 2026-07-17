'use client';
import * as React from 'react';
import type { NativeSyntheticEvent, TextInputFocusEventData } from 'react-native';
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
  const { value: valueProp, defaultValue, onValueChange, nativeID, requireField } = parameters;

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

  const handleChangeText = useStableCallback((text: string) => {
    if (field?.disabled) {
      return;
    }

    setValueState(text);
    onValueChange?.(text);

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
