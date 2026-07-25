import { ComboboxHandle } from '../combobox/store/ComboboxHandle';

/**
 * Controls an autocomplete imperatively, and associates an
 * `Autocomplete.Input` rendered outside the root with it.
 *
 * An autocomplete reuses the combobox store, so it reuses its handle too — only
 * the name in warnings differs.
 */
export type AutocompleteHandle = ComboboxHandle;

/**
 * Creates a handle that connects an `Autocomplete.Root` to an input rendered
 * outside it, and controls it imperatively.
 */
export function createAutocompleteHandle(): AutocompleteHandle {
  return new ComboboxHandle('Autocomplete');
}
