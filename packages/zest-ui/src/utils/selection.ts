import {
  defaultItemEquality,
  compareItemEquality,
  removeItem,
  selectedValueIncludes,
  type ItemEqualityComparer,
} from '../internals/itemEquality';

/**
 * The selection helpers shared by every component that can select either one
 * value or several (`Select`, `Combobox`). In multiple mode the selection is an
 * array and membership is what counts; in single mode it is the value itself.
 *
 * Every comparison goes through an `ItemEqualityComparer`, defaulting to
 * `Object.is` — pass the component's `isItemEqualToValue` to select by object
 * values rather than by reference.
 */

/**
 * Whether `value` is selected, given the current selection.
 */
export function isValueSelected(
  selectedValue: unknown,
  value: unknown,
  multiple: boolean,
  comparer: ItemEqualityComparer = defaultItemEquality,
): boolean {
  if (multiple) {
    return Array.isArray(selectedValue) && selectedValueIncludes(selectedValue, value, comparer);
  }

  return compareItemEquality(value, selectedValue, comparer);
}

/**
 * The selection after `value` is pressed: a replacement normally, a toggle in
 * multiple mode.
 */
export function toggleSelectedValue(
  selectedValue: unknown,
  value: unknown,
  multiple: boolean,
  comparer: ItemEqualityComparer = defaultItemEquality,
): unknown {
  if (!multiple) {
    return value;
  }

  const current = Array.isArray(selectedValue) ? selectedValue : [];

  return selectedValueIncludes(current, value, comparer)
    ? removeItem(current, value, comparer)
    : [...current, value];
}
