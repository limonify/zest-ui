'use client';
import * as React from 'react';
import { useRefWithInit } from '../../hooks/useRefWithInit';
import { useStableCallback } from '../../hooks/useStableCallback';
import { useTransitionStatus } from '../../internals/useTransitionStatus';
import { usePopupRootHandle } from '../../utils/popups/usePopupRootHandle';
import { useFieldControlRegistration } from '../../internals/field/useFieldControlRegistration';
import type { ZestChangeEventDetails } from '../../utils/createChangeEventDetails';
import type { REASONS } from '../../utils/reasons';
import type { SelectHandle } from '../store/SelectHandle';
import { SelectStore, type SelectItems } from '../store/SelectStore';
import { SelectRootContext } from './SelectRootContext';
import { SelectTransitionContext } from './SelectTransitionContext';

/**
 * Groups all parts of the select.
 * Doesn't render its own element.
 *
 * Unlike the web version there is no hidden `<select>`: React Native has no form
 * submission, so `name`/`form` are omitted. Multi-select is not ported yet.
 */
export function SelectRoot<Value = any, Payload = unknown>(
  props: SelectRoot.Props<Value, Payload>,
) {
  const {
    actionsRef,
    children,
    defaultOpen = false,
    defaultTriggerId = null,
    defaultValue,
    disablePointerDismissal = false,
    disabled: disabledProp = false,
    handle,
    items,
    multiple = false,
    onOpenChange,
    onValueChange,
    open,
    readOnly = false,
    required = false,
    triggerId,
    value,
  } = props;

  const { fieldDisabled, markChanged, markTouched } = useFieldControlRegistration({
    initialValue: defaultValue ?? value ?? (multiple ? [] : undefined),
  });

  const disabled = disabledProp || fieldDisabled;

  const store = useRefWithInit(
    () =>
      new SelectStore({
        open: defaultOpen,
        openProp: open,
        // A multiple select's selection is a list, so an omitted default is an
        // empty one rather than "nothing selected".
        value: defaultValue ?? (multiple ? [] : undefined),
        valueProp: value,
        items,
        multiple,
        disabled,
        readOnly,
        required,
        disablePointerDismissal,
        triggerId: defaultTriggerId,
        triggerIdProp: triggerId,
      }),
  ).current;

  // Wrapping the consumer's callbacks is what lets a select report itself to a
  // surrounding `Field.Root`: choosing a value makes the field dirty, and
  // closing the popup is the select's equivalent of a blur.
  const handleValueChange = useStableCallback(
    (nextValue: Value, eventDetails: SelectRoot.ChangeEventDetails) => {
      onValueChange?.(nextValue, eventDetails);

      if (eventDetails.isCanceled) {
        return;
      }

      markChanged(nextValue);
    },
  );

  const handleOpenChange = useStableCallback(
    (nextOpen: boolean, eventDetails: SelectRoot.ChangeEventDetails) => {
      onOpenChange?.(nextOpen, eventDetails);

      if (eventDetails.isCanceled || nextOpen) {
        return;
      }

      markTouched(store.select('value'));
    },
  );

  store.useControlledProp('openProp', open);
  store.useControlledProp('valueProp', value);
  store.useControlledProp('triggerIdProp', triggerId);
  store.useContextCallback('onOpenChange', handleOpenChange);
  store.useContextCallback('onValueChange', handleValueChange);
  store.useSyncedValues({
    disabled,
    readOnly,
    required,
    items,
    multiple,
    disablePointerDismissal,
  });

  usePopupRootHandle({ store, handle, actionsRef });

  const resolvedOpen = store.useState('open');
  const { transitionStatus } = useTransitionStatus(resolvedOpen, false, true);

  const payload = store.useState('payload') as Payload;

  const transitionContextValue = React.useMemo(
    () => ({ transitionStatus }),
    [transitionStatus],
  );

  return (
    <SelectRootContext.Provider value={store}>
      <SelectTransitionContext.Provider value={transitionContextValue}>
        {typeof children === 'function' ? children(payload) : children}
      </SelectTransitionContext.Provider>
    </SelectRootContext.Provider>
  );
}

export interface SelectRootState {}

export interface SelectRootActions {
  /**
   * Unmounts the popup without firing `onOpenChange`. Call it after an
   * externally controlled closing animation finishes.
   */
  unmount: () => void;
  /**
   * Closes the popup, reporting the `imperative-action` reason.
   */
  close: () => void;
}

export interface SelectRootProps<Value = any, Payload = unknown> {
  /**
   * The value of the currently selected item.
   *
   * To render an uncontrolled select, use the `defaultValue` prop instead.
   */
  value?: Value | undefined;
  /**
   * The value of the initially selected item.
   *
   * To render a controlled select, use the `value` prop instead.
   */
  defaultValue?: Value | undefined;
  /**
   * Event handler called when the selected value changes.
   */
  onValueChange?:
    | ((value: Value, eventDetails: SelectRoot.ChangeEventDetails) => void)
    | undefined;
  /**
   * Whether the select popup is currently open.
   */
  open?: boolean | undefined;
  /**
   * Whether the select popup is initially open.
   * @default false
   */
  defaultOpen?: boolean | undefined;
  /**
   * Event handler called when the popup is opened or closed.
   */
  onOpenChange?:
    | ((open: boolean, eventDetails: SelectRoot.ChangeEventDetails) => void)
    | undefined;
  /**
   * Whether more than one item can be selected.
   *
   * The value becomes an array, pressing an item toggles it rather than
   * replacing the selection, and the popup stays open until it is dismissed.
   * @default false
   */
  multiple?: boolean | undefined;
  /**
   * Whether the component should ignore user interaction.
   * @default false
   */
  disabled?: boolean | undefined;
  /**
   * Whether the user should be unable to choose a different item.
   * @default false
   */
  readOnly?: boolean | undefined;
  /**
   * Whether the user must choose a value.
   * @default false
   */
  required?: boolean | undefined;
  /**
   * Value-to-label data for the items in the popup.
   *
   * `Select.ItemText` registers each item's label as it mounts, but the items
   * live in the portal and so do not exist until the popup is first opened.
   * Pass `items` for `Select.Value` to render the selected label before then.
   *
   * @example
   * ```tsx
   * <Select.Root items={{ sans: 'Sans-serif', serif: 'Serif' }} />
   * // or, for non-string values:
   * <Select.Root items={[{ value: 1, label: 'One' }]} />
   * ```
   */
  items?: SelectItems | undefined;
  /**
   * Whether to prevent the popup from closing on presses outside it.
   * @default false
   */
  disablePointerDismissal?: boolean | undefined;
  /**
   * A ref to imperative actions.
   */
  actionsRef?: React.RefObject<SelectRoot.Actions | null> | undefined;
  /**
   * A handle associating this select with triggers rendered outside it, and
   * letting it be opened and closed imperatively. Create one with
   * `Select.createHandle()`.
   */
  handle?: SelectHandle<Payload> | undefined;
  /**
   * The id of the trigger the popup is anchored to. Useful together with the
   * `open` prop, to control which trigger a controlled select belongs to.
   */
  triggerId?: string | null | undefined;
  /**
   * The id of the trigger the popup is initially anchored to. Useful together
   * with `defaultOpen`.
   */
  defaultTriggerId?: string | null | undefined;
  /**
   * The content of the select.
   *
   * Pass a function to receive the payload the select was opened with, via a
   * trigger's `payload` prop.
   */
  children?: React.ReactNode | ((payload: Payload) => React.ReactNode);
}

export type SelectRootChangeEventReason =
  | typeof REASONS.triggerPress
  | typeof REASONS.outsidePress
  | typeof REASONS.escapeKey
  | typeof REASONS.itemPress
  | typeof REASONS.imperativeAction
  | typeof REASONS.none;

export type SelectRootChangeEventDetails = ZestChangeEventDetails<SelectRootChangeEventReason>;

export namespace SelectRoot {
  export type State = SelectRootState;
  export type Props<TValue = any, TPayload = unknown> = SelectRootProps<TValue, TPayload>;
  export type Actions = SelectRootActions;
  export type ChangeEventReason = SelectRootChangeEventReason;
  export type ChangeEventDetails = SelectRootChangeEventDetails;
}
