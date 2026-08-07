'use client';
import * as React from 'react';
import { Text } from 'react-native';
import { useRenderElement } from '../../use-render/useRenderElement';
import { useId } from '../../hooks/useId';
import { useIsoLayoutEffect } from '../../hooks/useIsoLayoutEffect';
import { useFieldRootContext } from '../root/FieldRootContext';
import type { FieldRoot } from '../root/FieldRoot';
import type { ZestUIComponentProps } from '../../types';

/**
 * An error message shown when the field's control fails validation.
 * Renders a `<Text>`, or nothing when the field is valid.
 *
 * With no children, it renders the first message `validate` returned. `match`
 * forces it to always render (e.g. for a static hint).
 */
export function FieldError(componentProps: FieldError.Props) {
  const {
    render,
    className,
    style,
    nativeID: idProp,
    match,
    children,
    ref,
    ...elementProps
  } = componentProps;

  const { validityData, setMessageIds, state: fieldState } = useFieldRootContext();

  const id = useId(idProp ?? undefined);

  const rendered = match === true ? true : !fieldState.disabled && validityData.valid === false;

  useIsoLayoutEffect(() => {
    if (!rendered || !id) {
      return undefined;
    }
    setMessageIds((previous) => previous.concat(id));
    return () => setMessageIds((previous) => previous.filter((item) => item !== id));
  }, [rendered, id, setMessageIds]);

  // Every message is on the state, so a `validate` that returns several can be
  // rendered in full; `children` defaults to the first, which is the common case.
  const state: FieldErrorState = React.useMemo(
    () => ({ ...fieldState, errors: validityData.errors }),
    [fieldState, validityData.errors],
  );

  const content = children ?? validityData.errors[0];

  return useRenderElement(Text, componentProps, {
    state,
    ref,
    enabled: rendered,
    props: [{ nativeID: id, role: 'alert' as const, children: content }, elementProps],
  });
}

export interface FieldErrorState extends FieldRoot.State {
  /**
   * Every message the field's `validate` returned, in order. Empty when the
   * field is valid. `children` defaults to the first of them.
   */
  errors: string[];
}

export interface FieldErrorProps
  extends Omit<ZestUIComponentProps<typeof Text, FieldErrorState>, 'children'> {
  /**
   * Force the message to render regardless of validity (e.g. a persistent hint).
   */
  match?: true | undefined;
  children?: React.ReactNode;
}

export namespace FieldError {
  export type State = FieldErrorState;
  export type Props = FieldErrorProps;
}
