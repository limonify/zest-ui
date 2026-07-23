---
"@limonify/zest-ui": patch
---

Fix Combobox/Autocomplete popup not closing and add trigger width sync to popup positioner

**Bug fixes:**
- Combobox/Autocomplete: Popup now closes properly when selecting an item or tapping backdrop. Previously, the input would regain focus after the Modal closed, triggering `openOnFocus` and reopening the popup. Fixed by adding `inputRef` to context and calling `blur()` on item selection and backdrop press.

**Features:**
- Combobox/Autocomplete/Select: Popup width now matches trigger width. The trigger's `onLayout` measures its width and passes it to the positioner, which applies it to the popup container.

**Breaking changes:**
- `ComboboxRootContext` now includes `inputRef`, `setInputRef`, `triggerWidth`, and `setTriggerWidth` fields
- `SelectStore.State` now includes `triggerWidth` field
