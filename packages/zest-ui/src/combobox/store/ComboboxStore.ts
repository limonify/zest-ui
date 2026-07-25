import type { TextInput } from 'react-native';
import { createSelector } from '../../store/createSelector';
import { ReactStore } from '../../store/ReactStore';
import { PopupTriggerMap } from '../../utils/popups/PopupTriggerMap';
import type { ComboboxRoot } from '../root/ComboboxRoot';

/**
 * The items to filter and choose from: strings, or `{ value, label }` records
 * for non-string values.
 */
export type ComboboxItems = ReadonlyArray<string | { value: unknown; label: string }>;

export interface ComboboxItem {
  value: unknown;
  label: string;
}

/** Normalizes the `items` prop into `{ value, label }` records. */
export function normalizeComboboxItems(items: ComboboxItems | undefined): ComboboxItem[] {
  if (!items) {
    return [];
  }

  return items.map((item) =>
    typeof item === 'string' ? { value: item, label: item } : { value: item.value, label: item.label },
  );
}

export type State = {
  /**
   * The uncontrolled open state. Read through the `open` selector, which
   * resolves the controlled prop first.
   */
  open: boolean;
  /**
   * The controlled `open` prop, when provided.
   */
  openProp: boolean | undefined;
  /**
   * The uncontrolled selected value. Read through the `value` selector.
   */
  value: unknown;
  /**
   * The controlled `value` prop, when provided.
   */
  valueProp: unknown;
  /**
   * The uncontrolled input text. Read through the `inputValue` selector.
   */
  inputValue: string;
  /**
   * The controlled `inputValue` prop, when provided.
   */
  inputValueProp: string | undefined;
  /**
   * Every item, normalized.
   */
  items: ComboboxItem[];
  /**
   * `'combobox'` selects a value and shows its label; `'autocomplete'` is free
   * text with suggestions, where the typed string is the value.
   */
  mode: 'combobox' | 'autocomplete';
  disabled: boolean;
  disablePointerDismissal: boolean;
  /**
   * Whether focusing the input opens the list.
   */
  openOnFocus: boolean;
  /**
   * The anchor's native node, carried across the portal boundary.
   */
  triggerNode: unknown;
  /**
   * The input's measured width, used to size the popup.
   */
  triggerWidth: number | undefined;
  /**
   * The input's measured height.
   */
  triggerHeight: number | undefined;
  update: (() => void) | undefined;
  /**
   * Ref to the input element, for programmatic blur.
   */
  inputRef: React.RefObject<TextInput | null> | undefined;
  /**
   * The payload of the trigger the popup was opened by, handed to the root's
   * children when they are a function.
   */
  payload: unknown;
  /**
   * The id of the trigger the popup is associated with, or `null` for none.
   */
  triggerId: string | null;
  /**
   * The controlled `triggerId` prop, when provided.
   */
  triggerIdProp: string | null | undefined;
};

type Context = {
  onOpenChange:
    | ((open: boolean, eventDetails: ComboboxRoot.ChangeEventDetails) => void)
    | undefined;
  onValueChange:
    | ((value: any, eventDetails: ComboboxRoot.ChangeEventDetails) => void)
    | undefined;
  onInputValueChange:
    | ((value: string, eventDetails: ComboboxRoot.ChangeEventDetails) => void)
    | undefined;
  /**
   * Every trigger bound to this root, by id. A handle resolves `open(id)`
   * through this, which is what lets an input rendered outside the root open it.
   */
  triggerNodes: PopupTriggerMap;
};

const selectors = {
  open: createSelector((state: State) => state.openProp ?? state.open),
  value: createSelector((state: State) =>
    state.valueProp !== undefined ? state.valueProp : state.value,
  ),
  inputValue: createSelector((state: State) => state.inputValueProp ?? state.inputValue),
  items: createSelector((state: State) => state.items),
  mode: createSelector((state: State) => state.mode),
  disabled: createSelector((state: State) => state.disabled),
  disablePointerDismissal: createSelector((state: State) => state.disablePointerDismissal),
  openOnFocus: createSelector((state: State) => state.openOnFocus),
  triggerNode: createSelector((state: State) => state.triggerNode),
  triggerWidth: createSelector((state: State) => state.triggerWidth),
  triggerHeight: createSelector((state: State) => state.triggerHeight),
  update: createSelector((state: State) => state.update),
  inputRef: createSelector((state: State) => state.inputRef),
  payload: createSelector((state: State) => state.payload),
  triggerId: createSelector((state: State) => state.triggerIdProp ?? state.triggerId),
};

/**
 * The store behind `Combobox.Root` and `Autocomplete.Root`.
 *
 * It follows the same controlled-prop and cancelable-event contract as the other
 * popup families: every change fires its callback first and only commits the
 * uncontrolled key when the consumer has not called `eventDetails.cancel()`.
 */
export class ComboboxStore extends ReactStore<Readonly<State>, Context, typeof selectors> {
  constructor(initialState?: Partial<State>) {
    super(
      {
        open: false,
        openProp: undefined,
        value: null,
        valueProp: undefined,
        inputValue: '',
        inputValueProp: undefined,
        items: [],
        mode: 'combobox',
        disabled: false,
        disablePointerDismissal: false,
        openOnFocus: true,
        triggerNode: null,
        triggerWidth: undefined,
        triggerHeight: undefined,
        update: undefined,
        inputRef: undefined,
        payload: undefined,
        triggerId: null,
        triggerIdProp: undefined,
        ...initialState,
      },
      {
        onOpenChange: undefined,
        onValueChange: undefined,
        onInputValueChange: undefined,
        triggerNodes: new PopupTriggerMap(),
      },
      selectors,
    );
  }

  public setOpen = (nextOpen: boolean, eventDetails: ComboboxRoot.ChangeEventDetails) => {
    if (nextOpen === this.select('open')) {
      return;
    }

    this.context.onOpenChange?.(nextOpen, eventDetails);

    if (eventDetails.isCanceled) {
      return;
    }

    this.set('open', nextOpen);
  };

  public setValue = (nextValue: unknown, eventDetails: ComboboxRoot.ChangeEventDetails) => {
    this.context.onValueChange?.(nextValue, eventDetails);

    if (eventDetails.isCanceled) {
      return;
    }

    this.set('value', nextValue);
  };

  public setInputValue = (nextValue: string, eventDetails: ComboboxRoot.ChangeEventDetails) => {
    this.context.onInputValueChange?.(nextValue, eventDetails);

    if (eventDetails.isCanceled) {
      return;
    }

    this.set('inputValue', nextValue);
  };

  /**
   * Reflects a value the consumer changed from outside into the input text.
   *
   * This is not a change the consumer made through the combobox, so it fires no
   * callback — it writes the uncontrolled key directly.
   */
  public reflectInputValue = (nextValue: string) => {
    this.set('inputValue', nextValue);
  };

  /**
   * Selects an item: records the value, fills the input with its label, and
   * closes the popup.
   *
   * One `eventDetails` object is shared by all three, so canceling in any
   * handler stops the rest — the same contract the group components use.
   */
  public selectItem = (item: ComboboxItem, eventDetails: ComboboxRoot.ChangeEventDetails) => {
    if (this.select('mode') === 'combobox') {
      this.setValue(item.value, eventDetails);

      if (eventDetails.isCanceled) {
        return;
      }
    }

    this.setInputValue(item.label, eventDetails);

    if (eventDetails.isCanceled) {
      return;
    }

    this.setOpen(false, eventDetails);
  };
}
