'use client';
import * as React from 'react';
import { TextInput } from 'react-native';
import { useRenderElement } from '../../use-render/useRenderElement';
import { useMergedRefs } from '../../hooks/useMergedRefs';
import { useFieldRootContext } from '../root/FieldRootContext';
import type { FieldRoot } from '../root/FieldRoot';
import type { ZestUIComponentProps } from '../../types';
import { useFieldControl } from './useFieldControl';

/**
 * The field's text input.
 * Renders a `<TextInput>`.
 */
export function FieldControl(componentProps: FieldControl.Props) {
  const {
    render,
    className,
    style,
    value: valueProp,
    defaultValue,
    onValueChange,
    nativeID,
    ref,
    ...elementProps
  } = componentProps;

  const { state } = useFieldRootContext();

  // The form focuses the first invalid field on submit, and needs a handle on
  // the input to do it.
  const inputRef = React.useRef<TextInput>(null);
  const mergedRef = useMergedRefs(ref, inputRef);

  const { props } = useFieldControl({
    value: valueProp,
    defaultValue,
    onValueChange,
    nativeID,
    inputRef,
    requireField: true,
  });

  return useRenderElement(TextInput, componentProps, {
    state,
    ref: mergedRef,
    props: [props, elementProps],
  });
}

export interface FieldControlState extends FieldRoot.State {}

export interface FieldControlProps
  extends Omit<ZestUIComponentProps<typeof TextInput, FieldControlState>, 'value'> {
  /**
   * The controlled text value.
   */
  value?: string | undefined;
  /**
   * The initial text value when uncontrolled.
   */
  defaultValue?: string | undefined;
  /**
   * Called with the new text as it changes.
   */
  onValueChange?: ((value: string) => void) | undefined;
}

export namespace FieldControl {
  export type State = FieldControlState;
  export type Props = FieldControlProps;
}
