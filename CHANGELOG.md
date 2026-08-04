## [0.5.2] - 2026-08-04

No API changes — this release is infrastructure only.

### Features

- **Published to GitHub Packages, alongside npm.** The release workflow now mirrors `@limonify/zest-ui` to `npm.pkg.github.com` under the `limonify` org immediately after the npm publish, so the same version number is available from both registries for org-internal mirrors or air-gapped installs. GitHub Packages does not support npm provenance, so `--provenance` stays on the npm step only. A consumer installing from GitHub Packages must point the `@limonify` scope at that registry and authenticate via an `.npmrc`:

  ```bash
  # .npmrc — @limonify:registry=https://npm.pkg.github.com
  @limonify:registry=https://npm.pkg.github.com
  //npm.pkg.github.com/:_authToken=${GITHUB_PACKAGES_TOKEN}
  ```

### Internal

- **Tooling versions aligned.** CI and the release workflow pin bun `1.3.14`, matching the `packageManager` field. The root `typescript` dev dependency was reverted from `~7.0.2` to `~6.0.3`: typescript-eslint@8.66 (the latest published) hard-errors on TypeScript 7.0, so `turbo run lint` failed on every workspace until the revert. Kept from the upgrade pass: turbo `^2.10.8` and `@next/eslint-plugin-next` `^16.3.0`.

---

## [0.5.1] - 2026-07-31

One bug fix. **No breaking changes**, no API surface added.

### Bug Fixes

- **`NumberField` crashed on blur in React Native.** Hermes does not implement `Intl.NumberFormat.prototype.formatToParts`. `Intl.NumberFormat` is there and `format()` works, but that one method is `undefined`, so blurring a `NumberField` threw:

  ```
  TypeError: undefined is not a function
    at getFormatParts (number-field/utils/parse.ts:76)
    at parseNumber (number-field/utils/parse.ts:141)
    at NumberFieldInput onBlur
  ```

  `parse.ts` called it in three places to derive the locale's grouping and decimal separators and the currency or unit label. It now goes through `utils/formatToParts.ts`, which uses the engine's own implementation wherever there is one and otherwise derives the parts from `format()` alone.

  The fallback reproduces what `parse.ts` actually reads and **does not claim to be a complete `formatToParts`** — no `exponentSeparator`, no compact-notation suffixes, and no attempt at the `literal` placement of a real implementation. The separators are probed with a plain formatter rather than the caller's: a caller asking for `maximumFractionDigits: 0` or `useGrouping: false` would otherwise suppress the very symbol being looked for.

  Nothing changes on a platform that has the method, which is every browser and Node.

### Internal

- **Tests: 889 → 912** in 63 suites. Both new groups run with the method **deleted from the prototype** — the fallback on its own across `en-US`, `de-DE`, `tr-TR`, `fr-FR`, `en-IN` and `ar-EG`, and the entire existing `parseNumber` suite re-run without it. That second run is the one that matters: a test that simply called `formatToParts` would exercise the native path and prove nothing about the fallback, which is precisely how a method missing on the only platform this library ships to passed 889 tests and reached a device.

---

## [0.5.0] - 2026-07-29

The last part of the rendered output a consumer could not reach — the portal's `Modal` — plus two bug fixes and the test coverage the handle family never had. **No breaking changes.**

### Features

- **`modalProps` on every `Portal`**: each popup family's `Portal` (`Dialog`, `AlertDialog`, `Drawer`, `Menu`, `ContextMenu`, `Popover`, `Tooltip`, `Select`, `Combobox`, `Autocomplete`) forwards `modalProps` to the React Native `Modal` it renders. The Modal's `animationType="fade"` was previously unreachable, so a consumer-driven enter animation was stuck riding on top of a native cross-fade; pass `animationType: 'none'` to take it over entirely. `onShow`, `supportedOrientations` and the rest of the Modal API are reachable the same way.

  ```tsx
  <Dialog.Portal keepMounted modalProps={{ animationType: 'none' }}>
  ```

  Two props stay owned by zest: `visible` follows the popup's open state, and `onRequestClose` is _chained_ rather than replaced — yours runs first, then zest closes with the `escape-key` reason. The `transparent` and `statusBarTranslucent` defaults are load-bearing (the backdrop, and the coordinate space anchored popups are positioned in), so override them deliberately.

- **`ZestPortalModalProps`** is exported for typing a `modalProps` object you build elsewhere.

- **New subpath exports**: `@limonify/zest-ui/filter`, `/merge-props`, `/use-render` and `/types`. All four were already exported from the root but had no entry in the export map, so importing them by subpath failed.

### Bug Fixes

- **`useRender` types**: `UseRenderParameters` did not declare `className` or `style`, even though the implementation reads both. The documented way to build your own zest-style part did not typecheck. Both are now declared.
- **`ToggleGroup` and `CheckboxGroup` parent**: guard the `indexOf` result before `splice`. `splice(-1, 1)` removes the _last_ item, so a value that was not in the list would silently drop an unrelated one.

### Documentation

- **New utility pages**: [Hooks](https://zestui.limonify.com/docs/utilities/hooks), [useRender & mergeProps](https://zestui.limonify.com/docs/utilities/use-render) and [Store](https://zestui.limonify.com/docs/utilities/store). The 14 hooks, the render engine and the store layer were public exports with no documentation.
- **`modalProps`** is documented in Common props, and the Reanimated guide gained a section on turning the Modal's own fade off before animating a popup yourself.
- **Fixed the Reanimated collapsible recipe**, which dropped `props.style` — and with it the panel's own clip. Added a section on why panel content comes out invisible: a height that resolves to `0` before the content is measured, `props` not spread onto the animated view, or a missing `keepMounted`.
- Corrected the `animationType` claim in `ARCHITECTURE.md` and `CLAUDE.md` (they said `"none"`; the code says `"fade"`), dropped the finished build plan and the embedded copy of `CLAUDE.md` from `ARCHITECTURE.md`, and fixed every release date in this file against its git tag.

### Internal

- **Tests: 717 → 889** in 62 suites; statement coverage 90.32% → 93.77%, branch 82.34% → 85.91%. The handle family had tests for `Dialog` only — the other seven families are now covered, along with the `BasePopupHandle` attach/detach stack (overlapping roots, quiet handoff, restoring an earlier root, resolving a trigger registered before a root attached). Also covered: the 48 context hooks' throwing branch, `ComboboxValue`, `MenuArrow`, `useRender`, `warn`, `error`, `PopupTriggerMap`, `createSelector`, the four hooks the library exports but never uses itself, and `Accordion.Panel`'s content lifecycle.
- **CI** now lints and typechecks `apps/docs` and `apps/example`, which `turbo run lint` never visited; turbo declares the docs app's build outputs, which were missing, so a cache hit no longer restores an empty site.
- `size-limit` tightened from 500 KB to 75 KB against an actual 60 KB, plus a subpath gate; the half-adopted changesets setup was removed in favour of the tag-driven release workflow; the two READMEs are kept in sync by a CI check.

---

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

## [0.3.1] - 2026-07-23

### Bug Fixes

- **measurePadding style**: Fixed `measurePadding` prop in Collapsible/Accordion panels. The `top`/`right`/`bottom`/`left` values are now correctly converted to `paddingTop`/`paddingRight`/`paddingBottom`/`paddingLeft` for React Native. Previously they were applied as positioning properties which had no effect.

---

## [0.3.0] - 2026-07-23

### Features

- **Context hooks**: Exported `useCheckboxRootContext`, `useRadioRootContext`, `useSwitchRootContext`, and `useDialogRootContext` hooks. These hooks provide access to component state from child parts without requiring a `render` function. Now all compound components export their root context hooks for consistency.

### Documentation

- Added `## Context` sections to Checkbox, Radio, Switch, and Dialog component pages documenting the new hooks.

---

## [0.2.0] - 2026-07-23

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

## [0.1.5] - 2026-07-20

### Bug Fixes

- Normalized accordion values and fixed transition status effect.

---

## [0.1.4] - 2026-07-20

### Features

- Added panel state context hooks and `measurePadding` prop.
- Added `keepMounted` + `transitionStatus` to Switch.Thumb.

---

## [0.1.3] - 2026-07-20

### Bug Fixes

- Fixed toast animation lifecycle: auto-clear starting status and preserve measuredHeight.
- Fixed hook transition problem.

---

## [0.1.2] - 2026-07-19

### Features

- Added native fade transition for modal portals.

---

## [0.1.1] - 2026-07-18

### Infrastructure

- Upgraded `react-native-gesture-handler` to 3.1.
- Upgraded Expo and jest-expo to SDK 57 patches.
- Set repository URL for npm provenance.

---

## [0.1.0] - 2026-07-18

### Initial Release

- Ported 32 Base UI components to React Native.
- Headless, unstyled, accessible primitive components.
- Store-based state management.
- Compound component pattern.
- 636 Jest tests.
