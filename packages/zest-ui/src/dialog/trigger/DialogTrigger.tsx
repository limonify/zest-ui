'use client';
import * as React from 'react';
import { Pressable, type GestureResponderEvent } from 'react-native';
import { DialogRootContext } from '../root/DialogRootContext';
import { useRenderElement } from '../../use-render/useRenderElement';
import { useButton } from '../../internals/use-button/useButton';
import { useId } from '../../hooks/useId';
import { useIsoLayoutEffect } from '../../hooks/useIsoLayoutEffect';
import { useMergedRefs } from '../../hooks/useMergedRefs';
import { usePopupHandleStore } from '../../utils/popups/usePopupHandleStore';
import type { DialogHandle } from '../store/DialogHandle';
import type { DialogStore } from '../store/DialogStore';
import type { ZestUIComponentProps } from '../../types';
import { createChangeEventDetails } from '../../utils/createChangeEventDetails';
import { REASONS } from '../../utils/reasons';

/**
 * A button that opens the dialog.
 * Renders a `<Pressable>`.
 *
 * Pass a `handle` to render a trigger outside of its `Dialog.Root`: there is no
 * context reaching across, so the handle is what connects the two.
 */
export function DialogTrigger<Payload = unknown>(componentProps: DialogTrigger.Props<Payload>) {
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

  const rootStore = React.useContext(DialogRootContext);
  const handleStore = usePopupHandleStore(handle);

  // A trigger inside a root uses that root; a detached one follows its handle,
  // which resolves to the attached root's store or to an inert fallback.
  const store = (handleStore ?? rootStore) as DialogStore<any> | undefined;

  if (store === undefined) {
    throw new Error(
      'Zest: Dialog.Trigger must be placed within <Dialog.Root>, or given a `handle` it shares with one.',
    );
  }

  const id = useId(idProp ?? undefined);
  const open = store.useState('open');

  const [pressed, setPressed] = React.useState(false);

  const { getButtonProps } = useButton({ disabled });

  const triggerRef = React.useRef<unknown>(null);
  const registerRef = React.useCallback((node: unknown) => {
    triggerRef.current = node;
  }, []);
  const mergedRef = useMergedRefs(ref, registerRef);

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

  const state: DialogTriggerState = { disabled, open, pressed };

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

          store.setOpen(true, createChangeEventDetails(REASONS.triggerPress, event));
        },
        onPressIn() {
          setPressed(true);
        },
        onPressOut() {
          setPressed(false);
        },
        accessibilityState: { expanded: open, disabled: disabled || undefined },
        'aria-haspopup': 'dialog' as const,
      },
      elementProps,
      getButtonProps,
    ],
  });
}

export interface DialogTriggerState {
  /**
   * Whether the component should ignore user interaction.
   */
  disabled: boolean;
  /**
   * Whether the dialog is currently open.
   */
  open: boolean;
  /**
   * Whether the trigger is currently pressed.
   */
  pressed: boolean;
}

export interface DialogTriggerProps<Payload = unknown>
  extends ZestUIComponentProps<typeof Pressable, DialogTriggerState> {
  /**
   * Whether the component should ignore user interaction.
   * @default false
   */
  disabled?: boolean | undefined;
  /**
   * A handle shared with a `Dialog.Root`, which is what lets this trigger live
   * outside of it. Create one with `Dialog.createHandle()`.
   *
   * The trigger's `nativeID` is the id a handle's `open(triggerId)` resolves.
   */
  handle?: DialogHandle<Payload> | undefined;
  /**
   * A payload handed to the root's children when they are a function.
   */
  payload?: Payload | undefined;
}

export namespace DialogTrigger {
  export type State = DialogTriggerState;
  export type Props<Payload = unknown> = DialogTriggerProps<Payload>;
}
