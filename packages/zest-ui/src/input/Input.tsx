'use client';
import { TextInput } from 'react-native';
import { useRenderElement } from '../use-render/useRenderElement';
import { useFieldControl } from '../field/control/useFieldControl';
import type { ZestUIComponentProps } from '../types';

/**
 * A text input. Renders a `<TextInput>`.
 *
 * Upstream's `Input` is an alias for `Field.Control`. Here it is the same: use
 * it standalone, or inside a `Field.Root` to pick up its label, description,
 * error wiring, and validation automatically.
 */
export function Input(componentProps: Input.Props) {
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

  const { field, props } = useFieldControl({
    value: valueProp,
    defaultValue,
    onValueChange,
    nativeID,
    requireField: false,
  });

  const state: Input.State = { disabled: field?.disabled ?? false };

  return useRenderElement(TextInput, componentProps, {
    state,
    ref,
    props: [props, elementProps],
  });
}

export interface InputState {
  /**
   * Whether the input is disabled (inherited from a surrounding field).
   */
  disabled: boolean;
}

export interface InputProps extends Omit<ZestUIComponentProps<typeof TextInput, InputState>, 'value'> {
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

export namespace Input {
  export type State = InputState;
  export type Props = InputProps;
}
