/**
 * Value comparison for the components that select from a list.
 *
 * A near-verbatim port of upstream's `internals/itemEquality.ts` — it is pure
 * value logic with no DOM in it. `findSelectionIndex` is the one export left
 * behind: it exists upstream to drive the highlighted index, and there is no
 * highlight on mobile.
 *
 * The default is `Object.is`, so a value only ever matches itself. Object values
 * therefore need a comparer — that is what `isItemEqualToValue` is for.
 */

export type ItemEqualityComparer<Item = any, Value = Item> = (
  itemValue: Item,
  selectedValue: Value,
) => boolean;

export const defaultItemEquality: ItemEqualityComparer = (itemValue, selectedValue) =>
  Object.is(itemValue, selectedValue);

/**
 * Compares one item value against one selected value.
 *
 * `null` and `undefined` never reach the comparer: a consumer writing
 * `(a, b) => a.id === b.id` should not have to guard against an empty selection.
 */
export function compareItemEquality<Item, Value>(
  itemValue: Item,
  selectedValue: Value,
  comparer: ItemEqualityComparer<Item, Value>,
): boolean {
  if (itemValue == null || selectedValue == null) {
    return Object.is(itemValue, selectedValue);
  }
  return comparer(itemValue, selectedValue);
}

/**
 * Whether a multiple selection contains `itemValue`.
 */
export function selectedValueIncludes<Item, Value>(
  selectedValues: readonly Item[] | undefined | null,
  itemValue: Value,
  comparer: ItemEqualityComparer<Value, Item>,
): boolean {
  if (!selectedValues || selectedValues.length === 0) {
    return false;
  }
  return selectedValues.some((selectedValue) => {
    if (selectedValue === undefined) {
      return false;
    }
    return compareItemEquality(itemValue, selectedValue, comparer);
  });
}

/**
 * The index of the item matching `selectedValue`, or `-1`.
 */
export function findItemIndex<Item, Value>(
  itemValues: readonly Item[] | undefined | null,
  selectedValue: Value,
  comparer: ItemEqualityComparer<Item, Value>,
): number {
  if (!itemValues || itemValues.length === 0) {
    return -1;
  }
  return itemValues.findIndex((itemValue) => {
    if (itemValue === undefined) {
      return false;
    }
    return compareItemEquality(itemValue, selectedValue, comparer);
  });
}

/**
 * A multiple selection with `itemValue` taken out.
 */
export function removeItem<Item, Value>(
  selectedValues: readonly Item[],
  itemValue: Value,
  comparer: ItemEqualityComparer<Value, Item>,
): Item[] {
  return selectedValues.filter(
    (selectedValue) => !compareItemEquality(itemValue, selectedValue, comparer),
  );
}
