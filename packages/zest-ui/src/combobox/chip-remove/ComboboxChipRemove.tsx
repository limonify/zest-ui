'use client';
import * as React from 'react';
import { Pressable, type GestureResponderEvent } from 'react-native';
import { useComboboxRootContext } from '../root/ComboboxRootContext';
import { useComboboxChipContext } from '../chip/ComboboxChipContext';
import { useRenderElement } from '../../use-render/useRenderElement';
import { useButton } from '../../internals/use-button/useButton';
import { createChangeEventDetails } from '../../utils/createChangeEventDetails';
import { REASONS } from '../../utils/reasons';
import type { ZestUIComponentProps } from '../../types';
import { useStoreState } from '../../store/ReactStore';

/**
 * A button that deselects the value its chip stands for.
 * Renders a `<Pressable>`.
 *
 * It has no label of its own — pass `accessibilityLabel` naming what it removes.
 *
 * Unlike the web version it does **not** return focus to the input: with
 * `openOnFocus` that would reopen the list, which is not what removing a chip
 * asks for.
 */
export function ComboboxChipRemove(componentProps: ComboboxChipRemove.Props) {
  const { render, className, style, disabled: disabledProp = false, ref, ...elementProps } = componentProps;

  const store = useComboboxRootContext();
  const { index } = useComboboxChipContext();

  const comboboxDisabled = useStoreState(store, 'disabled');
  const selectedValue = useStoreState(store, 'value');

  const disabled = comboboxDisabled || disabledProp;

  const [pressed, setPressed] = React.useState(false);

  const { getButtonProps } = useButton({ disabled });

  const state: ComboboxChipRemoveState = React.useMemo(
    () => ({ disabled, pressed }),
    [disabled, pressed],
  );

  return useRenderElement(Pressable, componentProps, {
    state,
    ref,
    props: [
      {
        onPress(event: GestureResponderEvent) {
          const current = Array.isArray(selectedValue) ? selectedValue : [];

          store.setValue(
            current.filter((_, i) => i !== index),
            createChangeEventDetails(REASONS.chipRemovePress, event),
          );
        },
        onPressIn() {
          setPressed(true);
        },
        onPressOut() {
          setPressed(false);
        },
      },
      elementProps,
      getButtonProps,
    ],
  });
}

export interface ComboboxChipRemoveState {
  /**
   * Whether the component should ignore user interaction.
   */
  disabled: boolean;
  /**
   * Whether the button is currently pressed.
   */
  pressed: boolean;
}

export interface ComboboxChipRemoveProps
  extends Omit<ZestUIComponentProps<typeof Pressable, ComboboxChipRemoveState>, 'onPress'> {
  /**
   * Whether the component should ignore user interaction.
   * @default false
   */
  disabled?: boolean | undefined;
}

export namespace ComboboxChipRemove {
  export type State = ComboboxChipRemoveState;
  export type Props = ComboboxChipRemoveProps;
}
