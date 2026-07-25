---
"@limonify/zest-ui": minor
---

API symmetry across the popup families, the missing half of the Field integration, and `useFilter`.

**Breaking changes**

- `Combobox.Root` and `Autocomplete.Root` now use the same cancelable event contract as every other
  family. `onOpenChange`, `onValueChange` and `onInputValueChange` receive an event details object
  instead of a raw native event:

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

  `ComboboxRootContext` is now the `ComboboxStore` rather than a plain object; parts read it with
  `store.useState(...)`. Anything reaching into the old context shape needs updating.

- `useFilter` replaces the ad-hoc `label.toLowerCase().includes(query)` default filter, so matching
  now folds accents as well as case. Pass `filter` to restore the old behaviour.

**Popup family symmetry**

- `Select` gains `handle`/`Select.createHandle()`, `actionsRef`, `disablePointerDismissal`,
  `triggerId`/`defaultTriggerId` and function children for the trigger payload.
- `Combobox`/`Autocomplete` gain the same, plus `transitionStatus`, `side` and `align` on
  `Popup`, `index` on `Item`, and a portal context that propagates `keepMounted`.
- `AlertDialog` and `Drawer` export their `Handle` type, not just `createHandle`.
- `ContextMenu.Root` exports `Actions`, `ChangeEventReason` and `ChangeEventDetails` on its own
  namespace instead of making consumers reach for `Menu.Root`'s.
- `ContextMenu.Positioner` no longer overflows the screen: it flips to the other side of the press
  point and clamps inside a new `collisionPadding` prop, reporting the result on `side`/`align`.
- `triggerWidth`/`triggerHeight` are published by every anchored family (Popover, Menu, Tooltip,
  Select, Combobox), not just Select and Combobox.

**Nested dialogs**

`Dialog.Popup`, `Dialog.Backdrop` and `Drawer.Popup` publish `nested` and `nestedDialogOpen`, the
React Native counterpart of the CSS variable the web version scales the underlying dialog with.

**Field integration**

`Field.Validity`'s `dirty`, `filled` and `touched` were only ever populated by text controls.
Checkbox, Switch, RadioGroup and NumberField now report them too, and Slider, Select and OTPField
are field-aware for the first time — inheriting `disabled`, taking their label from `Field.Label`,
and running `validate`.

**State and accessibility**

- `MeterRootState` was empty: it now carries `value`, `min`, `max`, `percent` and `formattedValue`,
  and every meter part extends it (as the progress parts already did). `ProgressRootState` gains
  the same fields alongside `status`.
- `Avatar.Image` and `Avatar.Fallback` render with `accessibilityRole="image"` — the avatar tree
  previously had no accessibility props at all.
- `OTPField.Root` renders with `role="group"` and each slot is labelled by its position.
- `TabsTabState` extends `TabsRootState` instead of duplicating its fields.

**New**

- `useFilter` — locale-aware `contains`/`startsWith`/`endsWith` built on `Intl.Collator`, exported
  for filtering your own lists.
