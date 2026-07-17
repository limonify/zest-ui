'use client';
import * as React from 'react';
import { View } from 'react-native';
import { useControlled } from '../../hooks/useControlled';
import { useIsoLayoutEffect } from '../../hooks/useIsoLayoutEffect';
import { useStableCallback } from '../../hooks/useStableCallback';
import { useRenderElement } from '../../use-render/useRenderElement';
import type { ZestUIComponentProps, Orientation } from '../../types';
import {
  createChangeEventDetails,
  type ZestChangeEventDetails,
} from '../../utils/createChangeEventDetails';
import { REASONS } from '../../utils/reasons';
import type { TabsTab } from '../tab/TabsTab';
import { TabsRootContext, type TabMap } from './TabsRootContext';

/**
 * Groups the tabs and the corresponding panels.
 * Renders a `<View>`.
 */
export function TabsRoot(componentProps: TabsRoot.Props) {
  const {
    className,
    defaultValue: defaultValueProp = 0,
    onValueChange: onValueChangeProp,
    orientation = 'horizontal',
    render,
    style,
    value: valueProp,
    ref,
    ...elementProps
  } = componentProps;

  // Whether the user explicitly provided a `defaultValue`. An implicit default
  // is treated as owned by us, so resolving it is an automatic change.
  const hasExplicitDefaultValueProp = componentProps.defaultValue !== undefined;

  const [value, setValue] = useControlled<TabsTab.Value>({
    controlled: valueProp,
    default: defaultValueProp,
    name: 'Tabs',
    state: 'value',
  });

  const isControlled = valueProp !== undefined;

  const [tabMap, setTabMap] = React.useState<TabMap>(() => new Map());
  const [mountedTabPanels, setMountedTabPanels] = React.useState(
    () => new Map<TabsTab.Value, string>(),
  );

  const getTabMetadataByValue = React.useCallback(
    (tabValue: TabsTab.Value | undefined) => {
      if (tabValue === undefined) {
        return undefined;
      }

      for (const metadata of tabMap.values()) {
        if (metadata != null && metadata.value === tabValue) {
          return metadata;
        }
      }

      return undefined;
    },
    [tabMap],
  );

  const [activationDirectionState, setActivationDirectionState] = React.useState(() => ({
    previousValue: value,
    tabActivationDirection: 'none' as TabsTab.ActivationDirection,
  }));
  const { previousValue, tabActivationDirection: committedTabActivationDirection } =
    activationDirectionState;

  let tabActivationDirection = committedTabActivationDirection;

  // Computed during render so children see the right direction on their first
  // render after a selection change.
  if (previousValue !== value) {
    tabActivationDirection = computeActivationDirection(previousValue, value, orientation, tabMap);
  }

  const shouldSyncActivationDirectionState =
    previousValue !== value || committedTabActivationDirection !== tabActivationDirection;

  useIsoLayoutEffect(() => {
    if (!shouldSyncActivationDirectionState) {
      return;
    }

    setActivationDirectionState({ previousValue: value, tabActivationDirection });
  }, [value, shouldSyncActivationDirectionState, tabActivationDirection]);

  const onValueChange = useStableCallback(
    (newValue: TabsTab.Value, eventDetails: TabsRoot.ChangeEventDetails) => {
      eventDetails.activationDirection = computeActivationDirection(
        value,
        newValue,
        orientation,
        tabMap,
      );

      onValueChangeProp?.(newValue, eventDetails);

      if (eventDetails.isCanceled) {
        return;
      }

      setValue(newValue);
    },
  );

  const notifyAutomaticValueChange = useStableCallback(
    (nextValue: TabsTab.Value, reason: TabsRoot.ChangeEventReason) => {
      onValueChangeProp?.(
        nextValue,
        createChangeEventDetails(reason, undefined, { activationDirection: 'none' as const }),
      );
    },
  );

  const registerMountedTabPanel = useStableCallback((panelValue: TabsTab.Value, panelId: string) => {
    setMountedTabPanels((prev) => {
      if (prev.get(panelValue) === panelId) {
        return prev;
      }

      const next = new Map(prev);
      next.set(panelValue, panelId);
      return next;
    });

    return () => {
      setMountedTabPanels((prev) => {
        if (prev.get(panelValue) !== panelId) {
          return prev;
        }

        const next = new Map(prev);
        next.delete(panelValue);
        return next;
      });
    };
  });

  const getTabPanelIdByValue = React.useCallback(
    (tabValue: TabsTab.Value) => mountedTabPanels.get(tabValue),
    [mountedTabPanels],
  );

  const getTabIdByPanelValue = React.useCallback(
    (tabPanelValue: TabsTab.Value) => getTabMetadataByValue(tabPanelValue)?.id,
    [getTabMetadataByValue],
  );

  const selectedTabMetadata = React.useMemo(
    () => getTabMetadataByValue(value),
    [getTabMetadataByValue, value],
  );

  // The first non-disabled tab, used when the selection is disabled or missing.
  // `tabMap` iterates in visual order, so "first" means leftmost/topmost.
  const firstEnabledTabValue = React.useMemo(() => {
    for (const metadata of tabMap.values()) {
      if (metadata != null && !metadata.disabled) {
        return metadata.value;
      }
    }
    return undefined;
  }, [tabMap]);

  const shouldNotifyInitialValueChangeRef = React.useRef(!hasExplicitDefaultValueProp);
  const initialDefaultValueRef = React.useRef(defaultValueProp);
  // An explicit `defaultValue` may intentionally point at a disabled tab on
  // mount. Once that selection becomes valid, later disabled states fall back.
  const shouldHonorDisabledDefaultValueRef = React.useRef(hasExplicitDefaultValueProp);

  // Uncontrolled roots own automatic fallback. Controlled roots keep exactly the
  // value the parent supplied, even when that tab is disabled or missing.
  useIsoLayoutEffect(() => {
    if (isControlled || tabMap.size === 0) {
      return;
    }

    function commitAutomaticValueChange(
      fallbackValue: TabsTab.Value,
      fallbackReason: TabsRoot.ChangeEventReason,
    ) {
      setValue(fallbackValue);
      // Automatic fallbacks are not directional transitions, so reset the
      // direction alongside the value in the same commit.
      setActivationDirectionState((prev) =>
        prev.previousValue === fallbackValue && prev.tabActivationDirection === 'none'
          ? prev
          : { previousValue: fallbackValue, tabActivationDirection: 'none' },
      );
      notifyAutomaticValueChange(fallbackValue, fallbackReason);
      shouldNotifyInitialValueChangeRef.current = false;
    }

    const selectionIsDisabled = selectedTabMetadata?.disabled;
    const selectionIsMissing = selectedTabMetadata == null && value !== null;

    if (!selectionIsDisabled && value === initialDefaultValueRef.current) {
      shouldHonorDisabledDefaultValueRef.current = false;
    }

    if (
      shouldHonorDisabledDefaultValueRef.current &&
      selectionIsDisabled &&
      value === initialDefaultValueRef.current
    ) {
      return;
    }

    if (selectionIsDisabled || selectionIsMissing) {
      const fallbackValue = firstEnabledTabValue ?? null;

      if (value === fallbackValue) {
        shouldNotifyInitialValueChangeRef.current = false;
        return;
      }

      let fallbackReason: TabsRoot.ChangeEventReason = REASONS.missing;

      if (shouldNotifyInitialValueChangeRef.current) {
        fallbackReason = REASONS.initial;
      } else if (selectionIsDisabled) {
        fallbackReason = REASONS.disabled;
      }

      commitAutomaticValueChange(fallbackValue, fallbackReason);
      return;
    }

    if (shouldNotifyInitialValueChangeRef.current && selectedTabMetadata != null) {
      notifyAutomaticValueChange(value, REASONS.initial);
      shouldNotifyInitialValueChangeRef.current = false;
    }
  }, [
    firstEnabledTabValue,
    isControlled,
    notifyAutomaticValueChange,
    selectedTabMetadata,
    setValue,
    tabMap,
    value,
  ]);

  const contextValue: TabsRootContext = React.useMemo(
    () => ({
      getTabIdByPanelValue,
      getTabMetadataByValue,
      getTabPanelIdByValue,
      onValueChange,
      orientation,
      registerMountedTabPanel,
      setTabMap,
      tabActivationDirection,
      value,
    }),
    [
      getTabIdByPanelValue,
      getTabMetadataByValue,
      getTabPanelIdByValue,
      onValueChange,
      orientation,
      registerMountedTabPanel,
      tabActivationDirection,
      value,
    ],
  );

  const state: TabsRootState = { orientation, tabActivationDirection };

  const element = useRenderElement(View, componentProps, {
    state,
    ref,
    props: elementProps,
  });

  return <TabsRootContext.Provider value={contextValue}>{element}</TabsRootContext.Provider>;
}

/**
 * The web version compares the tabs' document positions. Here the index already
 * *is* the visual order — `CompositeList` derives it from measured layout — so
 * comparing indexes is both simpler and correct under `row-reverse`, wrapping,
 * and absolute positioning.
 */
function computeActivationDirection(
  oldValue: TabsTab.Value,
  newValue: TabsTab.Value,
  orientation: Orientation,
  tabMap: TabMap,
): TabsTab.ActivationDirection {
  if (oldValue == null || newValue == null) {
    return 'none';
  }

  let oldIndex: number | undefined;
  let newIndex: number | undefined;

  for (const metadata of tabMap.values()) {
    if (metadata == null) {
      continue;
    }
    if (metadata.value === oldValue) {
      oldIndex = metadata.index ?? undefined;
    }
    if (metadata.value === newValue) {
      newIndex = metadata.index ?? undefined;
    }
  }

  if (oldIndex == null || newIndex == null || oldIndex === newIndex) {
    return 'none';
  }

  const [backward, forward] =
    orientation === 'horizontal' ? (['left', 'right'] as const) : (['up', 'down'] as const);

  return newIndex < oldIndex ? backward : forward;
}

export type TabsRootOrientation = Orientation;

export interface TabsRootState {
  /**
   * The component orientation (layout flow direction).
   */
  orientation: TabsRoot.Orientation;
  /**
   * The direction of the active tab relative to the previously active one.
   */
  tabActivationDirection: TabsTab.ActivationDirection;
}

export interface TabsRootProps extends Omit<ZestUIComponentProps<typeof View, TabsRootState>, 'value'> {
  /**
   * The value of the currently selected Tab. Use when the component is controlled.
   * When the value is `null`, no Tab will be selected.
   */
  value?: TabsTab.Value | undefined;
  /**
   * The default value. Use when the component is not controlled.
   * When the value is `null`, no Tab will be selected.
   * @default 0
   */
  defaultValue?: TabsTab.Value | undefined;
  /**
   * The component orientation (layout flow direction).
   * @default 'horizontal'
   */
  orientation?: TabsRoot.Orientation | undefined;
  /**
   * Callback invoked when a new value is being set.
   *
   * The event `reason` is `'none'` for user-initiated changes, such as a press;
   * `'initial'` for the first automatic selection or fallback in uncontrolled
   * roots when `defaultValue` is omitted or `undefined`, including when the
   * implicit initial value is disabled or missing; `'disabled'` for automatic
   * fallback when the selected tab becomes disabled in uncontrolled roots; or
   * `'missing'` for automatic fallback when the selected tab is removed, or when
   * an explicit `defaultValue` never matches a mounted tab in uncontrolled roots.
   *
   * For automatic changes, the selected value can be `null` when no enabled Tab
   * is available as a fallback.
   *
   * Automatic changes cannot be canceled; calling `eventDetails.cancel()` for
   * `'initial'`, `'disabled'`, or `'missing'` has no effect.
   */
  onValueChange?:
    | ((value: TabsTab.Value, eventDetails: TabsRoot.ChangeEventDetails) => void)
    | undefined;
}

export type TabsRootChangeEventReason =
  | typeof REASONS.none
  | typeof REASONS.disabled
  | typeof REASONS.missing
  | typeof REASONS.initial;

export type TabsRootChangeEventDetails = ZestChangeEventDetails<
  TabsRootChangeEventReason,
  { activationDirection: TabsTab.ActivationDirection }
>;

export namespace TabsRoot {
  export type State = TabsRootState;
  export type Props = TabsRootProps;
  export type Orientation = TabsRootOrientation;
  export type ChangeEventReason = TabsRootChangeEventReason;
  export type ChangeEventDetails = TabsRootChangeEventDetails;
}
