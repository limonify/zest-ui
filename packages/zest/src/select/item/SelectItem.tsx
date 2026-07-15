'use client';
import * as React from 'react';
import { Pressable, type GestureResponderEvent } from 'react-native';
import { useSelectRootContext } from '../root/SelectRootContext';
import { useRenderElement } from '../../use-render/useRenderElement';
import { useButton } from '../../internals/use-button/useButton';
import { useCompositeListItem } from '../../internals/composite/list/useCompositeListItem';
import type { BaseUIComponentProps } from '../../types';
import { createChangeEventDetails } from '../../utils/createChangeEventDetails';
import { REASONS } from '../../utils/reasons';
import { SelectItemContext } from './SelectItemContext';

/**
 * An individual option in the select.
 * Renders a `<Pressable>`.
 */
export function SelectItem<Value = any>(componentProps: SelectItem.Props<Value>) {
  const {
    className,
    disabled = false,
    render,
    style,
    value,
    ref,
    ...elementProps
  } = componentProps;

  const store = useSelectRootContext();
  const selectedValue = store.useState('value');
  const readOnly = store.useState('readOnly');

  const { index, onLayout } = useCompositeListItem();

  const [pressed, setPressed] = React.useState(false);

  const { getButtonProps } = useButton({ disabled });

  const selected = selectedValue === value;

  const state: SelectItemState = { disabled, pressed, selected, index };

  const contextValue: SelectItemContext = React.useMemo(() => ({ state, value }), [state, value]);

  const element = useRenderElement(Pressable, componentProps, {
    state,
    ref,
    props: [
      {
        onLayout,
        accessibilityRole: 'menuitem' as const,
        role: 'option' as const,
        accessibilityState: { selected, disabled: disabled || undefined },
        'aria-selected': selected,
        onPress(event: GestureResponderEvent) {
          if (disabled || readOnly) {
            return;
          }

          // One event details object is shared, so canceling in `onValueChange`
          // also stops the popup from closing.
          const eventDetails = createChangeEventDetails(REASONS.itemPress, event);

          store.setValue(value, eventDetails);

          if (eventDetails.isCanceled) {
            return;
          }

          store.setOpen(false, eventDetails);
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

  return <SelectItemContext.Provider value={contextValue}>{element}</SelectItemContext.Provider>;
}

export interface SelectItemState {
  /**
   * Whether the component should ignore user interaction.
   */
  disabled: boolean;
  /**
   * Whether the item is currently pressed.
   */
  pressed: boolean;
  /**
   * Whether the item is the selected one.
   */
  selected: boolean;
  /**
   * The item's index in the list, in visual order.
   */
  index: number;
}

export interface SelectItemProps<Value = any>
  extends Omit<BaseUIComponentProps<typeof Pressable, SelectItemState>, 'value' | 'onPress'> {
  /**
   * The value this item selects.
   */
  value: Value;
  /**
   * Whether the component should ignore user interaction.
   * @default false
   */
  disabled?: boolean | undefined;
}

export namespace SelectItem {
  export type State = SelectItemState;
  export type Props<TValue = any> = SelectItemProps<TValue>;
}
