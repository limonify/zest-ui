export { AutocompleteRoot as Root } from './root/AutocompleteRoot';
export { createAutocompleteHandle as createHandle } from './handle';

// An autocomplete reuses every combobox part but its Root. The chip parts are
// the exception: they render a selection, and an autocomplete's value is the
// typed text itself.
export { ComboboxInput as Input } from '../combobox/input/ComboboxInput';
export { ComboboxClear as Clear } from '../combobox/clear/ComboboxClear';
export { ComboboxPortal as Portal } from '../combobox/portal/ComboboxPortal';
export { ComboboxBackdrop as Backdrop } from '../combobox/backdrop/ComboboxBackdrop';
export { ComboboxPositioner as Positioner } from '../combobox/positioner/ComboboxPositioner';
export { ComboboxPopup as Popup } from '../combobox/popup/ComboboxPopup';
export { ComboboxList as List } from '../combobox/list/ComboboxList';
export { ComboboxGroup as Group } from '../combobox/group/ComboboxGroup';
export { ComboboxGroupLabel as GroupLabel } from '../combobox/group-label/ComboboxGroupLabel';
export { ComboboxCollection as Collection } from '../combobox/collection/ComboboxCollection';
export { ComboboxItem as Item } from '../combobox/item/ComboboxItem';
export { ComboboxEmpty as Empty } from '../combobox/empty/ComboboxEmpty';
export { ComboboxStatus as Status } from '../combobox/status/ComboboxStatus';
