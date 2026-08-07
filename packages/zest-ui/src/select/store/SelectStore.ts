import { createSelector } from '../../store/createSelector';
import { ReactStore } from '../../store/ReactStore';
import {
  compareItemEquality,
  defaultItemEquality,
  type ItemEqualityComparer,
} from '../../internals/itemEquality';
import { isValueSelected } from '../../utils/selection';
import { PopupTriggerMap } from '../../utils/popups/PopupTriggerMap';
import type { SelectRoot } from '../root/SelectRoot';

/**
 * Value-to-label data, as either a record keyed by value or an explicit list
 * (which is what non-string values need).
 */
export type SelectItems =
  | Record<string, string>
  | ReadonlyArray<{ value: unknown; label: string }>;

/**
 * Resolves a value's label from the consumer's `items`, falling back to the
 * labels items registered as they mounted.
 */
export function resolveSelectLabel(
  items: SelectItems | undefined,
  labelsByValue: Map<unknown, string>,
  value: unknown,
  comparer: ItemEqualityComparer = defaultItemEquality,
): string | undefined {
  if (items) {
    if (Array.isArray(items)) {
      const match = items.find((item) => compareItemEquality(item.value, value, comparer));
      if (match) {
        return match.label;
      }
    } else if (typeof value === 'string') {
      const label = (items as Record<string, string>)[value];
      if (label !== undefined) {
        return label;
      }
    }
  }

  const registered = labelsByValue.get(value);
  if (registered !== undefined || comparer === defaultItemEquality) {
    return registered;
  }

  // The map is keyed by reference, so an object value only ever hits above by
  // identity. A custom comparer means identity is not the question — scan.
  for (const [itemValue, label] of labelsByValue) {
    if (compareItemEquality(itemValue, value, comparer)) {
      return label;
    }
  }

  return undefined;
}

export type State = {
  open: boolean;
  openProp: boolean | undefined;
  /**
   * The uncontrolled selected value. Read through the `value` selector, which
   * resolves the controlled prop first.
   */
  value: unknown;
  /**
   * The controlled `value` prop, when provided.
   */
  valueProp: unknown;
  /**
   * Labels registered by `Select.ItemText` as items mount.
   */
  labelsByValue: Map<unknown, string>;
  /**
   * The consumer's value-to-label data. Items only register their labels once
   * they mount, which cannot happen before the popup is first opened — so a
   * closed select can only render its selected label from this.
   */
  items: SelectItems | undefined;
  /**
   * Whether more than one item can be selected, which makes `value` an array.
   */
  multiple: boolean;
  /**
   * How an item's value is matched against the selection. Defaults to
   * `Object.is`, so object values need one of their own.
   */
  isItemEqualToValue: ItemEqualityComparer;
  disabled: boolean;
  readOnly: boolean;
  required: boolean;
  disablePointerDismissal: boolean;
  /**
   * The anchor's native node, carried across the portal boundary.
   */
  triggerNode: unknown;
  /**
   * The id of the `Select.Label`, associated with the trigger. `undefined` when
   * there is no label.
   */
  labelId: string | undefined;
  update: (() => void) | undefined;
  /**
   * The trigger's measured width, used to size the popup.
   */
  triggerWidth: number | undefined;
  /**
   * The trigger's measured height.
   */
  triggerHeight: number | undefined;
  /**
   * The payload of the trigger the select was opened by, handed to the root's
   * children when they are a function.
   */
  payload: unknown;
  /**
   * The id of the trigger the select is associated with, or `null` for none.
   */
  triggerId: string | null;
  /**
   * The controlled `triggerId` prop, when provided.
   */
  triggerIdProp: string | null | undefined;
};

type Context = {
  onValueChange: ((value: any, eventDetails: SelectRoot.ChangeEventDetails) => void) | undefined;
  onOpenChange: ((open: boolean, eventDetails: SelectRoot.ChangeEventDetails) => void) | undefined;
  /**
   * Every trigger bound to this select, by id. A handle resolves `open(id)`
   * through this, which is what lets a trigger rendered outside the root open it.
   */
  triggerNodes: PopupTriggerMap;
};

const selectors = {
  open: createSelector((state: State) => state.openProp ?? state.open),
  value: createSelector((state: State) =>
    state.valueProp !== undefined ? state.valueProp : state.value,
  ),
  labelsByValue: createSelector((state: State) => state.labelsByValue),
  items: createSelector((state: State) => state.items),
  multiple: createSelector((state: State) => state.multiple),
  isItemEqualToValue: createSelector((state: State) => state.isItemEqualToValue),
  /**
   * Whether one item's value is selected.
   *
   * Items subscribe to this boolean rather than to the whole selection, so
   * choosing one row in a long list re-renders only the rows whose answer
   * actually changed — not every row. `useSyncExternalStore` bails out on an
   * unchanged value, which is what makes that work.
   */
  isSelected: createSelector(
    (state: State) => (state.valueProp !== undefined ? state.valueProp : state.value),
    (state: State) => state.multiple,
    (state: State) => state.isItemEqualToValue,
    (value: unknown, multiple: boolean, comparer: ItemEqualityComparer, itemValue: unknown) =>
      isValueSelected(value, itemValue, multiple, comparer),
  ),
  disabled: createSelector((state: State) => state.disabled),
  readOnly: createSelector((state: State) => state.readOnly),
  required: createSelector((state: State) => state.required),
  triggerNode: createSelector((state: State) => state.triggerNode),
  labelId: createSelector((state: State) => state.labelId),
  update: createSelector((state: State) => state.update),
  triggerWidth: createSelector((state: State) => state.triggerWidth),
  triggerHeight: createSelector((state: State) => state.triggerHeight),
  disablePointerDismissal: createSelector((state: State) => state.disablePointerDismissal),
  payload: createSelector((state: State) => state.payload),
  triggerId: createSelector((state: State) => state.triggerIdProp ?? state.triggerId),
};

export class SelectStore extends ReactStore<Readonly<State>, Context, typeof selectors> {
  constructor(initialState?: Partial<State>) {
    super(
      {
        open: false,
        openProp: undefined,
        value: undefined,
        valueProp: undefined,
        labelsByValue: new Map(),
        items: undefined,
        multiple: false,
        isItemEqualToValue: defaultItemEquality,
        disabled: false,
        readOnly: false,
        required: false,
        disablePointerDismissal: false,
        triggerNode: null,
        labelId: undefined,
        update: undefined,
        triggerWidth: undefined,
        triggerHeight: undefined,
        payload: undefined,
        triggerId: null,
        triggerIdProp: undefined,
        ...initialState,
      },
      {
        onValueChange: undefined,
        onOpenChange: undefined,
        triggerNodes: new PopupTriggerMap(),
      },
      selectors,
    );
  }

  public setOpen = (nextOpen: boolean, eventDetails: SelectRoot.ChangeEventDetails) => {
    if (nextOpen === this.select('open')) {
      return;
    }

    this.context.onOpenChange?.(nextOpen, eventDetails);

    if (eventDetails.isCanceled) {
      return;
    }

    this.set('open', nextOpen);
  };

  public setValue = (nextValue: unknown, eventDetails: SelectRoot.ChangeEventDetails) => {
    this.context.onValueChange?.(nextValue, eventDetails);

    if (eventDetails.isCanceled) {
      return;
    }

    this.set('value', nextValue);
  };

  public registerLabel = (value: unknown, label: string) => {
    const labels = this.state.labelsByValue;
    if (labels.get(value) === label) {
      return;
    }

    const next = new Map(labels);
    next.set(value, label);
    this.set('labelsByValue', next);
  };
}
