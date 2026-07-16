'use client';
import { TextInput, type NativeSyntheticEvent, type TextInputFocusEventData } from 'react-native';
import { useNumberFieldRootContext } from '../root/NumberFieldRootContext';
import { useRenderElement } from '../../use-render/useRenderElement';
import { useStableCallback } from '../../hooks/useStableCallback';
import { formatNumber } from '../../utils/formatNumber';
import type { NumberFieldRootState } from '../root/NumberFieldRoot';
import type { BaseUIComponentProps } from '../../types';
import { createChangeEventDetails } from '../../utils/createChangeEventDetails';
import { REASONS } from '../../utils/reasons';
import { parseNumber } from '../utils/parse';
import { hasNumberFormatRoundingOptions, removeFloatingPointErrors } from '../utils/validate';

/**
 * The input element for the number field.
 * Renders a `<TextInput>`.
 *
 * **Diverges from the web deliberately.** Upstream filters every keystroke
 * against the set of characters the locale's format can produce. React Native's
 * `TextInput` reports whole strings through `onChangeText`, not keys, so the text
 * is accepted as typed and simply left alone when it does not parse — the value
 * only changes when it does. `keyboardType` steers the on-screen keyboard toward
 * the right characters instead.
 */
export function NumberFieldInput(componentProps: NumberFieldInput.Props) {
  const { render, className, style, ref, ...elementProps } = componentProps;

  const {
    allowInputSyncRef,
    formatOptionsRef,
    id,
    lastChangedValueRef,
    locale,
    max,
    min,
    onValueCommitted,
    setInputValue,
    setValue,
    state,
    valueRef,
  } = useNumberFieldRootContext();

  const { disabled, readOnly, value, inputValue } = state;

  const handleChangeText = useStableCallback((text: string) => {
    if (disabled || readOnly) {
      return;
    }

    // The user is now the source of truth for the text; nothing may reformat it
    // underneath them until blur.
    allowInputSyncRef.current = false;
    setInputValue(text);

    if (text.trim() === '') {
      setValue(null, createChangeEventDetails(REASONS.inputClear));
      return;
    }

    const parsedValue = parseNumber(text, locale, formatOptionsRef.current);
    if (parsedValue === null) {
      // Unparseable so far ('-', '1.', a half-typed currency): keep the text and
      // wait. Blur is what forces a resolution.
      return;
    }

    setValue(parsedValue, createChangeEventDetails(REASONS.inputChange));
  });

  const handleBlur = useStableCallback((event: NativeSyntheticEvent<TextInputFocusEventData>) => {
    if (disabled || readOnly) {
      return;
    }

    const hadManualInput = !allowInputSyncRef.current;
    allowInputSyncRef.current = true;

    if (inputValue.trim() === '') {
      const clearDetails = createChangeEventDetails(REASONS.inputClear, event);
      setValue(null, clearDetails);

      if (clearDetails.isCanceled) {
        return;
      }

      // Blurring an untouched, already-empty field cleared nothing.
      if (hadManualInput || value !== null) {
        onValueCommitted(null, createChangeEventDetails(REASONS.inputClear, event));
      }
      return;
    }

    const formatOptions = formatOptionsRef.current;
    const parsedValue = parseNumber(inputValue, locale, formatOptions);

    if (parsedValue === null) {
      // The text never resolved to a number, so restore the last good value.
      setInputValue(formatNumber(valueRef.current, locale, formatOptions));
      return;
    }

    const hasRoundingOptions = hasNumberFormatRoundingOptions(formatOptions);

    let committed: number | null;
    if (!hadManualInput && !hasRoundingOptions) {
      // No rounding options and no edit: the text is purely formatted display, so
      // keep the authoritative value rather than re-parsing the rounded text and
      // discarding precision.
      committed = value;
    } else if (hasRoundingOptions) {
      committed = removeFloatingPointErrors(parsedValue, formatOptions);
    } else {
      committed = parsedValue;
    }

    const shouldUpdateValue = value !== committed;
    let committedValue = committed;

    if (shouldUpdateValue) {
      const changeDetails = createChangeEventDetails(REASONS.inputBlur, event);
      setValue(committed, changeDetails);

      if (changeDetails.isCanceled) {
        return;
      }

      // Read back what was stored, since setValue clamps and snaps.
      committedValue = lastChangedValueRef.current ?? committed;
    }

    if (hadManualInput || shouldUpdateValue) {
      onValueCommitted(committedValue, createChangeEventDetails(REASONS.inputBlur, event));
    }

    // Whatever happened, the text goes back to being formatted display.
    setInputValue(formatNumber(committedValue, locale, formatOptions));
  });

  return useRenderElement(TextInput, componentProps, {
    state,
    ref,
    props: [
      {
        nativeID: id,
        value: inputValue,
        onChangeText: handleChangeText,
        onBlur: handleBlur,
        editable: !disabled && !readOnly,
        // `numeric` rather than `decimal-pad`: a locale's format may include a
        // decimal separator, a minus sign or a currency symbol, and the numeric
        // keyboard is the one that offers them.
        keyboardType: 'numeric' as const,
        accessibilityRole: 'spinbutton' as const,
        accessibilityState: { disabled: disabled || undefined },
        accessibilityValue: {
          min,
          max,
          now: value ?? undefined,
          text: inputValue || undefined,
        },
      },
      elementProps,
    ],
  });
}

export interface NumberFieldInputState extends NumberFieldRootState {}

export interface NumberFieldInputProps
  extends Omit<BaseUIComponentProps<typeof TextInput, NumberFieldInputState>, 'value'> {}

export namespace NumberFieldInput {
  export type State = NumberFieldInputState;
  export type Props = NumberFieldInputProps;
}
