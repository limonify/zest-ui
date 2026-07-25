'use client';
import type * as React from 'react';
import { useRenderComboboxRoot } from '../../combobox/root/useRenderComboboxRoot';
import type { ComboboxHandle } from '../../combobox/store/ComboboxHandle';
import type { ComboboxItem, ComboboxItems } from '../../combobox/store/ComboboxStore';
import type {
  ComboboxRootActions,
  ComboboxRootChangeEventDetails,
  ComboboxRootChangeEventReason,
} from '../../combobox/root/ComboboxRoot';

/**
 * Groups all parts of the autocomplete: a free-text input with a list of
 * suggestions.
 * Doesn't render its own element.
 *
 * An autocomplete is a combobox whose value *is* the typed text — choosing a
 * suggestion fills the input rather than selecting a separate value. It reuses
 * every combobox part.
 */
export function AutocompleteRoot<Payload = unknown>(props: AutocompleteRoot.Props<Payload>) {
  return useRenderComboboxRoot(props, 'autocomplete');
}

export interface AutocompleteRootState {}

export interface AutocompleteRootProps<Payload = unknown> {
  /**
   * The suggestions. Strings, or `{ value, label }` records.
   */
  items?: ComboboxItems | undefined;
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
    | ((value: string, eventDetails: AutocompleteRoot.ChangeEventDetails) => void)
    | undefined;
  /**
   * Whether the suggestion list is currently open.
   */
  open?: boolean | undefined;
  /**
   * Whether the list is initially open.
   *
   * To render a controlled autocomplete, use the `open` prop instead.
   * @default false
   */
  defaultOpen?: boolean | undefined;
  /**
   * Event handler called when the list is opened or closed.
   */
  onOpenChange?:
    | ((open: boolean, eventDetails: AutocompleteRoot.ChangeEventDetails) => void)
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
  actionsRef?: React.RefObject<AutocompleteRoot.Actions | null> | undefined;
  /**
   * A handle associating this autocomplete with an input rendered outside it,
   * and letting it be opened and closed imperatively. Create one with
   * `Autocomplete.createHandle()`.
   */
  handle?: ComboboxHandle | undefined;
  /**
   * The id of the input the list is anchored to.
   */
  triggerId?: string | null | undefined;
  /**
   * The id of the input the list is initially anchored to.
   */
  defaultTriggerId?: string | null | undefined;
  /**
   * The content of the autocomplete.
   *
   * Pass a function to receive the payload the list was opened with.
   */
  children?: React.ReactNode | ((payload: Payload) => React.ReactNode);
}

export namespace AutocompleteRoot {
  export type State = AutocompleteRootState;
  export type Props<Payload = unknown> = AutocompleteRootProps<Payload>;
  /**
   * An autocomplete reuses the combobox store, so it reuses its event and
   * action contracts too.
   */
  export type Actions = ComboboxRootActions;
  export type ChangeEventReason = ComboboxRootChangeEventReason;
  export type ChangeEventDetails = ComboboxRootChangeEventDetails;
}
