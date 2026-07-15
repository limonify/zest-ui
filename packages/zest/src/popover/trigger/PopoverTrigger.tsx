'use client';
import * as React from 'react';
import { Pressable, type GestureResponderEvent } from 'react-native';
import { PopoverRootContext } from '../root/PopoverRootContext';
import { useRenderElement } from '../../use-render/useRenderElement';
import { useButton } from '../../internals/use-button/useButton';
import { useId } from '../../hooks/useId';
import { useIsoLayoutEffect } from '../../hooks/useIsoLayoutEffect';
import { useMergedRefs } from '../../hooks/useMergedRefs';
import { usePopupHandleStore } from '../../utils/popups/usePopupHandleStore';
import type { PopoverHandle } from '../store/PopoverHandle';
import type { PopoverStore } from '../store/PopoverStore';
import type { BaseUIComponentProps } from '../../types';
import { createChangeEventDetails } from '../../utils/createChangeEventDetails';
import { REASONS } from '../../utils/reasons';

/**
 * A button that opens the popover, and the element it is positioned against.
 * Renders a `<Pressable>`.
 */
export function PopoverTrigger<Payload = unknown>(componentProps: PopoverTrigger.Props<Payload>) {
  const {
    render,
    className,
    style,
    disabled = false,
    handle,
    nativeID: idProp,
    payload,
    ref,
    ...elementProps
  } = componentProps;

  const rootStore = React.useContext(PopoverRootContext);
  const handleStore = usePopupHandleStore(handle);

  // A trigger inside a root uses that root; a detached one follows its handle,
  // which resolves to the attached root's store or to an inert fallback.
  const store = (handleStore ?? rootStore) as PopoverStore | undefined;

  if (store === undefined) {
    throw new Error(
      'Zest: Popover.Trigger must be placed within <Popover.Root>, or given a `handle` it shares with one.',
    );
  }

  const id = useId(idProp ?? undefined);
  const open = store.useState('open');

  const [pressed, setPressed] = React.useState(false);

  const { getButtonProps } = useButton({ disabled });

  // The popup lives in a portal, so the store is what carries the anchor across.
  const anchorRef = React.useCallback(
    (node: unknown) => {
      store.set('triggerNode', node);
    },
    [store],
  );
  const mergedRef = useMergedRefs(ref, anchorRef);

  // Registering into whichever store is current is what lets a handle resolve
  // `open(id)`. The effect re-runs when the handle swaps stores, migrating the
  // registration to the root that just attached.
  useIsoLayoutEffect(() => {
    if (id === undefined) {
      return undefined;
    }

    store.context.triggerNodes.add(id, store.state.triggerNode);

    return () => {
      store.context.triggerNodes.delete(id);
    };
  }, [store, id]);

  const state: PopoverTriggerState = { disabled, open, pressed };

  return useRenderElement(Pressable, componentProps, {
    state,
    ref: mergedRef,
    props: [
      {
        nativeID: id,
        onPress(event: GestureResponderEvent) {
          if (payload !== undefined) {
            store.set('payload', payload);
          }
          if (id !== undefined) {
            store.set('triggerId', id);
          }

          store.setOpen(!open, createChangeEventDetails(REASONS.triggerPress, event));
        },
        onPressIn() {
          setPressed(true);
        },
        onPressOut() {
          setPressed(false);
        },
        onLayout() {
          // Nothing tracks the anchor globally in React Native, so a moved or
          // resized trigger has to ask the positioner to recompute.
          store.state.update?.();
        },
        accessibilityState: { expanded: open, disabled: disabled || undefined },
        'aria-haspopup': 'dialog' as const,
      },
      elementProps,
      getButtonProps,
    ],
  });
}

export interface PopoverTriggerState {
  /**
   * Whether the component should ignore user interaction.
   */
  disabled: boolean;
  /**
   * Whether the popover is currently open.
   */
  open: boolean;
  /**
   * Whether the trigger is currently pressed.
   */
  pressed: boolean;
}

export interface PopoverTriggerProps<Payload = unknown>
  extends BaseUIComponentProps<typeof Pressable, PopoverTriggerState> {
  /**
   * Whether the component should ignore user interaction.
   * @default false
   */
  disabled?: boolean | undefined;
  /**
   * A handle shared with a `Popover.Root`, which is what lets this trigger live
   * outside of it. Create one with `Popover.createHandle()`.
   *
   * The trigger's `nativeID` is the id a handle's `open(triggerId)` resolves.
   */
  handle?: PopoverHandle<Payload> | undefined;
  /**
   * A payload handed to the root's children when they are a function.
   */
  payload?: Payload | undefined;
}

export namespace PopoverTrigger {
  export type State = PopoverTriggerState;
  export type Props<Payload = unknown> = PopoverTriggerProps<Payload>;
}
