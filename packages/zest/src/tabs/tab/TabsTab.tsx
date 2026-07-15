'use client';
import * as React from 'react';
import { Pressable, type GestureResponderEvent } from 'react-native';
import { useId } from '../../hooks/useId';
import { useRenderElement } from '../../use-render/useRenderElement';
import { useButton } from '../../internals/use-button/useButton';
import { useCompositeListItem } from '../../internals/composite/list/useCompositeListItem';
import type { CompositeItemLayout } from '../../internals/composite/list/CompositeListContext';
import { useTabsRootContext } from '../root/TabsRootContext';
import type { TabsRoot } from '../root/TabsRoot';
import type { BaseUIComponentProps } from '../../types';
import { createChangeEventDetails } from '../../utils/createChangeEventDetails';
import { REASONS } from '../../utils/reasons';

/**
 * An individual interactive tab button that toggles the corresponding panel.
 * Renders a `<Pressable>`.
 */
export function TabsTab(componentProps: TabsTab.Props) {
  const { className, disabled = false, render, style, value, ref, ...elementProps } = componentProps;

  const {
    value: activeTabValue,
    getTabPanelIdByValue,
    onValueChange,
    orientation,
    tabActivationDirection,
  } = useTabsRootContext();

  const id = useId();

  const metadata = React.useMemo(() => ({ disabled, id, value }), [disabled, id, value]);

  const { onLayout } = useCompositeListItem<TabsTab.Metadata>({ metadata });

  const active = value === activeTabValue;

  const [pressed, setPressed] = React.useState(false);

  const { getButtonProps } = useButton({ disabled });

  const tabPanelId = getTabPanelIdByValue(value);

  const state: TabsTabState = { disabled, active, orientation, tabActivationDirection, pressed };

  return useRenderElement(Pressable, componentProps, {
    state,
    ref,
    props: [
      {
        nativeID: id,
        onLayout,
        accessibilityRole: 'tab' as const,
        accessibilityState: { selected: active, disabled: disabled || undefined },
        'aria-controls': tabPanelId,
        'aria-selected': active,
        onPress(event: GestureResponderEvent) {
          if (active || disabled) {
            return;
          }

          onValueChange(
            value,
            createChangeEventDetails(REASONS.none, event, {
              activationDirection: 'none' as const,
            }) as TabsRoot.ChangeEventDetails,
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

export type TabsTabValue = any | null;

export type TabsTabActivationDirection = 'left' | 'right' | 'up' | 'down' | 'none';

export interface TabsTabPosition {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

export interface TabsTabSize {
  width: number;
  height: number;
}

export interface TabsTabMetadata {
  disabled: boolean;
  id: string | undefined;
  value: TabsTab.Value | undefined;
  /** Filled in by `CompositeList` from the tab's `onLayout`. */
  layout?: CompositeItemLayout | undefined;
}

export interface TabsTabState {
  /**
   * Whether the component should ignore user interaction.
   */
  disabled: boolean;
  /**
   * Whether the component is active.
   */
  active: boolean;
  /**
   * The component orientation.
   */
  orientation: TabsRoot.Orientation;
  /**
   * The direction used for tab activation.
   */
  tabActivationDirection: TabsTab.ActivationDirection;
  /**
   * Whether the tab is currently pressed.
   */
  pressed: boolean;
}

export interface TabsTabProps
  extends Omit<BaseUIComponentProps<typeof Pressable, TabsTabState>, 'value' | 'onPress'> {
  /**
   * The value of the Tab.
   */
  value: TabsTab.Value;
  /**
   * Whether the Tab is disabled.
   *
   * If the first Tab in a `<Tabs.List>` is disabled, it won't initially be
   * selected; the next enabled Tab will be.
   * @default false
   */
  disabled?: boolean | undefined;
}

export namespace TabsTab {
  export type Value = TabsTabValue;
  export type ActivationDirection = TabsTabActivationDirection;
  export type Position = TabsTabPosition;
  export type Size = TabsTabSize;
  export type Metadata = TabsTabMetadata;
  export type State = TabsTabState;
  export type Props = TabsTabProps;
}
