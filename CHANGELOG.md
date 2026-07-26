## [0.4.0] - 2026-07-26

API symmetry across the popup families, the missing half of the Field integration, and `useFilter`.

### Breaking Changes

- **Combobox/Autocomplete event contract**: `Combobox.Root` and `Autocomplete.Root` now use the same cancelable event contract as every other family. `onOpenChange`, `onValueChange` and `onInputValueChange` receive an event details object instead of a raw native event:

  ```tsx
  // before
  <Combobox.Root onOpenChange={(open, event) => …} />

  // after
  <Combobox.Root
    onOpenChange={(open, eventDetails) => {
      if (eventDetails.reason === 'outside-press') {
        eventDetails.cancel();
      }
    }}
  />
  ```

- **`ComboboxRootContext`** is now the `ComboboxStore` rather than a plain object; parts read it with `store.useState(...)`. Anything reaching into the old context shape needs updating.
- **Default filtering**: `useFilter` replaces the ad-hoc `label.toLowerCase().includes(query)` default filter, so matching now folds accents as well as case. Pass `filter` to restore the old behaviour.
- **`MeterRootState` / `ProgressRootState`** gained fields (see below); types extending them may need updating.

### Features

#### Popup family symmetry

- **Select**: gains `handle`/`Select.createHandle()`, `actionsRef`, `disablePointerDismissal`, `triggerId`/`defaultTriggerId` and function children for the trigger payload.
- **Combobox/Autocomplete**: gain the same, plus `transitionStatus`, `side` and `align` on `Popup`, `index` on `Item`, and a portal context that propagates `keepMounted`.
- **AlertDialog/Drawer**: export their `Handle` type, not just `createHandle`.
- **ContextMenu.Root**: exports `Actions`, `ChangeEventReason` and `ChangeEventDetails` on its own namespace instead of making consumers reach for `Menu.Root`'s.
- **ContextMenu.Positioner**: no longer overflows the screen — it flips to the other side of the press point and clamps inside a new `collisionPadding` prop, reporting the result on `side`/`align`.
- **Anchored families**: `triggerWidth`/`triggerHeight` are published by every anchored family (Popover, Menu, Tooltip, Select, Combobox), not just Select and Combobox.

#### Nested dialogs

- `Dialog.Popup`, `Dialog.Backdrop` and `Drawer.Popup` publish `nested` and `nestedDialogOpen`, the React Native counterpart of the CSS variable the web version scales the underlying dialog with.

#### Field integration

- `Field.Validity`'s `dirty`, `filled` and `touched` were only ever populated by text controls. Checkbox, Switch, RadioGroup and NumberField now report them too.
- Slider, Select and OTPField are field-aware for the first time — inheriting `disabled`, taking their label from `Field.Label`, and running `validate`.

#### New

- **`useFilter`**: locale-aware `contains`/`startsWith`/`endsWith` built on `Intl.Collator`, exported for filtering your own lists.

### State

- **`MeterRootState`** was empty: it now carries `value`, `min`, `max`, `percent` and `formattedValue`, and every meter part extends it (as the progress parts already did).
- **`ProgressRootState`** gains the same fields alongside `status`.
- **`TabsTabState`** extends `TabsRootState` instead of duplicating its fields.

### Accessibility

- `Avatar.Image` and `Avatar.Fallback` render with `accessibilityRole="image"` — the avatar tree previously had no accessibility props at all.
- `OTPField.Root` renders with `role="group"` and each slot is labelled by its position.

### Documentation

- Added a `useFilter` page under Utilities.
- Updated Combobox, Autocomplete, Select, Menu, ContextMenu, Dialog, Drawer, Popover, Tooltip, Toast, AlertDialog, Field, Avatar, Meter, OTPField and Slider pages for the new APIs and state fields.

---

## [0.3.2] - 2026-07-23

### Bug Fixes

- **Combobox/Autocomplete popup**: Fixed popup not closing when selecting an item or tapping backdrop. Previously, the input would regain focus after the Modal closed, triggering `openOnFocus` and reopening the popup. Now the input is programmatically blurred on item selection and backdrop press.

### Features

- **Combobox/Autocomplete/Select trigger width**: Added `triggerWidth` to positioner state. The trigger's `onLayout` measures its width and exposes it via state, allowing consumers to apply it to the popup (React Native equivalent of web's `--anchor-width` CSS variable). This maintains headless UI principles - the library provides the information, consumers decide how to use it.

### Breaking Changes

- `ComboboxRootContext` now includes `inputRef`, `setInputRef`, `triggerWidth`, and `setTriggerWidth` fields
- `ComboboxPositionerState` now includes `triggerWidth` field
- `SelectPositionerState` now includes `triggerWidth` field
- `SelectStore.State` now includes `triggerWidth` field

---

## [0.3.1] - 2025-07-23

### Bug Fixes

- **measurePadding style**: Fixed `measurePadding` prop in Collapsible/Accordion panels. The `top`/`right`/`bottom`/`left` values are now correctly converted to `paddingTop`/`paddingRight`/`paddingBottom`/`paddingLeft` for React Native. Previously they were applied as positioning properties which had no effect.

---

## [0.3.0] - 2025-07-23

### Features

- **Context hooks**: Exported `useCheckboxRootContext`, `useRadioRootContext`, `useSwitchRootContext`, and `useDialogRootContext` hooks. These hooks provide access to component state from child parts without requiring a `render` function. Now all compound components export their root context hooks for consistency.

### Documentation

- Added `## Context` sections to Checkbox, Radio, Switch, and Dialog component pages documenting the new hooks.

---

## [0.2.0] - 2025-01-23

### Features

- **transitionStatus**: Added `transitionStatus` state field to Dialog, Drawer, Popover, Menu, Select, and Tooltip components. This enables control over open/close animations (`'starting'` | `'ending'` | `undefined`).
- **Slider.Thumb percent**: Added `percent` (0-100) field to Slider.Thumb state. Can be used to get thumb position as a percentage.
- **Subpath exports**: Added individual import paths for each component for tree-shaking optimization (e.g., `@limonify/zest-ui/dialog`, `@limonify/zest-ui/button`).
- **Keyboard props**: Added `keyboardShouldPersistTaps: 'handled'` and `keyboardDismissMode: 'on-drag'` defaults to SelectList.

### Bug Fixes

- **Collapsible Panel**: Added `height <= 0` check in panel height measurement. This prevents invalid layout measurements from affecting state.
- **Tooltip Accessibility**: Added `accessibilityRole: 'tooltip'` to Tooltip.Popup. Now properly recognized by screen readers.

### Performance Improvements

- **useMemo optimizations**: Wrapped state objects with `React.useMemo` in leaf components:
  - Button, Toggle, Separator, Input
  - MenuItem, TabsTab, AvatarRoot
  - RadioGroup, CheckboxGroup, ToggleGroup

### Infrastructure

- **Bundle size monitoring**: Added `size-limit`. Automatic bundle size check in CI (limit: 500 kB, current: ~57 kB).
- **Test coverage**: Added Jest coverage configuration. Coverage report can be generated with `bun run test:coverage`.
- **TypeScript strictness**: Added `noImplicitReturns` and `useUnknownInCatchVariables` compiler options.
- **CI/CD**: Added coverage reporting (Codecov) and bundle size check steps.
- **Changelog automation**: Added `@changesets/cli`. Automatic changelog can be generated by adding changeset files in PRs.

### Documentation

- Added `SliderThumbState` (including percent field) to Slider documentation.

---

## [0.1.5] - 2024-12-XX

### Bug Fixes

- Normalized accordion values and fixed transition status effect.

---

## [0.1.4] - 2024-12-XX

### Features

- Added panel state context hooks and `measurePadding` prop.
- Added `keepMounted` + `transitionStatus` to Switch.Thumb.

---

## [0.1.3] - 2024-12-XX

### Bug Fixes

- Fixed toast animation lifecycle: auto-clear starting status and preserve measuredHeight.
- Fixed hook transition problem.

---

## [0.1.2] - 2024-12-XX

### Features

- Added native fade transition for modal portals.

---

## [0.1.1] - 2024-12-XX

### Infrastructure

- Upgraded `react-native-gesture-handler` to 3.1.
- Upgraded Expo and jest-expo to SDK 57 patches.
- Set repository URL for npm provenance.

---

## [0.1.0] - 2024-12-XX

### Initial Release

- Ported 32 Base UI components to React Native.
- Headless, unstyled, accessible primitive components.
- Store-based state management.
- Compound component pattern.
- 636 Jest tests.
