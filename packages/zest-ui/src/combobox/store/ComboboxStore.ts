import type { TextInput } from 'react-native';
import { createSelector } from '../../store/createSelector';
import { ReactStore } from '../../store/ReactStore';
import {
  compareItemEquality,
  defaultItemEquality,
  type ItemEqualityComparer,
} from '../../internals/itemEquality';
import { createChangeEventDetails } from '../../utils/createChangeEventDetails';
import { PopupTriggerMap } from '../../utils/popups/PopupTriggerMap';
import { REASONS } from '../../utils/reasons';
import { toggleSelectedValue } from '../../utils/selection';
import type { ComboboxRoot } from '../root/ComboboxRoot';

/**
 * The items to filter and choose from: strings, `{ value, label }` records for
 * non-string values, or `{ label, items }` records to group them.
 */
export type ComboboxItems = ReadonlyArray<
  | string
  | { value: unknown; label: string }
  | { value?: unknown; label: string; items: ReadonlyArray<string | { value: unknown; label: string }> }
>;

export interface ComboboxItem {
  value: unknown;
  label: string;
}

/**
 * A group of items, which is what `Combobox.Group` renders. Its `value` defaults
 * to its label, and is only ever an identity — a group is never selectable.
 */
export interface ComboboxItemGroup {
  value: unknown;
  label: string;
  items: ComboboxItem[];
}

/**
 * An entry in the list: either a selectable item or a group of them.
 */
export type ComboboxEntry = ComboboxItem | ComboboxItemGroup;

/** Whether a list entry is a group rather than a selectable item. */
export function isComboboxGroup(entry: ComboboxEntry): entry is ComboboxItemGroup {
  return Array.isArray((entry as ComboboxItemGroup).items);
}

function normalizeComboboxItem(item: string | { value: unknown; label: string }): ComboboxItem {
  return typeof item === 'string'
    ? { value: item, label: item }
    : { value: item.value, label: item.label };
}

/** Normalizes the `items` prop into `{ value, label }` records and groups. */
export function normalizeComboboxItems(items: ComboboxItems | undefined): ComboboxEntry[] {
  if (!items) {
    return [];
  }

  return items.map((item) => {
    if (typeof item !== 'string' && 'items' in item && Array.isArray(item.items)) {
      return {
        value: 'value' in item && item.value !== undefined ? item.value : item.label,
        label: item.label,
        items: item.items.map(normalizeComboboxItem),
      };
    }

    return normalizeComboboxItem(item as string | { value: unknown; label: string });
  });
}

/**
 * Every selectable item in the list, groups flattened away. Selection is always
 * resolved against this — a group is a rendering concern, not a value.
 */
export function flattenComboboxEntries(entries: ComboboxEntry[]): ComboboxItem[] {
  const flat: ComboboxItem[] = [];

  for (const entry of entries) {
    if (isComboboxGroup(entry)) {
      flat.push(...entry.items);
    } else {
      flat.push(entry);
    }
  }

  return flat;
}

/**
 * The selected value(s) resolved back to `{ value, label }` records — what
 * `Combobox.Value`, `Combobox.Chips` and `Combobox.Clear` all render from.
 *
 * A value with no matching item still gets a record, labeled by stringifying it,
 * so a selection made before `items` caught up is never dropped. Single
 * selection resolves to zero or one record.
 */
export function resolveComboboxSelection(
  items: ComboboxItem[],
  value: unknown,
  multiple: boolean,
  comparer: ItemEqualityComparer = defaultItemEquality,
): ComboboxItem[] {
  const values = multiple ? (Array.isArray(value) ? value : []) : value == null ? [] : [value];

  return values.map(
    (selected) =>
      items.find((item) => compareItemEquality(item.value, selected, comparer)) ?? {
        value: selected,
        label: String(selected),
      },
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
  /**
   * Whether more than one item can be selected, which makes `value` an array.
   * Only meaningful in `'combobox'` mode — an autocomplete has no selection.
   */
  multiple: boolean;
  /**
   * How an item's value is matched against the selection. Defaults to
   * `Object.is`, so object values need one of their own.
   */
  isItemEqualToValue: ItemEqualityComparer;
  disabled: boolean;
  disablePointerDismissal: boolean;
  /**
   * Whether focusing the input opens the list.
   */
  openOnFocus: boolean;
  /**
   * Whether the next focus of the input should be ignored by `openOnFocus`.
   *
   * Choosing an item closes the list, and the input's `blur()` cannot take
   * effect while the Modal still holds focus. When the Modal goes away, focus
   * returns to the input and `openOnFocus` would reopen the list the user just
   * dismissed. This is armed by that close and spent by the focus it causes.
   */
  suppressFocusOpen: boolean;
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
  multiple: createSelector((state: State) => state.multiple),
  isItemEqualToValue: createSelector((state: State) => state.isItemEqualToValue),
  disabled: createSelector((state: State) => state.disabled),
  disablePointerDismissal: createSelector((state: State) => state.disablePointerDismissal),
  openOnFocus: createSelector((state: State) => state.openOnFocus),
  suppressFocusOpen: createSelector((state: State) => state.suppressFocusOpen),
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
        multiple: false,
        isItemEqualToValue: defaultItemEquality,
        disabled: false,
        disablePointerDismissal: false,
        openOnFocus: true,
        suppressFocusOpen: false,
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

    // A multiple combobox never mirrors its selection in the input, so whatever
    // is left there is a filter query — and it would still be filtering the list
    // the next time it opens. Dropping it here covers every way the list can
    // close (item press, outside press, escape, imperative) at once. It is a
    // change of its own, so it carries its own reason rather than sharing one.
    if (!nextOpen && this.select('multiple') && this.select('inputValue') !== '') {
      this.setInputValue('', createChangeEventDetails(REASONS.inputClear, eventDetails.event));
    }
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
   *
   * A `multiple` combobox toggles the value instead, and neither fills the input
   * nor closes: picking one of many is rarely the end of the interaction. The
   * exception is a list the user has filtered — there, upstream treats the
   * selection as the end of that query and closes, which drops the query
   * through `setOpen`.
   */
  public selectItem = (item: ComboboxItem, eventDetails: ComboboxRoot.ChangeEventDetails) => {
    const multiple = this.select('multiple');

    if (this.select('mode') === 'combobox') {
      this.setValue(
        toggleSelectedValue(
          this.select('value'),
          item.value,
          multiple,
          this.select('isItemEqualToValue'),
        ),
        eventDetails,
      );

      if (eventDetails.isCanceled) {
        return;
      }
    }

    if (multiple) {
      if (this.select('inputValue').trim() !== '') {
        this.set('suppressFocusOpen', true);
        this.setOpen(false, eventDetails);
      }

      return;
    }

    this.setInputValue(item.label, eventDetails);

    if (eventDetails.isCanceled) {
      return;
    }

    this.set('suppressFocusOpen', true);
    this.setOpen(false, eventDetails);
  };

  /**
   * Whether this focus is the one caused by a selection closing the list, and
   * spends the flag if so. Anything else opens normally.
   */
  public consumeSuppressedFocus = () => {
    if (!this.select('suppressFocusOpen')) {
      return false;
    }

    this.set('suppressFocusOpen', false);
    return true;
  };

  /**
   * Clears the selection and the input text, as `Combobox.Clear` does.
   *
   * The two share one `eventDetails`, so canceling in `onValueChange` also
   * leaves the input alone.
   */
  public clear = (eventDetails: ComboboxRoot.ChangeEventDetails) => {
    if (this.select('mode') === 'combobox') {
      this.setValue(this.select('multiple') ? [] : null, eventDetails);

      if (eventDetails.isCanceled) {
        return;
      }
    }

    this.setInputValue('', eventDetails);
  };
}
