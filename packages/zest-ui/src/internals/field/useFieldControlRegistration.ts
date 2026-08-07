'use client';
import * as React from 'react';
import { useFieldRootContext } from '../../field/root/FieldRootContext';
import { useIsoLayoutEffect } from '../../hooks/useIsoLayoutEffect';
import { useStableCallback } from '../../hooks/useStableCallback';

/** Whether a value counts as "the user has put something in this control". */
function defaultIsFilled(value: unknown): boolean {
  if (value == null || value === false || value === '') {
    return false;
  }

  if (Array.isArray(value)) {
    return value.length > 0;
  }

  return true;
}

export interface UseFieldControlRegistrationParameters {
  /**
   * The control's value at mount. `dirty` is whether the current value still
   * equals this one.
   */
  initialValue?: unknown;
  /**
   * Whether a value counts as filled. Defaults to "not null, empty, or false".
   */
  isFilled?: ((value: unknown) => boolean) | undefined;
  /**
   * Something with a `focus()` method, so a surrounding `Form` can put the user
   * in front of this control when submission stops here. Most of these controls
   * are `Pressable`s with nothing to focus, and leave it out.
   */
  focusRef?: React.RefObject<{ focus?: () => void } | null> | undefined;
  /**
   * Whether this is the call that owns the control's value, and so the one a
   * surrounding `Form` should revalidate and focus on submit.
   *
   * A component often calls this hook twice: once where the value lives (the
   * root) and once where the element is, only for the accessibility props (the
   * trigger, the thumb, the input). Only the first may register — otherwise the
   * form validates the control twice, the second time against a value that call
   * does not have.
   *
   * @default false
   */
  ownsValue?: boolean | undefined;
}

/**
 * Wires a non-text form control (Checkbox, Switch, RadioGroup, NumberField,
 * Slider, Select, OTPField) into a surrounding `Field.Root`, when there is one.
 *
 * A field-aware control:
 * - is labelled by `Field.Label` and described by `Field.Description`/`Error`
 *   (through `accessibilityLabelledBy`/`accessibilityDescribedBy`);
 * - inherits the field's (and its fieldset's) `disabled`;
 * - runs the field's `validate` when its value changes;
 * - reports `dirty`/`filled`/`touched`/`focused` back to the field, which is
 *   what `Field.Validity` and `Field.Error` branch on.
 *
 * Outside a `Field.Root` everything is `undefined`/no-op, so a standalone
 * control is unaffected.
 */
export function useFieldControlRegistration(
  parameters: UseFieldControlRegistrationParameters = {},
) {
  const { initialValue, isFilled = defaultIsFilled, focusRef, ownsValue = false } = parameters;

  const field = useFieldRootContext(false);

  // Only the value the control mounted with decides `dirty`; a later prop change
  // from the consumer is a new baseline they set themselves, not user input.
  const initialValueRef = React.useRef(initialValue);

  const validate = useStableCallback((value: unknown) => {
    if (!field) {
      return;
    }
    const errors = field.runValidation(value);
    field.setValidityData({ valid: errors.length === 0, errors });
  });

  /**
   * Records a user-driven value change: the field becomes dirty (unless the
   * value is back to where it started), filled tracks the new value, and
   * `onChange` validation runs.
   */
  const markChanged = useStableCallback((value: unknown) => {
    if (!field) {
      return;
    }

    latestValueRef.current = value;

    // A server's complaint was about the value that was sent, not this one.
    field.clearExternalError();
    field.setDirty(!Object.is(value, initialValueRef.current));
    field.setFilled(isFilled(value));

    if (field.validationMode === 'onChange') {
      validate(value);
    }
  });

  /**
   * Records that the user is done with the control — the counterpart of a blur
   * on a text input, which is when `onBlur` validation runs.
   */
  const markTouched = useStableCallback((value: unknown) => {
    if (!field) {
      return;
    }

    field.setTouched(true);

    if (field.validationMode === 'onBlur') {
      validate(value);
    }
  });

  const markFocused = useStableCallback((focused: boolean) => {
    field?.setFocused(focused);
  });

  // What a surrounding `Form` revalidates against on submit. `markChanged` keeps
  // it current; until the user touches anything it is the mount value.
  const latestValueRef = React.useRef(initialValue);

  useIsoLayoutEffect(() => {
    if (!field || !ownsValue) {
      return undefined;
    }

    return field.registerControl({
      validate: () => {
        const errors = field.runValidation(latestValueRef.current);
        field.setValidityData({ valid: errors.length === 0, errors });
        return errors;
      },
      focus: () => focusRef?.current?.focus?.(),
    });
  }, [field, focusRef, ownsValue]);

  const describedBy =
    field && field.messageIds.length > 0 ? field.messageIds.join(' ') : undefined;

  return {
    /**
     * `true` when a surrounding field (or fieldset) is disabled.
     */
    fieldDisabled: field?.disabled ?? false,
    /**
     * Accessibility props associating the control with the field's label and
     * messages, and reporting its validity. Spread into the control's props
     * before `elementProps`.
     */
    fieldProps: {
      accessibilityLabelledBy: field?.labelId,
      accessibilityDescribedBy: describedBy,
      'aria-labelledby': field?.labelId,
      'aria-describedby': describedBy,
      'aria-invalid': field?.validityData.valid === false || undefined,
    },
    /**
     * Runs the field's validation for a new control value, regardless of
     * `validationMode`. No-op without a field.
     */
    validateField: validate,
    markChanged,
    markTouched,
    markFocused,
    /**
     * Whether a surrounding field is present at all.
     */
    hasField: field != null,
  };
}
