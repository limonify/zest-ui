'use client';
import * as React from 'react';
import { TextInput, type LayoutChangeEvent } from 'react-native';
import { ComboboxRootContext } from '../root/ComboboxRootContext';
import { useRenderElement } from '../../use-render/useRenderElement';
import { useId } from '../../hooks/useId';
import { useIsoLayoutEffect } from '../../hooks/useIsoLayoutEffect';
import { useMergedRefs } from '../../hooks/useMergedRefs';
import { usePopupHandleStore } from '../../utils/popups/usePopupHandleStore';
import { createChangeEventDetails } from '../../utils/createChangeEventDetails';
import { REASONS } from '../../utils/reasons';
import type { ComboboxHandle } from '../store/ComboboxHandle';
import type { ComboboxStore } from '../store/ComboboxStore';
import type { ZestUIComponentProps } from '../../types';

/**
 * The text input that filters the list, and the element the popup is anchored to.
 * Renders a `<TextInput>`.
 *
 * Pass a `handle` to render the input outside of its `Combobox.Root`: there is
 * no context reaching across, so the handle is what connects the two.
 */
export function ComboboxInput<Payload = unknown>(componentProps: ComboboxInput.Props<Payload>) {
  const {
    render,
    className,
    style,
    handle,
    nativeID: idProp,
    payload,
    ref,
    ...elementProps
  } = componentProps;

  const rootStore = React.useContext(ComboboxRootContext);
  const handleStore = usePopupHandleStore(handle);

  // An input inside a root uses that root; a detached one follows its handle,
  // which resolves to the attached root's store or to an inert fallback.
  const store = (handleStore ?? rootStore) as ComboboxStore | undefined;

  if (store === undefined) {
    throw new Error(
      'Zest: Combobox.Input must be placed within <Combobox.Root> or <Autocomplete.Root>, or given a `handle` it shares with one.',
    );
  }

  const id = useId(idProp ?? undefined);

  const open = store.useState('open');
  const disabled = store.useState('disabled');
  const inputValue = store.useState('inputValue');
  const openOnFocus = store.useState('openOnFocus');
  const update = store.useState('update');

  const internalRef = React.useRef<TextInput>(null);

  useIsoLayoutEffect(() => {
    store.set('inputRef', internalRef);
  }, [store]);

  const triggerRef = React.useRef<unknown>(null);
  const anchorRef = React.useCallback(
    (node: unknown) => {
      triggerRef.current = node;
      store.set('triggerNode', node);
    },
    [store],
  );
  const mergedRef = useMergedRefs(ref, anchorRef, internalRef);

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

  const state: ComboboxInputState = { open, disabled };

  return useRenderElement(TextInput, componentProps, {
    state,
    ref: mergedRef,
    props: [
      {
        nativeID: id,
        value: inputValue,
        editable: !disabled,
        onChangeText(text: string) {
          // One event details object is shared, so canceling the text change
          // also stops the list from opening.
          const eventDetails = createChangeEventDetails(REASONS.inputChange);

          store.setInputValue(text, eventDetails);

          if (eventDetails.isCanceled) {
            return;
          }

          // Typing reopens the list so suggestions follow the query.
          if (!store.select('open') && text.length > 0) {
            store.setOpen(true, eventDetails);
          }
        },
        onFocus() {
          if (payload !== undefined) {
            store.set('payload', payload);
          }
          if (id !== undefined) {
            store.set('triggerId', id);
          }

          if (openOnFocus) {
            store.setOpen(true, createChangeEventDetails(REASONS.triggerFocus));
          }
        },
        onLayout(event: LayoutChangeEvent) {
          const { width, height } = event.nativeEvent.layout;
          store.set('triggerWidth', width);
          store.set('triggerHeight', height);
          update?.();
        },
        accessibilityRole: 'search' as const,
        accessibilityState: { expanded: open, disabled: disabled || undefined },
        'aria-expanded': open,
        'aria-autocomplete': 'list' as const,
      },
      elementProps,
    ],
  });
}

export interface ComboboxInputState {
  /**
   * Whether the list is currently open.
   */
  open: boolean;
  /**
   * Whether the component should ignore user interaction.
   */
  disabled: boolean;
}

export interface ComboboxInputProps<Payload = unknown>
  extends Omit<ZestUIComponentProps<typeof TextInput, ComboboxInputState>, 'value'> {
  /**
   * A handle shared with a `Combobox.Root`, which is what lets this input live
   * outside of it. Create one with `Combobox.createHandle()`.
   *
   * The input's `nativeID` is the id a handle's `open(triggerId)` resolves.
   */
  handle?: ComboboxHandle | undefined;
  /**
   * A payload handed to the root's children when they are a function.
   */
  payload?: Payload | undefined;
}

export namespace ComboboxInput {
  export type State = ComboboxInputState;
  export type Props<Payload = unknown> = ComboboxInputProps<Payload>;
}
