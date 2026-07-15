'use client';
import * as React from 'react';
import {
  TextInput,
  type NativeSyntheticEvent,
  type TextInputKeyPressEventData,
} from 'react-native';
import { getOTPFieldInputState, useOTPFieldRootContext } from '../root/OTPFieldRootContext';
import { useCompositeListItem } from '../../internals/composite/list/useCompositeListItem';
import { useRenderElement } from '../../use-render/useRenderElement';
import { useStableCallback } from '../../hooks/useStableCallback';
import { useMergedRefs } from '../../hooks/useMergedRefs';
import type { OTPFieldRootState } from '../root/OTPFieldRoot';
import type { BaseUIComponentProps } from '../../types';
import { createChangeEventDetails } from '../../utils/createChangeEventDetails';
import { REASONS } from '../../utils/reasons';
import { normalizeOTPValueWithDetails, removeOTPCharacter, replaceOTPValue } from '../utils/otp';

const MASK_CHARACTER = '\u2022';

/**
 * A single OTP slot.
 * Renders a `<TextInput>`.
 *
 * Its slot index comes from its position among the other inputs, via
 * `CompositeList` — so slots need no index prop.
 *
 * **Diverges from the web deliberately.** Upstream handles paste through a
 * `paste` event and selection ranges. React Native reports every edit as a whole
 * string through `onChangeText` and has no paste event, so both cases go through
 * the same path: whatever arrives is written from this slot onwards. That is also
 * what makes OS autofill work — iOS and Android deliver the entire SMS code into
 * the focused slot, which lands here as one long string.
 */
export function OTPFieldInput(componentProps: OTPFieldInput.Props) {
  const { render, className, style, ref, ...elementProps } = componentProps;

  const {
    activeIndex,
    autoComplete,
    disabled,
    focusInput,
    id,
    keyboardType,
    length,
    mask,
    normalizeValue,
    readOnly,
    registerInput,
    reportValueInvalid,
    setActiveIndex,
    setValue,
    state,
    validationType,
    value,
  } = useOTPFieldRootContext();

  const { index, onLayout } = useCompositeListItem();

  const inputRef = React.useRef<TextInput | null>(null);
  const mergedRef = useMergedRefs(ref, inputRef);

  React.useEffect(() => {
    if (index < 0) {
      return undefined;
    }

    registerInput(index, inputRef.current);
    return () => registerInput(index, null);
  }, [index, registerInput]);

  const slotValue = value[index] ?? '';
  // What the input actually shows, which is a bullet when masked. Every
  // comparison against the reported text has to use this rather than the real
  // character, or a mask would leave its bullet in the entered text.
  const displayedValue = mask && slotValue ? MASK_CHARACTER : slotValue;

  const handleChangeText = useStableCallback((text: string) => {
    if (disabled || readOnly || index < 0) {
      return;
    }

    if (text === '') {
      // The slot was emptied, which only a backspace on a filled slot can do.
      const next = removeOTPCharacter(value, index);
      setValue(next, createChangeEventDetails(REASONS.inputClear));
      return;
    }

    // The slot already showed a character, so RN reports the old one plus what
    // was added. Only the addition is new.
    let entered = text;
    if (displayedValue && text.startsWith(displayedValue) && text.length > displayedValue.length) {
      entered = text.slice(displayedValue.length);
    }

    const [normalized, didRejectCharacters] = normalizeOTPValueWithDetails(
      entered,
      length - index,
      validationType,
      normalizeValue,
    );

    if (didRejectCharacters) {
      reportValueInvalid(entered, createChangeEventDetails(REASONS.inputChange));
    }

    if (normalized === '') {
      return;
    }

    const next = replaceOTPValue(value, index, normalized, length, validationType, normalizeValue);
    const stored = setValue(next, createChangeEventDetails(REASONS.inputChange));

    if (stored === null) {
      return;
    }

    // Move to the slot after everything just written, which for a pasted or
    // autofilled code is the end.
    focusInput(index + normalized.length);
  });

  const handleKeyPress = useStableCallback(
    (event: NativeSyntheticEvent<TextInputKeyPressEventData>) => {
      if (disabled || readOnly || event.nativeEvent.key !== 'Backspace' || slotValue !== '') {
        return;
      }

      // Backspace on an empty slot steps back and clears the one before it —
      // `onChangeText` never fires, because the text did not change.
      if (index > 0) {
        setValue(removeOTPCharacter(value, index - 1), createChangeEventDetails(REASONS.inputClear));
        focusInput(index - 1);
      }
    },
  );

  const inputState = getOTPFieldInputState(state, slotValue, index);

  return useRenderElement(TextInput, componentProps, {
    state: inputState,
    ref: mergedRef,
    props: [
      {
        // Spreading this is what lets CompositeList correct the slot order from
        // measured layout instead of registration order.
        onLayout,
        nativeID: getSlotId(id, index),
        value: displayedValue,
        onChangeText: handleChangeText,
        onKeyPress: handleKeyPress,
        onFocus: () => setActiveIndex(index),
        onBlur: () => {
          if (activeIndex === index) {
            setActiveIndex(-1);
          }
        },
        editable: !disabled && !readOnly,
        keyboardType,
        // Only the first slot advertises the code: the OS fills the field it is
        // on, and every slot claiming it would make the suggestion ambiguous.
        autoComplete: (index === 0 ? autoComplete : 'off') as 'one-time-code' | 'off',
        textContentType: index === 0 ? ('oneTimeCode' as const) : ('none' as const),
        enterKeyHint: index === length - 1 ? ('done' as const) : ('next' as const),
        accessibilityState: { disabled: disabled || undefined },
      },
      elementProps,
    ],
  });
}

/** The first slot uses the root's id; the rest derive theirs from it. */
function getSlotId(id: string | undefined, index: number) {
  if (id === undefined) {
    return undefined;
  }

  return index === 0 ? id : `${id}-${index + 1}`;
}

export interface OTPFieldInputState extends OTPFieldRootState {
  /**
   * This slot's character.
   */
  value: string;
  /**
   * This slot's index.
   */
  index: number;
  /**
   * Whether this slot has a character.
   */
  filled: boolean;
}

export interface OTPFieldInputProps
  extends Omit<BaseUIComponentProps<typeof TextInput, OTPFieldInputState>, 'value'> {}

export namespace OTPFieldInput {
  export type State = OTPFieldInputState;
  export type Props = OTPFieldInputProps;
}
