## [Unreleased]

### Added

- **`Slider.Control` takes a `simultaneousGesture`, so a consumer can move the thumb on the UI
  thread.** The slider's own drag handlers touch the store, so the gesture is `.runOnJS(true)` and
  the thumb's position comes out of `state.value` — every move crosses to JS, updates the store and
  re-renders before the thumb can follow. That round trip lands on every frame of a drag, and it is
  what makes a slider stutter on a busy JS thread. zest neither animates nor takes an animation
  dependency, so instead it now runs a gesture of the consumer's own alongside its own through
  `Gesture.Simultaneous`: both see the same touch, the value updates in React exactly as before, and
  the thumb can follow the finger from a shared value with no render in the path. `Simultaneous`
  rather than composing handlers onto zest's gesture, because `.runOnJS(true)` applies to the whole
  gesture and would drag a worklet onto the JS thread with it.
- **The position → value arithmetic is exported, and is worklet-safe.** `sliderValueFromPosition`,
  `sliderPercentFromValue`, `roundValueToStep`, `countStepDecimals` and `clampValue` moved to
  `slider/sliderValue.ts` as pure functions carrying the `'worklet'` directive; `SliderRoot` calls
  them, so a consumer converting a touch on the UI thread runs the same code the store does rather
  than reimplementing RTL/vertical inversion, step snapping and float-error rounding. **No new
  dependency**: the directive is a marker reanimated's Babel plugin compiles, and RN consumers build
  zest from source, so it is compiled by whoever installs the package — and where the plugin is
  absent the functions stay plain.
- **`SliderRootState` publishes `controlSize` and `step`**, completing the geometry that conversion
  needs. A worklet cannot reach the store, so the geometry travels on the state object like
  everything else a part needs.

### Fixed

- **`countDecimals` read an exponential step as having no decimals.** `String(1e-7)` is `"1e-7"`,
  which the old split on `"."` counted as 0 — so a slider with a step that small rounded its value
  to an integer. It now reads the exponent.

## [0.8.1] - 2026-08-15

A one-line follow-up to 0.8.0, plus a docs-only fix for the live demos. No new dependencies, no
breaking changes.

### Fixed

- **`Toast.Root`'s gesture memo now lists the stable callbacks it closes over.** The gesture
  reads `publishMovement` and `resetMovement`, and they are in the dependency array — a no-op for
  behaviour, since both are `useStableCallback`, but it is what the rules-of-hooks linter asks
  for, and it keeps the memo honest.

### Internal

- **Anchored popups in the docs site no longer drift from their trigger on scroll.** Web demos
  run through `react-native-web`, where a popup sits in a `position: fixed` Modal that the page
  can scroll underneath — something a native `Modal` cannot do. The demos now wrap their
  Positioner in a docs-only `FollowScroll` helper that re-measures the trigger on every scroll
  frame; the library is untouched, and native consumers never need it (see the helper's doc
  comment). Covers Popover, Tooltip, Menu, Select, Combobox and Autocomplete.

## [0.8.0] - 2026-08-14

A 0.7.1 follow-up, still entirely inside the JS runtime: the Drawer/Toast swipe path stops
re-rendering the app, and the popup family gains the completion signal consumers have been
reimplementing themselves. All additive — nothing existing breaks.

### Changed

- **`Drawer.Indent` and `Drawer.IndentBackground` no longer re-render on every swipe frame.**
  They wrap the whole app, and the provider store's `swipeProgress` changes every frame while a
  sheet is swiped — which previously re-rendered the entire app inside the indent once per frame,
  even for consumers who never read it. They now subscribe only to the discrete fields
  (`active`, and `frontmostHeight` on the indent) and read `swipeProgress` as a snapshot at their
  last render. A scale that follows the finger is a per-frame value, so it belongs on your own
  UI thread: subscribe to the provider store directly and mirror `swipeProgress` into your
  animation library's shared value — documented in the Drawer docs and the `Drawer.Indent` JSDoc.
- **`Drawer.Popup` and `Toast.Root` coalesce their swipe movement to one commit per frame.** The
  gesture still fires per event; the React-visible `swipeMovement` is now written through
  `requestAnimationFrame` and applied synchronously when the gesture ends, so a burst of events
  no longer re-renders the popup several times a frame.
- **`useSliderRootContext`'s per-field subscription note from 0.7.1 extends to the drawer's
  indent** — the same "read the snapshot, subscribe to what you style" contract.

### Added

- **`Combobox.Icon`**, the counterpart of `Select.Icon` — a decorative, accessibility-hidden
  part that publishes `open`, for the chevron on a `Combobox.Trigger`.
- **`onOpenChangeComplete` on every popup root** (`Dialog`, `AlertDialog`, `Drawer`, `Popover`,
  `Tooltip`, `Menu`, `ContextMenu`, `Select`, `Combobox`, `Autocomplete`). zest never animates,
  so it cannot know when an enter or exit animation finishes — the consumer reports the settle
  through the store: `useXRootContext().settled(open)`. Calling it fires `onOpenChangeComplete`
  once per settle, with the reason of the last committed open/close. Fire-once per settle; the
  exit path needs `keepMounted` (or the part's own lever) so the tree stays up while it plays.
  This is the RN counterpart of the web's CSS-transition completion, built on the same precedent
  as `Form`'s imperative `actionsRef.current.submit()`.
- **`nestedDialogCount` on `Dialog.Popup` and `Drawer.Popup` state.** The store already tracked
  the count internally; it is now published alongside the boolean, so a sheet stack can recede a
  fixed step per nested level instead of approximating with "is something behind me".

### Fixed

- The `DrawerProviderStore` doc comment claimed the store kept a swipe from re-rendering the
  whole app — false for any React subscriber. Corrected to describe the snapshot contract.

## [0.7.1] - 2026-08-14

A performance pass on the drag path, entirely inside the JS runtime — no new dependencies, no
breaking changes. `Slider` state moved into a store, each part subscribes to its own slice of it,
and a drag commits its value once per frame instead of once per gesture event.

### Changed

- **`Slider` parts subscribe to their own state instead of the whole slider.** `Slider.Root` now
  owns a `SliderStore`, and the parts read it through per-field selectors (`useStoreState`). A
  thumb subscribes to its own value (plus the drag flag), the indicator and value text to the
  values array, and the track and label to nothing at all. Dragging a thumb in a range slider
  therefore re-renders the thumb being moved, the indicator and the value — not every thumb on
  the track, which is what the previous context broadcast forced. Public props, part names and
  published state shapes are unchanged.
- **A drag's value commits at most once per frame.** The gesture still fires `onValueChange`
  synchronously on every event, so the cancel veto and controlled props behave exactly as before;
  only the React-visible value is written through `requestAnimationFrame` and coalesced — several
  gesture events that land in one frame now produce one render instead of several. On release the
  final value applies synchronously.
- **`useSliderRootContext` now returns the slider's store.** The setter/handler and static
  surfaces (`setThumbValue`, `getValueFromPosition`, `getClosestThumbIndex`, `commitValue`,
  `controlSize`, `disabled`, `orientation`, …) are preserved as getters, and the reactive fields
  are available through `useStoreState(store, …)` instead of off a context object. The old
  `state` field has no store counterpart and is not published — read the fields it carried
  individually.
- **`Slider.Thumb`'s published `state.values` reflects the latest snapshot at that thumb's last
  render.** With per-field subscriptions a thumb whose own value did not change does not
  re-render, so its copy of the values array can trail a sibling's drag. Style from the fresh
  `state.value`/`state.percent`/`state.dragging` and subscribe explicitly when you need the whole
  array.

### Added

- **A performance harness in the example app.** `apps/example` has a new `Performance` section
  with a requestAnimationFrame meter (FPS, max frame time, jank count) and a three-thumb range
  slider to drag, so a drag's cost is measurable rather than guessed.
- **A "Smooth drags without Reanimated" section in the Slider docs**, covering RN's `Animated` +
  `useNativeDriver: true` transform follow.
- **An "Image caching" note on Avatar**, showing how to swap in `expo-image` through the `render`
  prop.

### Fixed

- The virtualized `Combobox.List` test passed `children={undefined}` as a prop to `FlatList`. The
  forwarded children are now dropped before spreading the props, which also clears a react-doctor
  warning.

## [0.7.0] - 2026-08-07

A Base UI parity pass: everything worth having that the port had left behind. Two new components
(`Form`, `DirectionProvider`), thirteen new parts, and the fix for the one gap that failed *silently*
rather than being merely absent — object values in `Select` and `Combobox`.

> **This release is breaking**, which is why it is a minor bump rather than a patch. Both breaks
> are in `Slider`, and only affect range sliders.

### Breaking

- **A popup's `Portal` no longer applies a native `Modal` transition.** `animationType` defaulted to
  `"fade"`, which competes with the enter/exit the consumer drives — on close the native cross-fade
  tears the surface away mid-exit, and every overlay in a serious app ended up passing
  `modalProps={{ animationType: 'none' }}`, silently broken wherever it was forgotten. zest never
  animates anything; this default did. It is now `"none"`:

  ```diff
  - <Dialog.Portal />
  + <Dialog.Portal modalProps={{ animationType: 'fade' }} />
  ```

  …if you want the platform transition back. Affects `Dialog`, `AlertDialog`, `Popover`, `Menu`,
  `ContextMenu`, `Select` and `Combobox`.

- **`react-native-gesture-handler`'s peer range widened from `>=3.0.0` to `>=2.32.0`.** The old floor
  locked zest out of every Expo app: Expo SDK 57 installs `~2.32.0`, and Expo Go ships that native
  build, so a project on gesture-handler 3.x bundled fine and then died at gesture attach with
  `undefined is not a function` in `attachHandlers.ts`. zest only uses `Gesture`, `GestureDetector`,
  `.withTestId()` and `.runOnJS()`, all of which 2.32 has. Verified by running the example app on an
  iOS simulator: 3.x crashed on launch, 2.32 rendered every section with no errors.

- **`react-native-gesture-handler` is now a required peer, not an optional one.** The optional
  declaration was true for npm and false for the bundler: the package root re-exports every
  component and Metro does not tree-shake, so `import { Dialog } from '@limonify/zest-ui'` pulls
  `Slider`, `Drawer`, `Toast` and `NumberField` into the graph, and each imports gesture-handler at
  the top level. Anyone who followed the old "install it only if you use them" advice and imported
  from the root got `Unable to resolve module react-native-gesture-handler` at bundle time, with
  the docs saying it was unnecessary.

  ```bash
  bun add react-native-gesture-handler
  ```

  Nothing about the code changed — this makes the install-time contract match what the bundler
  already required. The per-component subpaths still avoid it entirely
  (`@limonify/zest-ui/dialog`), and `GestureHandlerRootView` is still only needed when you actually
  render `Slider`, `Drawer`, `Toast` or `NumberField.ScrubArea`.

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
- **`./form` and `./direction-provider` subpath exports.** Every other component had one; the two
  new ones were missing, so `import { Form } from '@limonify/zest-ui/form'` failed.
- **`Select.List` publishes `open`**, matching `Combobox.List`. It was the one list whose state
  object was empty, so it could not be styled by whether the popup was open.
- **`Field.Error` publishes `errors` on its state**, so a `validate` returning several messages can
  render them all. `children` still defaults to the first.
- **`Combobox.Empty` takes `keepMounted`**, and publishes `empty` — the exit-animation lever every
  other conditionally rendered part already had.

- **`Combobox.Trigger`** (and `Autocomplete.Trigger`, the same part). `Combobox.Input` makes the
  closed state a text field; on a phone that often reads wrong, because a bare input gives no hint
  that a list will appear. The trigger makes it a button instead, and the input moves inside the
  popup where it filters. `role="combobox"` with `aria-haspopup="listbox"`.
- **Logical `side` values on every anchored positioner** — `inline-start` and `inline-end` resolve
  against the writing direction, so a popup can be placed on the reading-start edge without the
  consumer branching on `useDirection`. `state.side` still reports a physical side, narrowed to
  `PhysicalSide` so a `switch` over it is exhaustive.
- **Props Base UI has that zest did not**, found by diffing every part's props against upstream
  rather than by eye:
  - `placeholder` on `Select.Value` and `Combobox.Value`, with `state.placeholder` so it can be
    styled differently from a real value. A select's label is unknown until the popup has been
    opened once unless `items` was given, and the placeholder covers that too.
  - `disabled` on `Combobox.Item` — `Select.Item` already had it.
  - `getAccessibilityValueText` on `Slider.Root`, which `Progress` and `Meter` already had. The
    third argument is the thumb's index, so the ends of a range can read differently. Upstream's
    `getAriaValueText`, renamed: React Native has `accessibilityValue.text`.
  - `validationDebounceTime` on `Field.Root`, for an `onChange` validation that should not run on
    every keystroke. A blur or a submit validates immediately and cancels what is pending.
- **`Combobox.List` publishes its filtered entries on `state.items`, and `children` is now
  optional.** Together they are what lets a `render` function hand the rows to a `FlatList`, which
  takes them from `data` rather than from children — the React Native answer to upstream's
  DOM-bound `virtualized` prop. Omitting `children` also skips building the rows zest would
  otherwise map and `FlatList` would ignore. Recipe in the docs, with tests.
- **`Menu.Root` takes `disabled`**, which also disables its triggers.

- **`ContextMenu.Arrow`**, re-exported from `Menu` — `ContextMenu.Positioner` already provides the
  context it reads.

### Fixed

- **A touch inside a popup no longer reaches gestures in the app underneath it.** A `Portal` is a
  React Native `Modal`, which is its own native window, and `react-native-gesture-handler` attaches
  its recognizer to the root of the tree it was mounted in — so a tap on a `Select` row also went to
  whatever gesture happened to sit beneath it. Opening a combobox over a `Slider` and picking a row
  moved the slider. Every `Portal` now renders its children inside their own
  `GestureHandlerRootView`, which is gesture-handler's documented requirement for `Modal` and also
  what makes gestures work *inside* a popup — a swipeable `Drawer` needs a gesture root in its own
  window. Consumers need no change; it lives inside the portal. Verified on a simulator with the
  same tap before and after.

- **A `Combobox` with a `Trigger` no longer positions its popup against itself.** `Combobox.Trigger`
  and `Combobox.Input` both wrote the same anchor slot from their ref callback, and in the shape the
  docs recommend for a phone — a button outside, the search input *inside* the popup — the input
  mounts second and won. The popup was then anchored to an element it contains: it opened offset
  from its trigger, and moved again on every open. `state.triggerWidth` had the same problem, so
  sizing a popup to its trigger sized it to the input instead. The anchor is now the trigger
  whenever there is one, and the input only in its absence, which is the plain combobox. Found by
  opening the example app on a simulator.

- **`Slider.Thumb` and `Slider.Indicator` now flip under RTL.** Only the touch-to-value mapping was
  flipped, so the two halves disagreed: a touch 25% from the left became 75, and the thumb was then
  drawn 75% from the left — travelling away from the finger dragging it. Both parts now anchor with
  `right` when the direction is `rtl`. Also found by running the app.

- **Choosing one row no longer re-renders the whole list.** Every item subscribed to the entire
  selection, so picking one of fifty re-rendered all fifty — and the selected items shared a context
  with the filtered ones, so a selection also produced a new context value and re-rendered
  `Combobox.List` with every row under it. Items now subscribe to the boolean
  `isSelected(itemValue)`, which `useSyncExternalStore` bails out of for every row whose answer did
  not change, and the selection has a context of its own. Measured on a fifty-item list: fifty item
  renders per selection before, one after. It also removed the cost of writing
  `isItemEqualToValue` inline, which no longer reaches the items at all.

- **`Combobox.Status` now announces on iOS too.** It was built on
  `accessibilityLiveRegion`, which React Native only implements on Android, so on iOS the part did
  nothing at all. iOS now gets the same text through `AccessibilityInfo.announceForAccessibility`,
  and only when it changes — a keystroke that does not change the count stays quiet.

- **A blur could validate against a stale value.** `Field.Control` read the value from its render
  closure, so a change and the blur it causes landing in one batch — before React re-rendered —
  validated the value from *before* the change. The handler now writes the ref it reads, which is
  the pattern `Slider` already used for its gesture callbacks.

- **Every arrow rendered in its popup's top-left corner.** floating-ui's `arrow` middleware needs the
  arrow element to exist *and* to have been measured, and React Native measures asynchronously. The
  first position is computed as soon as the anchor and the popup have their refs — before the arrow
  has laid out — and nothing observes layout globally to try again, so the middleware returned no
  data at all and `Popover.Arrow`, `Tooltip.Arrow`, `Menu.Arrow` and `Select.Arrow` fell back to
  their container's origin. Each now reports its own layout, which recomputes the position once
  (and only once — reporting the same size again is dropped, or `update()` would loop).
- **A popup could reopen at a stale position.** The anchor's screen position is read at compute
  time, and nothing re-measured on open. A popup whose content stayed mounted therefore reopened
  wherever its trigger was the *last* time — after the page behind it had scrolled, somewhere
  unrelated. Opening now re-measures, and again on the next frame for the case where the Modal has
  not laid its children out yet.
- **A combobox reopened its own list after you chose from it.** `Combobox.Item` blurs the input on
  selection, but the Modal still holds focus, so the blur does nothing; when the Modal goes away
  focus returns to the `TextInput` and `openOnFocus` opened the list the user had just dismissed.
  The close now arms a one-shot suppression that the returning focus spends. A deliberate focus
  after that opens normally, and an ordinary dismissal is unaffected.

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
- 1089 tests, up from 912.

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

---

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
