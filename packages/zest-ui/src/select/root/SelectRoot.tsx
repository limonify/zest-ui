'use client';
import * as React from 'react';
import { useRefWithInit } from '../../hooks/useRefWithInit';
import { useTransitionStatus } from '../../internals/useTransitionStatus';
import type { ZestChangeEventDetails } from '../../utils/createChangeEventDetails';
import type { REASONS } from '../../utils/reasons';
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
export function SelectRoot<Value = any>(props: SelectRoot.Props<Value>) {
  const {
    children,
    defaultOpen = false,
    defaultValue,
    disabled = false,
    items,
    multiple = false,
    onOpenChange,
    onValueChange,
    open,
    readOnly = false,
    required = false,
    value,
  } = props;

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
      }),
  ).current;

  store.useControlledProp('openProp', open);
  store.useControlledProp('valueProp', value);
  store.useContextCallback('onOpenChange', onOpenChange);
  store.useContextCallback('onValueChange', onValueChange);
  store.useSyncedValues({ disabled, readOnly, required, items, multiple });

  const resolvedOpen = store.useState('open');
  const { transitionStatus } = useTransitionStatus(resolvedOpen, false, true);

  const transitionContextValue = React.useMemo(
    () => ({ transitionStatus }),
    [transitionStatus],
  );

  return (
    <SelectRootContext.Provider value={store}>
      <SelectTransitionContext.Provider value={transitionContextValue}>
        {children}
      </SelectTransitionContext.Provider>
    </SelectRootContext.Provider>
  );
}

export interface SelectRootState {}

export interface SelectRootProps<Value = any> {
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
   * The content of the select.
   */
  children?: React.ReactNode;
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
  export type Props<TValue = any> = SelectRootProps<TValue>;
  export type ChangeEventReason = SelectRootChangeEventReason;
  export type ChangeEventDetails = SelectRootChangeEventDetails;
}
