'use client';
import { useFieldRootContext } from '../../field/root/FieldRootContext';
import { useStableCallback } from '../../hooks/useStableCallback';

/**
 * Wires a non-text form control (Checkbox, Switch, RadioGroup, NumberField) into
 * a surrounding `Field.Root`, when there is one.
 *
 * A field-aware control:
 * - is labelled by `Field.Label` and described by `Field.Description`/`Error`
 *   (through `accessibilityLabelledBy`/`accessibilityDescribedBy`);
 * - inherits the field's (and its fieldset's) `disabled`;
 * - runs the field's `validate` when its value changes.
 *
 * Outside a `Field.Root` everything is `undefined`/no-op, so a standalone
 * control is unaffected.
 */
export function useFieldControlRegistration() {
  const field = useFieldRootContext(false);

  const validate = useStableCallback((value: unknown) => {
    if (!field) {
      return;
    }
    const errors = field.runValidation(value);
    field.setValidityData({ valid: errors.length === 0, errors });
  });

  const describedBy =
    field && field.messageIds.length > 0 ? field.messageIds.join(' ') : undefined;

  return {
    /**
     * `true` when a surrounding field (or fieldset) is disabled.
     */
    fieldDisabled: field?.disabled ?? false,
    /**
     * Accessibility props associating the control with the field's label and
     * messages. Spread into the control's props before `elementProps`.
     */
    fieldProps: {
      accessibilityLabelledBy: field?.labelId,
      accessibilityDescribedBy: describedBy,
      'aria-labelledby': field?.labelId,
      'aria-describedby': describedBy,
    },
    /**
     * Runs the field's validation for a new control value. No-op without a field.
     */
    validateField: validate,
    /**
     * Whether a surrounding field is present at all.
     */
    hasField: field != null,
  };
}
