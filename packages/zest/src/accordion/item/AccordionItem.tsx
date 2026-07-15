'use client';
import * as React from 'react';
import { View } from 'react-native';
import { useId } from '../../hooks/useId';
import { useStableCallback } from '../../hooks/useStableCallback';
import { useRenderElement } from '../../use-render/useRenderElement';
import { useCollapsibleRoot } from '../../collapsible/root/useCollapsibleRoot';
import type { CollapsibleRoot, CollapsibleRootState } from '../../collapsible/root/CollapsibleRoot';
import { CollapsibleRootContext } from '../../collapsible/root/CollapsibleRootContext';
import type { AccordionRootState } from '../root/AccordionRoot';
import { useAccordionRootContext } from '../root/AccordionRootContext';
import type { BaseUIComponentProps } from '../../types';
import type { ZestChangeEventDetails } from '../../utils/createChangeEventDetails';
import type { REASONS } from '../../utils/reasons';
import { AccordionItemContext } from './AccordionItemContext';

/**
 * Groups an accordion header with the corresponding panel.
 * Renders a `<View>`.
 *
 * Each item owns a Collapsible root context, so `Accordion.Trigger` and
 * `Accordion.Panel` are the Collapsible parts wearing accordion semantics.
 */
export function AccordionItem<Value = any>(componentProps: AccordionItem.Props<Value>) {
  const {
    className,
    disabled: disabledProp = false,
    onOpenChange: onOpenChangeProp,
    render,
    style,
    value: valueProp,
    ref,
    ...elementProps
  } = componentProps;

  const {
    disabled: contextDisabled,
    handleValueChange,
    state: rootState,
    value: openValues,
  } = useAccordionRootContext<Value>();

  const fallbackValue = useId();
  const value = (valueProp ?? fallbackValue) as Value;

  const disabled = disabledProp || contextDisabled;

  const isOpen = React.useMemo(() => {
    if (!openValues) {
      return false;
    }

    for (let i = 0; i < openValues.length; i += 1) {
      if (openValues[i] === value) {
        return true;
      }
    }

    return false;
  }, [openValues, value]);

  const onOpenChange = useStableCallback(
    (nextOpen: boolean, eventDetails: CollapsibleRoot.ChangeEventDetails) => {
      onOpenChangeProp?.(nextOpen, eventDetails);

      if (eventDetails.isCanceled) {
        return;
      }

      handleValueChange(value, nextOpen, eventDetails);
    },
  );

  const collapsible = useCollapsibleRoot({ open: isOpen, onOpenChange, disabled });

  const collapsibleState: CollapsibleRootState = React.useMemo(
    () => ({
      open: collapsible.open,
      disabled: collapsible.disabled,
      transitionStatus: collapsible.transitionStatus,
    }),
    [collapsible.open, collapsible.disabled, collapsible.transitionStatus],
  );

  const collapsibleContext: CollapsibleRootContext = React.useMemo(
    () => ({ ...collapsible, onOpenChange, state: collapsibleState }),
    [collapsible, collapsibleState, onOpenChange],
  );

  const state: AccordionItemState<Value> = React.useMemo(
    () => ({
      ...rootState,
      hidden: !isOpen && !collapsible.mounted,
      disabled,
      open: isOpen,
    }),
    [collapsible.mounted, disabled, isOpen, rootState],
  );

  const triggerId = useId();

  const accordionItemContext: AccordionItemContext = React.useMemo(
    () => ({ open: isOpen, state, triggerId }),
    [isOpen, state, triggerId],
  );

  const element = useRenderElement(View, componentProps, {
    state,
    ref,
    props: elementProps,
  });

  return (
    <CollapsibleRootContext.Provider value={collapsibleContext}>
      <AccordionItemContext.Provider value={accordionItemContext}>
        {element}
      </AccordionItemContext.Provider>
    </CollapsibleRootContext.Provider>
  );
}

export interface AccordionItemState<Value = any> extends AccordionRootState<Value> {
  /**
   * Whether the accordion item's panel is currently hidden.
   */
  hidden: boolean;
  /**
   * Whether the component is open.
   */
  open: boolean;
}

export interface AccordionItemProps<Value = any>
  extends Omit<BaseUIComponentProps<typeof View, AccordionItemState<Value>>, 'value'> {
  /**
   * A unique value that identifies this accordion item.
   * If no value is provided, a unique ID will be generated automatically.
   */
  value?: Value | undefined;
  /**
   * Whether the component should ignore user interaction.
   * @default false
   */
  disabled?: boolean | undefined;
  /**
   * Event handler called when the panel is opened or closed.
   */
  onOpenChange?:
    | ((open: boolean, eventDetails: AccordionItem.ChangeEventDetails) => void)
    | undefined;
}

export type AccordionItemChangeEventReason = typeof REASONS.triggerPress | typeof REASONS.none;

export type AccordionItemChangeEventDetails =
  ZestChangeEventDetails<AccordionItemChangeEventReason>;

export namespace AccordionItem {
  export type State<TValue = any> = AccordionItemState<TValue>;
  export type Props<TValue = any> = AccordionItemProps<TValue>;
  export type ChangeEventReason = AccordionItemChangeEventReason;
  export type ChangeEventDetails = AccordionItemChangeEventDetails;
}
