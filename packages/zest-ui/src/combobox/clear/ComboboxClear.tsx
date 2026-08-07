'use client';
import * as React from 'react';
import { Pressable, type GestureResponderEvent } from 'react-native';
import { useComboboxRootContext } from '../root/ComboboxRootContext';
import { useComboboxItemsContext } from '../root/ComboboxItemsContext';
import { useRenderElement } from '../../use-render/useRenderElement';
import { useButton } from '../../internals/use-button/useButton';
import { createChangeEventDetails } from '../../utils/createChangeEventDetails';
import { REASONS } from '../../utils/reasons';
import type { ZestUIComponentProps } from '../../types';
import { useStoreState } from '../../store/ReactStore';

/**
 * A button that clears the selection and the input text.
 * Renders a `<Pressable>`.
 *
 * It renders nothing while there is nothing to clear, unless `keepMounted` is
 * set. It has no label of its own — pass `accessibilityLabel`.
 *
 * Unlike the web version it does **not** return focus to the input: with
 * `openOnFocus` that would reopen the list.
 */
export function ComboboxClear(componentProps: ComboboxClear.Props) {
  const {
    render,
    className,
    style,
    disabled: disabledProp = false,
    keepMounted = false,
    ref,
    ...elementProps
  } = componentProps;

  const store = useComboboxRootContext();
  const { selectedItems } = useComboboxItemsContext();

  const comboboxDisabled = useStoreState(store, 'disabled');
  const mode = useStoreState(store, 'mode');
  const inputValue = useStoreState(store, 'inputValue');

  const disabled = comboboxDisabled || disabledProp;

  // An autocomplete's value *is* its input text, so there the text is the only
  // thing there is to clear.
  const visible = mode === 'autocomplete' ? inputValue !== '' : selectedItems.length > 0;

  const [pressed, setPressed] = React.useState(false);

  const { getButtonProps } = useButton({ disabled });

  const state: ComboboxClearState = React.useMemo(
    () => ({ disabled, pressed, visible }),
    [disabled, pressed, visible],
  );

  return useRenderElement(Pressable, componentProps, {
    state,
    ref,
    enabled: visible || keepMounted,
    props: [
      {
        onPress(event: GestureResponderEvent) {
          store.clear(createChangeEventDetails(REASONS.clearPress, event));
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

export interface ComboboxClearState {
  /**
   * Whether the component should ignore user interaction.
   */
  disabled: boolean;
  /**
   * Whether the button is currently pressed.
   */
  pressed: boolean;
  /**
   * Whether there is anything to clear.
   */
  visible: boolean;
}

export interface ComboboxClearProps
  extends Omit<ZestUIComponentProps<typeof Pressable, ComboboxClearState>, 'onPress'> {
  /**
   * Whether the component should ignore user interaction.
   * @default false
   */
  disabled?: boolean | undefined;
  /**
   * Whether to keep the button mounted while there is nothing to clear, so it
   * can be hidden with a style instead. Required to animate it out — nothing in
   * React Native can report that an exit animation finished.
   * @default false
   */
  keepMounted?: boolean | undefined;
}

export namespace ComboboxClear {
  export type State = ComboboxClearState;
  export type Props = ComboboxClearProps;
}
