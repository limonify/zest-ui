# Changelog

All notable changes to `@limonify/zest-ui` are documented here.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project
adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html). While the package is
pre-1.0, breaking changes are released as a **minor** bump.

## [0.7.0] - 2026-08-07

A Base UI parity pass: everything worth having that the port had left behind. Two new components
(`Form`, `DirectionProvider`), thirteen new parts, and the fix for the one gap that failed *silently*
rather than being merely absent — object values in `Select` and `Combobox`.

> **This release is breaking**, which is why it is a minor bump rather than a patch. Both breaks
> are in `Slider`, and only affect range sliders.

### Breaking

- **A range slider's thumbs now push each other by default.** Dragging a thumb into its neighbour
  used to stop it dead and drop the excess movement; it now pushes the neighbour along the track,
  which is upstream's default. The old behaviour is still available:

  ```diff
  - <Slider.Root value={[20, 50]} />
  + <Slider.Root value={[20, 50]} thumbCollisionBehavior="none" />
  ```

  The new `thumbCollisionBehavior` prop takes `'push'` (default), `'swap'` — thumbs trade places
  when one is dragged past another — or `'none'`. Upstream's `thumbAlignment` has no counterpart
  and is not planned: on the web it is CSS inset positioning, and here you place the thumb
  yourself from `state.values`.

- **`SliderRootContext.setThumbValue` returns the thumb's new index.** It used to return nothing.
  Only relevant if you build a custom control against `useSliderRootContext`: with
  `thumbCollisionBehavior="swap"` the dragged thumb changes index the moment it passes another, so
  a drag has to follow the returned index or the finger silently picks up the thumb it just went
  past.

### Added

- **`isItemEqualToValue` on `Select.Root` and `Combobox.Root`.** Values were compared with
  `Object.is`, so an object value only ever matched itself — and `items` built inline is a new
  array every render, which quietly dropped the selection. This is the one gap that produced
  *wrong behaviour* rather than a missing feature:

  ```tsx
  <Select.Root
    value={selected}
    isItemEqualToValue={(item, value) => item.id === value.id}
  />
  ```

  It applies everywhere the selection is compared: which item is marked selected, which label
  `Select.Value` resolves, the text filled into a combobox input, which chips render, and what a
  `multiple` press toggles. `null` and `undefined` never reach your comparer, so it does not have
  to guard against an empty selection. Upstream's `internals/itemEquality.ts` is ported almost
  verbatim.

- **Multi-select `Combobox`** — `multiple` on the root, plus `Combobox.Chips`, `Combobox.Chip`,
  `Combobox.ChipRemove` and `Combobox.Clear`. The value becomes an array, pressing an item toggles
  it, and the list stays open for the next pick. The input is left to the query and is never filled
  with a selected label; selecting out of a *filtered* list ends that query, so the list closes and
  the input clears with the `input-clear` reason.

  `Combobox.Value` takes a function child in this mode, receiving the selected items and rendering
  no element of its own — which is what keeps chips out of a `<Text>`.

  `Combobox.Clear` works in single-selection mode too, and in `Autocomplete` it clears the input.
  Neither it nor `ChipRemove` returns focus to the input, unlike the web version: with `openOnFocus`
  that would reopen the list.

- **Grouped combobox items** — `Combobox.Group`, `Combobox.GroupLabel` and `Combobox.Collection`.
  An entry in `items` becomes a group when it carries its own `items`. Filtering runs *inside* each
  group and a group whose items all filtered out is dropped, so a group never renders empty. A group
  is never matched on its own label — a query that happens to spell "Fruit" should not resurrect
  everything under it. `isComboboxGroup` is exported to tell the two apart.

- **`Combobox.ItemIndicator`** and **`Combobox.Status`.** The indicator mirrors `Select`'s.
  `Status` is a polite live region announcing how many items survived the query — filtering never
  moves focus, so nothing was telling a screen reader the list had changed. Pass a function child
  to localize it.

- **`Form`.** React Native has no `<form>` submission, so this is the part of upstream's `Form`
  that still earns its place: `errors` spreads a server's response onto the fields it names, and
  submitting validates every field and sends the user to the first that failed. Submission is
  imperative, through `actionsRef`, because there is no submit event to ride on:

  ```tsx
  const form = React.useRef<Form.Actions>(null);

  <Form actionsRef={form} errors={errors} onClearErrors={setErrors} onSubmit={save}>
    <Field.Root name="email">…</Field.Root>
  </Form>
  <Button onPress={() => form.current?.submit()}>Save</Button>
  ```

  A field drops its external error as soon as the user edits it — the server's complaint was about
  the value that was sent. "The first invalid field" is the first in tree order. Controls that
  cannot take focus (a checkbox, switch, slider or select trigger is a `Pressable`) are still
  marked invalid and still show their error; there is simply nothing to move the cursor to.

- **`DirectionProvider` and `useDirection`.** Direction defaults to React Native's own
  `I18nManager.isRTL`, so an app that has enabled RTL needs no wrapper; wrap a subtree to override
  it, which is what a language switcher inside an LTR app needs. It decides only what zest
  *derives* from direction: `align="start"` anchors a popup to the right edge (and `alignOffset`
  flips sign) for every popup family, and a horizontal slider's value grows right to left, with
  `state.direction` published so you can mirror your own thumb. `state.align` still reports the
  alignment you asked for, never the physical edge RTL put it on. It does not turn RTL layout on —
  only `I18nManager` does that. `Tabs` needed nothing: its indicator is positioned from measured
  `onLayout` coordinates, which the platform already reports mirrored.

- **`Field.Item`.** A `Field.Root` labels one control, so a checkbox or radio group inside it had
  every item pointing at the same label. An item opens a nested labelling scope: the `Field.Label`
  and `Field.Description` inside it associate with *its* control, while validity and `disabled`
  still come from the surrounding field.

- **`Drawer.Provider`, `Drawer.Indent` and `Drawer.IndentBackground`** — the iOS-style effect where
  the app scales back as a sheet comes up. Previously written off as unportable; it is not, because
  the app behind a transparent `Modal` is visible (that is how backdrop dimming already works).
  Upstream drives it with CSS variables; following the animation contract, zest publishes `active`,
  `swipeProgress` and `frontmostHeight` on the state object and you animate. `swipeProgress` is what
  lets the app scale back *with the finger* rather than snapping when the sheet finally closes.
  Two drawers open at once both count. The parts render inertly without a provider.

- **`Tooltip` caught up with the other popup families.** Its root had four props; it now takes
  `disabled`, `disablePointerDismissal`, `actionsRef`, `handle` (with `Tooltip.createHandle()`),
  `triggerId`/`defaultTriggerId`, and a function child receiving the trigger's payload — the same
  contract `Dialog`, `Popover`, `Menu`, `Select`, `Combobox` and `Drawer` already had. A disabled
  tooltip cannot be opened by a press or through its handle; closing is always allowed, so disabling
  one that is already open puts it away rather than stranding it on screen.

  `delay`, `closeDelay`, `hoverable` and `trackCursorAxis` remain deliberately absent: they exist to
  read hover intent, and a touch screen has no hover.

- **`Combobox` and `Autocomplete` now take part in `Field` and `Form`.** `Select` reported itself to
  a surrounding `Field.Root`; these two did not touch it at all, so a combobox inside a field was
  unlabelled, ignored the field's `disabled`, never ran its `validate`, and could not be submitted.
  Now the input is named by `Field.Label` and described by `Field.Description`/`Error`, closing the
  list counts as the blur that `validationMode="onBlur"` fires on, and a form focuses the input when
  submission stops there. An autocomplete's value is the typed text, so that is what its field
  validates.
- **`Field.Error` publishes `errors` on its state**, so a `validate` returning several messages can
  render them all. `children` still defaults to the first.
- **`Combobox.Empty` takes `keepMounted`**, and publishes `empty` — the exit-animation lever every
  other conditionally rendered part already had.

- **`Menu.Root` takes `disabled`**, which also disables its triggers.

- **`ContextMenu.Arrow`**, re-exported from `Menu` — `ContextMenu.Positioner` already provides the
  context it reads.

### Fixed

- **A non-text control could not be submitted, even when valid.** `Select`, `NumberField` and
  `Slider` call `useFieldControlRegistration` twice — once at the root, where the value is, and once
  at the element, for the accessibility props alone. Both registered with the field, so a form
  validated the control a second time against a value that call never had (`undefined`), and a
  perfectly valid `Select` could never pass submission. Only the call that owns the value registers
  now, behind an explicit `ownsValue`. This shipped in this release and never reached a published
  version.

### Changed

- `Combobox.List`'s render function now receives a list *entry* — an item or a group — and its
  index. A flat list is unaffected: both shapes carry `value` and `label`, and an entry is still
  assignable to `Combobox.Item`'s `item` prop.
- `Combobox.Item` no longer blurs the input in `multiple` mode. Dismissing the keyboard is right
  when the selection ends the interaction; a multiple combobox expects the next pick.
- `Combobox.Popup` reports `aria-multiselectable` while `multiple`, and `Combobox.Chips` becomes a
  `role="toolbar"` once it holds chips.
- `ComboboxValueState` gained `items` (the resolved selection) and `SliderRootState` gained
  `direction`. The combobox's change-event reasons grew by `input-clear`, `chip-remove-press` and
  `clear-press` — the last two were already defined in `reason-parts.ts` and unused.
- `Autocomplete` re-exports the new `Clear`, `Group`, `GroupLabel`, `Collection` and `Status`. The
  chip parts are not among them: an autocomplete's value is the typed text, so there is no selection
  to render.

### Not changed

- **`Accordion` still has no `orientation`.** It looked like a gap, but upstream deprecated the prop
  when roving focus was removed and it now only publishes a string for styling. The existing note
  was right.
- **`NumberField.ScrubAreaCursor` is not ported.** It is built on the Pointer Lock API; there is no
  cursor to replace on a touch screen.
- **`Drawer.VirtualKeyboardProvider` is not ported.** Upstream's is `visualViewport` measurement.
  React Native's `Keyboard` API could do the same job, but that is a rewrite rather than a port.
- **`Toolbar`, `Menubar`, `NavigationMenu`, `PreviewCard`, `ScrollArea` and `CSPProvider`** stay
  web-only for the reasons in the README.

### Internal

- `Select`'s `isSelectValueSelected`/`toggleSelectValue` moved to `utils/selection` as
  `isValueSelected`/`toggleSelectedValue` and now take a comparer, shared with `Combobox`. Neither
  was exported from the package.
- React Doctor: 98/100. The one remaining warning is the documented `expo-image` rejection.
- 1039 tests, up from 912.

---

## [0.6.0] - 2026-08-04

A React Doctor cleanup pass across the whole workspace: **27 findings → 1**, score 51 → 98/100.
The one that remains is deliberate and documented (see _Not changed_ below).

> **This release is breaking**, which is why it is a minor bump rather than a patch. Both breaks
> are in the store layer and are mechanical to migrate.

### Breaking

- **The store's React hooks are now free functions, not methods on `ReactStore`.** Import them
  from `@limonify/zest-ui` and pass the store as the first argument:

  ```diff
  - store.useControlledProp('openProp', open);
  - store.useContextCallback('onOpenChange', onOpenChange);
  - store.useSyncedValues({ disablePointerDismissal });
  - const open = store.useState('open');
  + useControlledProp(store, 'openProp', open);
  + useContextCallback(store, 'onOpenChange', onOpenChange);
  + useSyncedValues(store, { disablePointerDismissal });
  + const open = useStoreState(store, 'open');
  ```

  Note `store.useState` becomes **`useStoreState`** — it cannot keep the name, because almost
  every call site also imports React's `useState`. The full set: `useStoreState`,
  `useControlledProp`, `useContextCallback`, `useSyncedValue`, `useSyncedValues`,
  `useSyncedValueWithCleanup`, `useStateSetter`. `select()` and `observe()` are not hooks and
  remain methods.

  A class body is not a render scope as far as any Rules-of-Hooks checker is concerned, so as
  methods these read as hooks called outside a component — 13 lint errors, silenced by a
  file-wide `eslint-disable`. As module-scope functions they are ordinary custom hooks and are
  checked for real. That `eslint-disable` is gone.

- **`Store.use()` is removed.** It was an undocumented wrapper that only called the already-public
  `useStore`, and it was the last hook living inside a class body:

  ```diff
  - store.use(selector)
  + useStore(store, selector)
  ```

### Fixed

- **Menu items no longer re-render their children on every render.** `Menu.CheckboxItem` and
  `Menu.RadioItem` built a fresh `state` object each render and published it as a context value,
  so every consumer — including the item's indicator — re-rendered even when nothing changed.
  Now memoized, matching what `Select.Item` already did. Most visible in long menus on
  mid-range Android devices.
- **`Toggle` no longer calls a hook conditionally.** A development-only warning effect sat inside
  an `if (process.env.NODE_ENV !== 'production')` block; the hook is now called unconditionally
  with the environment check inside the effect body.
- **`useControlled` no longer warns with a stale component name.** Its default-value warning
  effect omitted `state` and `name` from its dependency array.
- **`Intl.NumberFormat` is no longer rebuilt for separator probing.** `formatToParts` now goes
  through the shared module-scope formatter cache in `utils/formatNumber` instead of
  constructing a throwaway formatter.

### Changed

- Stateless parts (`Menu.Group`, `Menu.GroupLabel`, `Select.Group`, `Select.GroupLabel`,
  `Select.Label`, `Select.List`) now share a frozen `EMPTY_OBJECT` for their state instead of
  allocating a new `{}` per render — the same constant `useRenderElement` already falls back to.
  A consumer mutating the state object they receive now fails loudly instead of silently.
- Two `.filter().map()` chains (`formatToParts`, `number-field/utils/parse`) collapsed into
  single passes.

### Not changed

- **`Avatar.Image` still renders React Native's `Image`, deliberately.** Migrating to
  `expo-image` was implemented and reverted: its entry point calls
  `initObserveIntegrationIfNeeded()` **at import time**, and `src/index.ts` re-exports
  `Avatar.Image`, so the native call would land in every consumer's bundle — including one that
  only renders a `Button` — and crash any app without `expo-modules-core`. Marking it an optional
  peer dependency does not help, since bundlers resolve static imports regardless.

  Consumers who want caching swap the element, which costs one prop:

  ```tsx
  import { Image as ExpoImage } from 'expo-image';

  <Avatar.Image source={{ uri }} render={<ExpoImage cachePolicy="memory-disk" />} />;
  ```

### Internal

- `bun.lock` reconciled with the workspace manifests — CI's `bun install --frozen-lockfile` step
  was failing before this.
- Example app and docs site cleaned up (both now report no findings): unused exports in
  `sections.tsx` made module-private, which also restored Fast Refresh for that file, and the
  docs `<img>` moved to `next/image` for lazy loading.

## [0.5.4] and earlier

See the [GitHub releases](https://github.com/limonify/zest-ui/releases).
