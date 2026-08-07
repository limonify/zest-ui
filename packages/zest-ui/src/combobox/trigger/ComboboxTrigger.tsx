'use client';
import * as React from 'react';
import { Pressable, type GestureResponderEvent, type LayoutChangeEvent } from 'react-native';
import { ComboboxRootContext } from '../root/ComboboxRootContext';
import { useRenderElement } from '../../use-render/useRenderElement';
import { useButton } from '../../internals/use-button/useButton';
import { useFieldControlRegistration } from '../../internals/field/useFieldControlRegistration';
import { useId } from '../../hooks/useId';
import { useIsoLayoutEffect } from '../../hooks/useIsoLayoutEffect';
import { useMergedRefs } from '../../hooks/useMergedRefs';
import { usePopupHandleStore } from '../../utils/popups/usePopupHandleStore';
import type { ComboboxHandle } from '../store/ComboboxHandle';
import type { ComboboxStore } from '../store/ComboboxStore';
import type { ZestUIComponentProps } from '../../types';
import { createChangeEventDetails } from '../../utils/createChangeEventDetails';
import { REASONS } from '../../utils/reasons';
import { useStoreState } from '../../store/ReactStore';

/**
 * A button that opens the list, and the element it is positioned against.
 * Renders a `<Pressable>`.
 *
 * Use it instead of `Combobox.Input` when the closed state should read as a
 * button rather than a text field — the input then lives *inside* the popup and
 * filters from there, which is the usual shape on a phone:
 *
 * ```tsx
 * <Combobox.Root items={COUNTRIES}>
 *   <Combobox.Trigger>
 *     <Combobox.Value />
 *   </Combobox.Trigger>
 *   <Combobox.Portal>
 *     <Combobox.Positioner>
 *       <Combobox.Popup>
 *         <Combobox.Input placeholder="Search" />
 *         <Combobox.List>…</Combobox.List>
 *       </Combobox.Popup>
 *     </Combobox.Positioner>
 *   </Combobox.Portal>
 * </Combobox.Root>
 * ```
 *
 * The popup anchors to whichever of the two was pressed last, so a combobox
 * normally has one or the other. Pass a `handle` to render a trigger outside of
 * its `Combobox.Root`.
 */
export function ComboboxTrigger<Payload = unknown>(componentProps: ComboboxTrigger.Props<Payload>) {
  const {
    render,
    className,
    style,
    disabled: disabledProp = false,
    handle,
    nativeID: idProp,
    payload,
    ref,
    ...elementProps
  } = componentProps;

  const rootStore = React.useContext(ComboboxRootContext);
  const handleStore = usePopupHandleStore(handle);

  // A trigger inside a root uses that root; a detached one follows its handle,
  // which resolves to the attached root's store or to an inert fallback.
  const store = (handleStore ?? rootStore) as ComboboxStore | undefined;

  if (store === undefined) {
    throw new Error(
      'Zest: Combobox.Trigger must be placed within <Combobox.Root> or <Autocomplete.Root>, or given a `handle` it shares with one.',
    );
  }

  const id = useId(idProp ?? undefined);

  // The root owns the value and registers it with the field; this call only
  // collects the accessibility props.
  const { fieldProps } = useFieldControlRegistration();

  const open = useStoreState(store, 'open');
  const rootDisabled = useStoreState(store, 'disabled');
  const update = useStoreState(store, 'update');

  const disabled = disabledProp || rootDisabled;

  const [pressed, setPressed] = React.useState(false);

  const { getButtonProps } = useButton({ disabled });

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

  const state: ComboboxTriggerState = { disabled, open, pressed };

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
        onLayout(event: LayoutChangeEvent) {
          const { width, height } = event.nativeEvent.layout;
          store.set('triggerWidth', width);
          store.set('triggerHeight', height);
          update?.();
        },
        accessibilityRole: 'button' as const,
        role: 'combobox' as const,
        accessibilityState: { expanded: open, disabled: disabled || undefined },
        'aria-expanded': open,
        'aria-haspopup': 'listbox' as const,
        ...fieldProps,
      },
      elementProps,
      getButtonProps,
    ],
  });
}

export interface ComboboxTriggerState {
  /**
   * Whether the component should ignore user interaction.
   */
  disabled: boolean;
  /**
   * Whether the list is currently open.
   */
  open: boolean;
  /**
   * Whether the trigger is currently pressed.
   */
  pressed: boolean;
}

export interface ComboboxTriggerProps<Payload = unknown>
  extends ZestUIComponentProps<typeof Pressable, ComboboxTriggerState> {
  /**
   * Whether the component should ignore user interaction. A disabled root
   * disables its triggers too.
   * @default false
   */
  disabled?: boolean | undefined;
  /**
   * A handle shared with a `Combobox.Root`, which is what lets this trigger live
   * outside of it. Create one with `Combobox.createHandle()`.
   *
   * The trigger's `nativeID` is the id a handle's `open(triggerId)` resolves.
   */
  handle?: ComboboxHandle | undefined;
  /**
   * A payload handed to the root's children when they are a function.
   */
  payload?: Payload | undefined;
}

export namespace ComboboxTrigger {
  export type State = ComboboxTriggerState;
  export type Props<Payload = unknown> = ComboboxTriggerProps<Payload>;
}
