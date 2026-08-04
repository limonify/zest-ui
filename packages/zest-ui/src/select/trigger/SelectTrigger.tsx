'use client';
import * as React from 'react';
import { Pressable, type GestureResponderEvent, type LayoutChangeEvent } from 'react-native';
import { SelectRootContext } from '../root/SelectRootContext';
import { useRenderElement } from '../../use-render/useRenderElement';
import { useButton } from '../../internals/use-button/useButton';
import { useFieldControlRegistration } from '../../internals/field/useFieldControlRegistration';
import { useId } from '../../hooks/useId';
import { useIsoLayoutEffect } from '../../hooks/useIsoLayoutEffect';
import { useMergedRefs } from '../../hooks/useMergedRefs';
import { usePopupHandleStore } from '../../utils/popups/usePopupHandleStore';
import type { SelectHandle } from '../store/SelectHandle';
import type { SelectStore } from '../store/SelectStore';
import type { ZestUIComponentProps } from '../../types';
import { createChangeEventDetails } from '../../utils/createChangeEventDetails';
import { REASONS } from '../../utils/reasons';
import { useStoreState } from '../../store/ReactStore';

/**
 * A button that opens the select popup, and the element it is positioned against.
 * Renders a `<Pressable>`.
 *
 * Pass a `handle` to render a trigger outside of its `Select.Root`: there is no
 * context reaching across, so the handle is what connects the two.
 */
export function SelectTrigger<Payload = unknown>(componentProps: SelectTrigger.Props<Payload>) {
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

  const rootStore = React.useContext(SelectRootContext);
  const handleStore = usePopupHandleStore(handle);

  // A trigger inside a root uses that root; a detached one follows its handle,
  // which resolves to the attached root's store or to an inert fallback.
  const store = (handleStore ?? rootStore) as SelectStore | undefined;

  if (store === undefined) {
    throw new Error(
      'Zest: Select.Trigger must be placed within <Select.Root>, or given a `handle` it shares with one.',
    );
  }

  const id = useId(idProp ?? undefined);

  // The trigger is the element assistive tech announces, so the field's label
  // and messages attach here rather than to the root.
  const { fieldProps } = useFieldControlRegistration();

  const open = useStoreState(store, 'open');
  const rootDisabled = useStoreState(store, 'disabled');
  const readOnly = useStoreState(store, 'readOnly');
  const required = useStoreState(store, 'required');
  const labelId = useStoreState(store, 'labelId');

  const disabled = rootDisabled || disabledProp;

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

  const state: SelectTriggerState = { disabled, open, pressed, readOnly, required };

  return useRenderElement(Pressable, componentProps, {
    state,
    ref: mergedRef,
    props: [
      {
        nativeID: id,
        onPress(event: GestureResponderEvent) {
          if (readOnly) {
            return;
          }

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
          store.state.update?.();
        },
        accessibilityRole: 'combobox' as const,
        accessibilityState: { expanded: open, disabled: disabled || undefined },
        'aria-haspopup': 'listbox' as const,
        'aria-readonly': readOnly || undefined,
        'aria-required': required || undefined,
        ...fieldProps,
        // A surrounding `Field.Label` names the control; `Select.Label` is the
        // fallback for a select that stands on its own.
        accessibilityLabelledBy: fieldProps.accessibilityLabelledBy ?? labelId,
        'aria-labelledby': fieldProps['aria-labelledby'] ?? labelId,
      },
      elementProps,
      getButtonProps,
    ],
  });
}

export interface SelectTriggerState {
  disabled: boolean;
  open: boolean;
  pressed: boolean;
  readOnly: boolean;
  required: boolean;
}

export interface SelectTriggerProps<Payload = unknown>
  extends ZestUIComponentProps<typeof Pressable, SelectTriggerState> {
  /**
   * Whether the component should ignore user interaction.
   * @default false
   */
  disabled?: boolean | undefined;
  /**
   * A handle shared with a `Select.Root`, which is what lets this trigger live
   * outside of it. Create one with `Select.createHandle()`.
   *
   * The trigger's `nativeID` is the id a handle's `open(triggerId)` resolves.
   */
  handle?: SelectHandle<Payload> | undefined;
  /**
   * A payload handed to the root's children when they are a function.
   */
  payload?: Payload | undefined;
}

export namespace SelectTrigger {
  export type State = SelectTriggerState;
  export type Props<TPayload = unknown> = SelectTriggerProps<TPayload>;
}
