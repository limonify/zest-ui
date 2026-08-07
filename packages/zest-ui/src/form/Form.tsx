'use client';
import * as React from 'react';
import { View } from 'react-native';
import { useRefWithInit } from '../hooks/useRefWithInit';
import { useStableCallback } from '../hooks/useStableCallback';
import { useIsoLayoutEffect } from '../hooks/useIsoLayoutEffect';
import { useRenderElement } from '../use-render/useRenderElement';
import { EMPTY_OBJECT } from '../utils/empty';
import type { ZestUIComponentProps } from '../types';
import { FormContext, type FormFieldEntry } from './FormContext';

/**
 * Groups the fields of a form, distributes errors to them, and validates them
 * all at once.
 * Renders a `<View>`.
 *
 * **Adapted from upstream, not a verbatim port.** React Native has no HTML form
 * submission, so there is no `<form>` element, no `action`, and no submit event
 * to hook. What is left is the part that carries its weight anyway: `errors`
 * puts messages from a server onto the right fields, and submitting validates
 * every field and sends the user to the first one that failed.
 *
 * Submission is imperative, through `actionsRef` — there is no native event to
 * ride on:
 *
 * ```tsx
 * const form = React.useRef<Form.Actions>(null);
 *
 * <Form actionsRef={form} errors={errors} onClearErrors={setErrors} onSubmit={save}>
 *   <Field.Root name="email">…</Field.Root>
 * </Form>
 * <Button onPress={() => form.current?.submit()}>Save</Button>
 * ```
 */
export function Form(componentProps: Form.Props) {
  const {
    render,
    className,
    style,
    actionsRef,
    errors = EMPTY_OBJECT as Record<string, string | string[]>,
    onClearErrors,
    onSubmit,
    ref,
    ...elementProps
  } = componentProps;

  // A Map keeps insertion order, and fields register from a layout effect —
  // which React runs in child order. So iterating it is walking the form top to
  // bottom, which is what "the first invalid field" has to mean.
  const fields = useRefWithInit(() => new Map<string, FormFieldEntry>()).current;

  const errorsRef = React.useRef(errors);
  useIsoLayoutEffect(() => {
    errorsRef.current = errors;
  });

  const registerField = useStableCallback((name: string, entry: FormFieldEntry) => {
    fields.set(name, entry);

    return () => {
      fields.delete(name);
    };
  });

  const clearError = useStableCallback((name: string) => {
    const current = errorsRef.current;
    if (!(name in current)) {
      return;
    }

    const next = { ...current };
    delete next[name];
    onClearErrors?.(next);
  });

  /**
   * Validates every field, returning the first that failed — by its own
   * `validate` or by an error the consumer put on it.
   */
  const validateAll = useStableCallback(() => {
    let firstInvalid: FormFieldEntry | undefined;

    for (const [name, entry] of fields) {
      // Touching every field is what lets their `Field.Error` show at all: an
      // untouched field is one the user has not reached yet.
      entry.markTouched();

      const failed = entry.validate().length > 0 || name in errorsRef.current;
      if (failed && firstInvalid === undefined) {
        firstInvalid = entry;
      }
    }

    return firstInvalid;
  });

  const submit = useStableCallback(() => {
    const firstInvalid = validateAll();

    if (firstInvalid !== undefined) {
      // Not every control can take focus — a checkbox is a `Pressable`. When it
      // cannot, the field is still marked invalid and its error is showing;
      // there is just nothing to move the cursor to.
      firstInvalid.focus();
      return false;
    }

    onSubmit?.();
    return true;
  });

  const validate = useStableCallback(() => validateAll() === undefined);

  useIsoLayoutEffect(() => {
    if (!actionsRef) {
      return undefined;
    }

    actionsRef.current = { submit, validate };

    return () => {
      actionsRef.current = null;
    };
  }, [actionsRef, submit, validate]);

  const contextValue: FormContext = React.useMemo(
    () => ({ errors, clearError, registerField }),
    [errors, clearError, registerField],
  );

  const state: FormState = EMPTY_OBJECT;

  const element = useRenderElement(View, componentProps, {
    state,
    ref,
    props: [{ role: 'form' as const }, elementProps],
  });

  return <FormContext.Provider value={contextValue}>{element}</FormContext.Provider>;
}

export interface FormState {}

export interface FormActions {
  /**
   * Validates every field. If one fails, focuses the first that can be focused
   * and returns `false`; otherwise calls `onSubmit` and returns `true`.
   */
  submit: () => boolean;
  /**
   * Validates every field and reports whether the form is valid, without
   * submitting.
   */
  validate: () => boolean;
}

export interface FormProps extends ZestUIComponentProps<typeof View, FormState> {
  /**
   * Errors to show on the fields, keyed by their `name` — a server's response,
   * typically. A field drops its error as soon as the user changes it, which is
   * reported through `onClearErrors`.
   */
  errors?: Record<string, string | string[]> | undefined;
  /**
   * Called with the remaining errors when a field's error is dropped. Keep your
   * `errors` state in sync with it.
   */
  onClearErrors?: ((errors: Record<string, string | string[]>) => void) | undefined;
  /**
   * Called when `actionsRef.current.submit()` finds every field valid.
   */
  onSubmit?: (() => void) | undefined;
  /**
   * A ref to imperative actions. React Native has no submit event, so this is
   * how a form is submitted.
   */
  actionsRef?: React.RefObject<FormActions | null> | undefined;
}

export namespace Form {
  export type State = FormState;
  export type Props = FormProps;
  export type Actions = FormActions;
}
