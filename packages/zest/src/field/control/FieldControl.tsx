'use client';
import { TextInput } from 'react-native';
import { useRenderElement } from '../../use-render/useRenderElement';
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

  const { props } = useFieldControl({
    value: valueProp,
    defaultValue,
    onValueChange,
    nativeID,
    requireField: true,
  });

  return useRenderElement(TextInput, componentProps, {
    state,
    ref,
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
