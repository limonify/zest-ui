'use client';
import { View } from 'react-native';
import { useId } from '../../hooks/useId';
import { useIsoLayoutEffect } from '../../hooks/useIsoLayoutEffect';
import { useRenderElement } from '../../use-render/useRenderElement';
import { useTransitionStatus, type TransitionStatus } from '../../internals/useTransitionStatus';
import type { TabsRoot } from '../root/TabsRoot';
import { useTabsRootContext } from '../root/TabsRootContext';
import type { TabsTab } from '../tab/TabsTab';
import type { ZestUIComponentProps } from '../../types';

/**
 * A panel displayed when the corresponding tab is active.
 * Renders a `<View>`.
 */
export function TabsPanel(componentProps: TabsPanel.Props) {
  const {
    className,
    keepMounted = false,
    render,
    style,
    value,
    ref,
    ...elementProps
  } = componentProps;

  const {
    value: selectedValue,
    getTabIdByPanelValue,
    orientation,
    registerMountedTabPanel,
    tabActivationDirection,
  } = useTabsRootContext();

  const id = useId();

  const open = value === selectedValue;
  const { mounted, transitionStatus, setMounted } = useTransitionStatus(open);

  // Nothing in React Native reports when a closing animation finished, so a
  // panel that isn't kept mounted is torn down as soon as it is deselected.
  useIsoLayoutEffect(() => {
    if (!open && mounted && !keepMounted) {
      setMounted(false);
    }
  }, [open, mounted, keepMounted, setMounted]);

  useIsoLayoutEffect(() => {
    if (id === undefined) {
      return undefined;
    }

    return registerMountedTabPanel(value, id);
  }, [registerMountedTabPanel, value, id]);

  const hidden = !open;
  const correspondingTabId = getTabIdByPanelValue(value);

  const state: TabsPanelState = { hidden, orientation, tabActivationDirection, transitionStatus };

  const shouldRender = keepMounted || mounted;

  return useRenderElement(View, componentProps, {
    state,
    ref,
    enabled: shouldRender,
    props: [
      {
        nativeID: id,
        role: 'tabpanel' as const,
        accessibilityLabelledBy: correspondingTabId,
        'aria-labelledby': correspondingTabId,
        'aria-hidden': hidden || undefined,
        accessibilityElementsHidden: hidden,
        importantForAccessibility: hidden ? ('no-hide-descendants' as const) : ('auto' as const),
      },
      elementProps,
    ],
  });
}

export interface TabsPanelState {
  /**
   * Whether the panel is currently hidden.
   */
  hidden: boolean;
  /**
   * The component orientation.
   */
  orientation: TabsRoot.Orientation;
  /**
   * The direction used for tab activation.
   */
  tabActivationDirection: TabsTab.ActivationDirection;
  /**
   * The transition status of the component.
   */
  transitionStatus: TransitionStatus;
}

export interface TabsPanelProps
  extends Omit<ZestUIComponentProps<typeof View, TabsPanelState>, 'value'> {
  /**
   * The value of the Panel, which associates it with the Tab of the same value.
   */
  value: TabsTab.Value;
  /**
   * Whether to keep the element rendered while the panel is not selected.
   *
   * Required to animate the panel out: React Native cannot report when a
   * closing animation has finished, so an unmounted panel disappears at once.
   * @default false
   */
  keepMounted?: boolean | undefined;
}

export namespace TabsPanel {
  export type State = TabsPanelState;
  export type Props = TabsPanelProps;
}
