'use client';
import type * as React from 'react';
import type { ZestChangeEventDetails } from '../../utils/createChangeEventDetails';
import type { REASONS } from '../../utils/reasons';
import type { ComboboxHandle } from '../store/ComboboxHandle';
import type { ComboboxItem, ComboboxItems } from '../store/ComboboxStore';
import { useRenderComboboxRoot } from './useRenderComboboxRoot';

/**
 * Groups all parts of the combobox: a text input that filters a list of items,
 * one of which is selected.
 * Doesn't render its own element.
 *
 * **Adapted from upstream.** Base UI's Combobox is a large component built on a
 * shared collection/filter core with chips, groups, rows and virtualization.
 * This is a focused React Native port: an input, a filtered list, and single
 * selection. Filtering is a locale-aware label match by default (see
 * `useFilter`); pass `filter` to change it.
 */
export function ComboboxRoot<Payload = unknown>(props: ComboboxRoot.Props<Payload>) {
  return useRenderComboboxRoot(props, 'combobox');
}

export interface ComboboxRootState {}

export interface ComboboxRootActions {
  /**
   * Unmounts the list without firing `onOpenChange`. Call it after an
   * externally controlled closing animation finishes.
   */
  unmount: () => void;
  /**
   * Closes the list, reporting the `imperative-action` reason.
   */
  close: () => void;
}

export interface ComboboxRootProps<Payload = unknown> {
  /**
   * The items to filter and choose from. Strings, or `{ value, label }` records
   * for non-string values.
   */
  items?: ComboboxItems | undefined;
  /**
   * The selected value.
   *
   * To render an uncontrolled combobox, use the `defaultValue` prop instead.
   */
  value?: unknown;
  /**
   * The initially selected value.
   *
   * To render a controlled combobox, use the `value` prop instead.
   */
  defaultValue?: unknown;
  /**
   * Event handler called when the selection changes.
   */
  onValueChange?: ((value: any, eventDetails: ComboboxRoot.ChangeEventDetails) => void) | undefined;
  /**
   * The controlled input text.
   */
  inputValue?: string | undefined;
  /**
   * The initial input text when uncontrolled.
   */
  defaultInputValue?: string | undefined;
  /**
   * Event handler called as the input text changes.
   */
  onInputValueChange?:
    | ((value: string, eventDetails: ComboboxRoot.ChangeEventDetails) => void)
    | undefined;
  /**
   * Whether the list is currently open.
   */
  open?: boolean | undefined;
  /**
   * Whether the list is initially open.
   *
   * To render a controlled combobox, use the `open` prop instead.
   * @default false
   */
  defaultOpen?: boolean | undefined;
  /**
   * Event handler called when the list is opened or closed.
   */
  onOpenChange?:
    | ((open: boolean, eventDetails: ComboboxRoot.ChangeEventDetails) => void)
    | undefined;
  /**
   * Whether focusing the input opens the list.
   * @default true
   */
  openOnFocus?: boolean | undefined;
  /**
   * A custom filter predicate. Defaults to a locale-aware label match, so
   * "resume" finds "Résumé" — see `useFilter` to build your own.
   */
  filter?: ((item: ComboboxItem, query: string) => boolean) | undefined;
  /**
   * Whether the component should ignore user interaction.
   * @default false
   */
  disabled?: boolean | undefined;
  /**
   * Whether to prevent the list from closing on presses outside the popup.
   * @default false
   */
  disablePointerDismissal?: boolean | undefined;
  /**
   * A ref to imperative actions.
   */
  actionsRef?: React.RefObject<ComboboxRoot.Actions | null> | undefined;
  /**
   * A handle associating this combobox with an input rendered outside it, and
   * letting it be opened and closed imperatively. Create one with
   * `Combobox.createHandle()`.
   */
  handle?: ComboboxHandle | undefined;
  /**
   * The id of the input the list is anchored to. Useful together with the `open`
   * prop, to control which input a controlled list belongs to.
   */
  triggerId?: string | null | undefined;
  /**
   * The id of the input the list is initially anchored to. Useful together with
   * `defaultOpen`.
   */
  defaultTriggerId?: string | null | undefined;
  /**
   * The content of the combobox.
   *
   * Pass a function to receive the payload the list was opened with, via a
   * detached input's `payload` prop.
   */
  children?: React.ReactNode | ((payload: Payload) => React.ReactNode);
}

export type ComboboxRootChangeEventReason =
  | typeof REASONS.inputPress
  | typeof REASONS.inputChange
  | typeof REASONS.triggerFocus
  | typeof REASONS.itemPress
  | typeof REASONS.outsidePress
  | typeof REASONS.escapeKey
  | typeof REASONS.imperativeAction
  | typeof REASONS.none;

export type ComboboxRootChangeEventDetails = ZestChangeEventDetails<ComboboxRootChangeEventReason>;

export namespace ComboboxRoot {
  export type State = ComboboxRootState;
  export type Props<Payload = unknown> = ComboboxRootProps<Payload>;
  export type Actions = ComboboxRootActions;
  export type ChangeEventReason = ComboboxRootChangeEventReason;
  export type ChangeEventDetails = ComboboxRootChangeEventDetails;
}
