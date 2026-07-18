'use client';
import * as React from 'react';
import { Pressable, type GestureResponderEvent } from 'react-native';
import { MenuRootContext } from '../root/MenuRootContext';
import { useRenderElement } from '../../use-render/useRenderElement';
import { useButton } from '../../internals/use-button/useButton';
import { useId } from '../../hooks/useId';
import { useIsoLayoutEffect } from '../../hooks/useIsoLayoutEffect';
import { useMergedRefs } from '../../hooks/useMergedRefs';
import { usePopupHandleStore } from '../../utils/popups/usePopupHandleStore';
import type { MenuHandle } from '../store/MenuHandle';
import type { MenuStore } from '../store/MenuStore';
import type { ZestUIComponentProps } from '../../types';
import { createChangeEventDetails } from '../../utils/createChangeEventDetails';
import { REASONS } from '../../utils/reasons';

/**
 * A button that opens the menu, and the element it is positioned against.
 * Renders a `<Pressable>`.
 */
export function MenuTrigger<Payload = unknown>(componentProps: MenuTrigger.Props<Payload>) {
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

  const rootStore = React.useContext(MenuRootContext);
  const handleStore = usePopupHandleStore(handle);

  // A trigger inside a root uses that root; a detached one follows its handle,
  // which resolves to the attached root's store or to an inert fallback.
  const store = (handleStore ?? rootStore) as MenuStore | undefined;

  if (store === undefined) {
    throw new Error(
      'Zest: Menu.Trigger must be placed within <Menu.Root>, or given a `handle` it shares with one.',
    );
  }

  const id = useId(idProp ?? undefined);
  const open = store.useState('open');

  const [pressed, setPressed] = React.useState(false);

  const { getButtonProps } = useButton({ disabled });

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

  const state: MenuTriggerState = { disabled, open, pressed };

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
          store.state.update?.();
        },
        accessibilityState: { expanded: open, disabled: disabled || undefined },
        'aria-haspopup': 'menu' as const,
      },
      elementProps,
      getButtonProps,
    ],
  });
}

export interface MenuTriggerState {
  disabled: boolean;
  open: boolean;
  pressed: boolean;
}

export interface MenuTriggerProps<Payload = unknown>
  extends ZestUIComponentProps<typeof Pressable, MenuTriggerState> {
  /**
   * A handle shared with a `Menu.Root`, which is what lets this trigger live
   * outside of it. Create one with `Menu.createHandle()`.
   *
   * The trigger's `nativeID` is the id a handle's `open(triggerId)` resolves.
   */
  handle?: MenuHandle<Payload> | undefined;
  /**
   * A payload handed to the root's children when they are a function.
   */
  payload?: Payload | undefined;
  /**
   * Whether the component should ignore user interaction.
   * @default false
   */
  disabled?: boolean | undefined;
}

export namespace MenuTrigger {
  export type State = MenuTriggerState;
  export type Props<Payload = unknown> = MenuTriggerProps<Payload>;
}
