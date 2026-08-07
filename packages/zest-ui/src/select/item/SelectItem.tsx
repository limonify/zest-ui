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
import { toggleSelectedValue } from '../../utils/selection';
import { SelectItemContext } from './SelectItemContext';
import { useStoreState } from '../../store/ReactStore';

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
  const readOnly = useStoreState(store, 'readOnly');

  // Subscribing to the boolean, not to the whole selection: choosing one row in
  // a long list then re-renders only the rows whose answer changed.
  const selected = useStoreState(store, 'isSelected', value);

  const { index, onLayout } = useCompositeListItem();

  const [pressed, setPressed] = React.useState(false);

  const { getButtonProps } = useButton({ disabled });


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

          // Read at press time rather than subscribing: an item does not need to
          // re-render when a *different* row's selection changes.
          store.setValue(
            toggleSelectedValue(
              store.select('value'),
              value,
              store.select('multiple'),
              store.select('isItemEqualToValue'),
            ),
            eventDetails,
          );

          if (eventDetails.isCanceled) {
            return;
          }

          // Picking one of many is rarely the end of the interaction, so a
          // multiple select stays open until it is dismissed.
          if (!store.select('multiple')) {
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
