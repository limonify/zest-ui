'use client';
import * as React from 'react';

/**
 * What a `Field.Root` offers the surrounding form: a way to revalidate on
 * submit, and a way to put the user back in front of whatever failed.
 */
export interface FormFieldEntry {
  /**
   * Revalidates the field's control against its current value, returning the
   * error messages (empty when valid).
   */
  validate: () => string[];
  /**
   * Focuses the field's control, if it is something that can take focus. A
   * checkbox or a slider is a `Pressable`, and there is nothing to focus.
   */
  focus: () => void;
  /**
   * Marks the field touched, so its `Field.Error` is allowed to show.
   */
  markTouched: () => void;
}

export interface FormContext {
  /**
   * Errors the consumer put on the form from outside — a server response,
   * typically — keyed by field name.
   */
  errors: Record<string, string | string[]>;
  /**
   * Drops the error for one field. A field calls this as soon as the user
   * changes it: an error that came back from the server describes the value
   * that was sent, not the one being typed now.
   */
  clearError: (name: string) => void;
  /**
   * Registers a field under its `name`. Returns the cleanup.
   */
  registerField: (name: string, entry: FormFieldEntry) => () => void;
}

export const FormContext = React.createContext<FormContext | undefined>(undefined);

/**
 * Reads the form context. Fields pass `false`: a field outside a form is
 * perfectly ordinary.
 */
export function useFormContext(optional: false): FormContext | undefined;
export function useFormContext(optional?: true): FormContext;
export function useFormContext(optional = true): FormContext | undefined {
  const context = React.useContext(FormContext);
  if (context === undefined && optional) {
    throw new Error('Zest: FormContext is missing. This part must be placed within <Form>.');
  }

  return context;
}
