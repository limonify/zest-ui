'use client';
import * as React from 'react';
import { Pressable, type GestureResponderEvent, type LayoutChangeEvent } from 'react-native';
import { TooltipRootContext } from '../root/TooltipRootContext';
import { useRenderElement } from '../../use-render/useRenderElement';
import { useId } from '../../hooks/useId';
import { useIsoLayoutEffect } from '../../hooks/useIsoLayoutEffect';
import { useMergedRefs } from '../../hooks/useMergedRefs';
import { usePopupHandleStore } from '../../utils/popups/usePopupHandleStore';
import type { TooltipHandle } from '../store/TooltipHandle';
import type { TooltipStore } from '../store/TooltipStore';
import type { ZestUIComponentProps } from '../../types';
import { createChangeEventDetails } from '../../utils/createChangeEventDetails';
import { REASONS } from '../../utils/reasons';
import { useStoreState } from '../../store/ReactStore';

/**
 * The element the tooltip describes, and the element it is positioned against.
 * Renders a `<Pressable>`.
 *
 * Pass a `handle` to render the trigger outside of its `Tooltip.Root`: there is
 * no context reaching across, so the handle is what connects the two.
 */
export function TooltipTrigger<Payload = unknown>(componentProps: TooltipTrigger.Props<Payload>) {
  const {
    render,
    className,
    style,
    disabled: disabledProp = false,
    handle,
    longPress = false,
    nativeID: idProp,
    payload,
    ref,
    ...elementProps
  } = componentProps;

  const rootStore = React.useContext(TooltipRootContext);
  const handleStore = usePopupHandleStore(handle);

  // A trigger inside a root uses that root; a detached one follows its handle,
  // which resolves to the attached root's store or to an inert fallback.
  const store = (handleStore ?? rootStore) as TooltipStore | undefined;

  if (store === undefined) {
    throw new Error(
      'Zest: Tooltip.Trigger must be placed within <Tooltip.Root>, or given a `handle` it shares with one.',
    );
  }

  const id = useId(idProp ?? undefined);

  const open = useStoreState(store, 'open');
  const rootDisabled = useStoreState(store, 'disabled');

  const disabled = disabledProp || rootDisabled;

  const [pressed, setPressed] = React.useState(false);

  const triggerRef = React.useRef<unknown>(null);
  const anchorRef = React.useCallback(
    (node: unknown) => {
      triggerRef.current = node;
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

    store.context.triggerNodes.add(id, triggerRef.current);

    return () => {
      store.context.triggerNodes.delete(id);
    };
  }, [store, id]);

  const toggle = (event: GestureResponderEvent) => {
    if (disabled) {
      return;
    }

    if (payload !== undefined) {
      store.set('payload', payload);
    }
    if (id !== undefined) {
      store.set('triggerId', id);
    }

    store.setOpen(!open, createChangeEventDetails(REASONS.triggerPress, event));
  };

  const state: TooltipTriggerState = { disabled, open, pressed };

  return useRenderElement(Pressable, componentProps, {
    state,
    ref: mergedRef,
    props: [
      {
        nativeID: id,
        // A tooltip that opens on long press leaves the plain press free for the
        // trigger's own action.
        onPress: longPress ? undefined : toggle,
        onLongPress: longPress ? toggle : undefined,
        onPressIn() {
          setPressed(true);
        },
        onPressOut() {
          setPressed(false);
        },
        onLayout(event: LayoutChangeEvent) {
          const { width, height } = event.nativeEvent.layout;
          store.set('triggerWidth', width);
          store.set('triggerHeight', height);
          store.state.update?.();
        },
        accessibilityState: { expanded: open, disabled: disabled || undefined },
      },
      elementProps,
    ],
  });
}

export interface TooltipTriggerState {
  /**
   * Whether the component should ignore user interaction.
   */
  disabled: boolean;
  /**
   * Whether the tooltip is currently open.
   */
  open: boolean;
  /**
   * Whether the trigger is currently pressed.
   */
  pressed: boolean;
}

export interface TooltipTriggerProps<Payload = unknown>
  extends ZestUIComponentProps<typeof Pressable, TooltipTriggerState> {
  /**
   * Whether the component should ignore user interaction. A disabled
   * `Tooltip.Root` disables its triggers too.
   * @default false
   */
  disabled?: boolean | undefined;
  /**
   * Whether to open the tooltip on a long press instead of a press, leaving the
   * plain press free for the trigger's own action.
   * @default false
   */
  longPress?: boolean | undefined;
  /**
   * A handle shared with a `Tooltip.Root`, which is what lets this trigger live
   * outside of it. Create one with `Tooltip.createHandle()`.
   *
   * The trigger's `nativeID` is the id a handle's `open(triggerId)` resolves.
   */
  handle?: TooltipHandle<Payload> | undefined;
  /**
   * A payload handed to the root's children when they are a function.
   */
  payload?: Payload | undefined;
}

export namespace TooltipTrigger {
  export type State = TooltipTriggerState;
  export type Props<Payload = unknown> = TooltipTriggerProps<Payload>;
}
