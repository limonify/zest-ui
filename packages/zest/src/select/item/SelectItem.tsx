'use client';
import * as React from 'react';
import { Pressable, type GestureResponderEvent } from 'react-native';
import { useSelectRootContext } from '../root/SelectRootContext';
import { useRenderElement } from '../../use-render/useRenderElement';
import { useButton } from '../../internals/use-button/useButton';
import { useCompositeListItem } from '../../internals/composite/list/useCompositeListItem';
import type { ZestUIComponentProps } from '../../types';
import { createChangeEventDetails } from '../../utils/createChangeEventDetails';
import { REASONS } from '../../utils/reasons';
import { isSelectValueSelected, toggleSelectValue } from '../store/SelectStore';
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
  const multiple = store.useState('multiple');

  const { index, onLayout } = useCompositeListItem();

  const [pressed, setPressed] = React.useState(false);

  const { getButtonProps } = useButton({ disabled });

  const selected = isSelectValueSelected(selectedValue, value, multiple);

  const state: SelectItemState = React.useMemo(
    () => ({ disabled, pressed, selected, index }),
    [disabled, pressed, selected, index],
  );

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

          store.setValue(toggleSelectValue(selectedValue, value, multiple), eventDetails);

          if (eventDetails.isCanceled) {
            return;
          }

          // Picking one of many is rarely the end of the interaction, so a
          // multiple select stays open until it is dismissed.
          if (!multiple) {
            store.setOpen(false, eventDetails);
          }
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
   * Whether the item is selected. In a `multiple` select, whether it is among
   * the selected values.
   */
  selected: boolean;
  /**
   * The item's index in the list, in visual order.
   */
  index: number;
}

export interface SelectItemProps<Value = any>
  extends Omit<ZestUIComponentProps<typeof Pressable, SelectItemState>, 'value' | 'onPress'> {
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
