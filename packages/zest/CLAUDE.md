# @limonify/zest — component porting guide

Headless React Native port of [Base UI](https://github.com/mui/base-ui). When porting a new component, follow the recipe below — it is the exact template proven by Checkbox and Dialog in Milestone 1.

## Ground rules

- **Part names come from real Base UI**, never Radix: `Popup`/`Backdrop`/`Viewport`/`Panel`/`Positioner`, not `Content`/`Overlay`.
- **React 19 only**: `ref` is a regular prop (no `forwardRef`), use `React.useId`, `React.useSyncExternalStore` directly.
- **Zero DOM**: no `document`, `window` DOM APIs, `Event`, `HTMLElement`. Native events are `ZestNativeEvent` (`GestureResponderEvent | NativeSyntheticEvent<unknown> | undefined`).
- **Two runtime deps, and no more without a decision**: `@floating-ui/react-native` (positioning) and `react-native-gesture-handler` (an *optional* peer, imported only by Slider and Drawer). `reanimated` is not used and is not planned — see the animation contract.
- Always port from the upstream source, not from memory. Clone shallow into the session scratchpad if the reference copy is gone:
  `git clone --depth 1 https://github.com/mui/base-ui <scratchpad>/base-ui`

## Directory layout (mirrors upstream)

```
src/<component>/
├── root/<Component>Root.tsx        + <Component>Root.test.tsx
├── root/<Component>RootContext.ts  # React context holding the store (or plain state object)
├── <part>/<Component><Part>.tsx    # one dir per part
├── store/<Component>Store.ts       # only for stateful compound components
├── index.parts.ts                  # export { ComponentRoot as Root } ...
└── index.ts                        # export * as Component from './index.parts'
```

Simple components (Button, Separator) are a single `<component>/<Component>.tsx` + `index.ts`. Register every component in `src/index.ts`.

## Component file template

```tsx
'use client';
import * as React from 'react';
import { View } from 'react-native';
import { useRenderElement } from '../../use-render/useRenderElement';
import type { BaseUIComponentProps } from '../../types';

export function ComponentPart(componentProps: ComponentPart.Props) {
  const { render, className, style, ref, ...elementProps } = componentProps;

  const state: ComponentPartState = { /* ... */ };

  return useRenderElement(View, componentProps, {
    state,
    ref,
    props: [{ /* internal props/handlers first */ }, elementProps],
    // enabled: false → renders nothing (conditional mounting, e.g. indicators)
  });
}

export interface ComponentPartState { /* fields exposed to style/render fns */ }
export interface ComponentPartProps
  extends BaseUIComponentProps<typeof View, ComponentPartState> { /* own props */ }

export namespace ComponentPart {
  export type State = ComponentPartState;
  export type Props = ComponentPartProps;
}
```

Key conventions inside parts:

- `props` array order: `[{ internal handlers/a11y }, elementProps, getButtonProps?]` — later entries win via `mergeProps` (right-to-left handler chaining preserved).
- Styles merge as RN arrays `[internal, external]` — never object spread. `style` may be a function of `state`.
- No `data-*` attributes. State reaches the consumer through `style={(state) => ...}`, `render(props, state)`, and explicit `accessibilityState` / `role` / `aria-*` props.
- Pressable parts track `pressed` locally (`onPressIn`/`onPressOut`) and expose it on `State`.
- Buttons go through `useButton({ disabled })` from `src/internals/use-button` for role + disabled a11y.

## Stateful components: the store pattern

Port the upstream `<Component>Store` (extends `ReactStore`). The critical controlled-prop pattern (upstream-exact — do not simplify):

```ts
export type State = {
  open: boolean;            // uncontrolled value
  openProp: boolean | undefined;  // mirror of the controlled prop
  // ...
};

const selectors = {
  open: createSelector((s: State) => s.openProp ?? s.open),
};

// in setOpen(nextOpen, eventDetails):
//   1. bail if nextOpen === this.select('open')
//   2. call this.context.onOpenChange?.(nextOpen, eventDetails)
//   3. bail if eventDetails.isCanceled
//   4. this.set('open', nextOpen)   // only the uncontrolled key
```

Root component wiring:

```tsx
const store = useRefWithInit(() => new DialogStore({ open: defaultOpen, openProp: open, ... })).current;
store.useControlledProp('openProp', open);
store.useContextCallback('onOpenChange', onOpenChange);
store.useSyncedValues({ disablePointerDismissal });
```

State changes fire through `createChangeEventDetails(REASONS.xxx, event)`; add the component's `ChangeEventReason` union next to its Root, reusing `REASONS` slugs (`trigger-press`, `outside-press`, `escape-key`, `close-press`, `imperative-action`, `none`). New reasons go into `src/utils/reason-parts.ts` / `reasons.ts`.

## Group components (ToggleGroup, RadioGroup, CheckboxGroup)

Upstream's grouped form controls lean on `Field`, `Form`, and `Composite` (roving tabindex). **None of these are ported** — React Native has no HTML form submission and no Tab key — so drop them along with the hidden `<input>`, `visuallyHidden*`, `name`/`form`/`uncheckedValue` props, and `dispatchClickWithModifiers`. Keep everything else identical.

The established group pattern:

```ts
// <Component>Group renders a View, owns `useControlled` state + a `useStableCallback`
// setter that fires onValueChange BEFORE committing, so cancel() vetoes the change.
export const XGroupContext = React.createContext<XGroupContext<any> | undefined>(undefined);
export function useXGroupContext<Value = string>() {
  return React.useContext<XGroupContext<Value> | undefined>(XGroupContext);
}
```

- Type the context `<any>` and make the **hook** generic (upstream's trick). Typing the context with a concrete `Value` makes the provider's contravariant `setGroupValue` unassignable and forces casts.
- The child consumes the group as `string`-valued when its own value is always a string at runtime — that avoids casts on both sides.
- Optional vs required group: `Toggle`/`Checkbox` work standalone, so their group hooks return `undefined`. `Radio.Root` **requires** `RadioGroup` and throws — without a hidden `<input>` a standalone radio has no source of truth and would be silently inert.
- One `eventDetails` object is shared between the child's `onCheckedChange`/`onPressedChange` and the group's `onValueChange`; check `isCanceled` after **each** call so either handler can veto.
- Groups use `role: 'group'` (RN's `role` prop accepts W3C roles that `accessibilityRole` lacks); RadioGroup uses `accessibilityRole: 'radiogroup'`, which RN does support.

## The animation contract (Collapsible, Accordion, and every future animated part)

On the web, Base UI publishes state as `data-*` attributes plus CSS variables, **CSS** runs the animation, and `useOpenChangeComplete` unmounts the element once the browser fires `transitionend`/`animationend`. React Native has none of that, so the contract is:

1. **`useTransitionStatus` is ported verbatim** (`src/internals/useTransitionStatus.ts`) — it is DOM-free, needing only `AnimationFrame` + `useIsoLayoutEffect`. It yields `mounted` + `transitionStatus` (`'starting' | 'idle' | 'ending' | undefined`).
2. **Measured geometry and `transitionStatus` go on the state object**, which is the RN counterpart of upstream's CSS variables. `Collapsible.Panel` publishes `height`/`width` exactly where the web version writes `--collapsible-panel-height`. The consumer reads them from `style={(state) => ...}` or `render={(props, state) => ...}` and drives their own `Animated` value. zest never animates anything itself — that is what keeps it headless and dependency-free.
3. **Nothing can report that a closing animation finished**, so exit animations require `keepMounted`. Without it a panel unmounts the moment it closes (`useCollapsiblePanel` calls `setMounted(false)` immediately). Say this in the prop docs of any part that gains a `keepMounted`.
4. **Measuring a collapsed element requires an inner wrapper.** A panel's own size is consumer-driven, so its natural content size must be measured on a child that is never size-constrained — `useCollapsiblePanel` renders `<View onLayout>` around `children` and overrides `children` in the last props slot. Yoga still lays that child out at its natural size even when the parent is clipped to zero (`flexShrink` defaults to `0` in RN), so `onLayout` reports the true height.

Do not port upstream's `useCollapsiblePanel` (~550 lines): it is entirely CSS-transition/keyframe coordination, `hiddenUntilFound`, and `getComputedStyle`. The zest equivalent is ~60 lines.

## Portals are `Modal`, and positioning rides on that

Every `Portal` part (Dialog, Drawer, Popover, Tooltip, Menu, Select) is an RN `Modal`. **Do not replace it with a state-lifting PortalHost**: a PortalHost re-parents children into a different React tree, which drops every context between a `Popover.Root` and its `Popover.Popup`. `Modal` keeps children in the same React tree, so contexts survive, and it brings focus containment plus `onRequestClose` (Android back / web Escape) → the `escape-key` reason for free.

`useAnchorPositioning` (`src/utils/useAnchorPositioning.ts`) wraps `@floating-ui/react-native`'s `useFloating` with `sameScrollView: false`, which makes it measure via `measureInWindow` and add `StatusBar.currentHeight` on Android — i.e. **screen coordinates**. That is exactly the origin of a `statusBarTranslucent` Modal, which is why the two agree. Changing either half breaks positioning on Android.

There is no `autoUpdate` equivalent in RN: parts re-measure by calling the returned `update()` from `onLayout`.

## Gestures (`react-native-gesture-handler`)

Only `Slider.Control` and `Drawer.Popup` use it, which is why it is an **optional** peer dependency. Both need the app wrapped in `<GestureHandlerRootView>` — including in tests, or `GestureDetector` throws.

- Gesture callbacks touch React state, so they must be `.runOnJS(true)`.
- **Gesture callbacks read stale state.** A drag emits several changes in one synchronous batch (its last move and its release land before React re-renders), so any value the callbacks both read and write lives in a ref, synced back from render by a `useIsoLayoutEffect` with **no dependency array** — it must also resync when a controlled consumer ignores a change, which re-renders nothing. `SliderRoot`'s `valuesRef` is the reference implementation.
- A gesture is invisible in the rendered tree, so tests reach it only through gesture-handler's registry, keyed by `.withTestId()`. Both parts forward their own `testID` to it — that registry is only populated under a test env, and it is what makes the gesture testable for zest's consumers too.

## RN adaptations cheat-sheet

| Upstream (web) | Zest (RN) |
|---|---|
| tag name (`'div'`, `'button'`) | default component (`View`, `Pressable`, `Text`) |
| Portal to `document.body` | RN `Modal` (transparent, `animationType="none"`, `statusBarTranslucent`) — for **every** popup family (see below) |
| outside click / dismiss | full-screen `Viewport` Pressable; popup claims responder via `onStartShouldSetResponder: () => true` |
| Escape key | `Modal.onRequestClose` → `REASONS.escapeKey` |
| `aria-labelledby` + ids | `useId` + `nativeID` + `accessibilityLabelledBy` (+ keep the `aria-*` prop for RN-web) |
| `data-popup-open` etc. | `State` fields consumed by style/render functions |
| focus trap | `accessibilityViewIsModal` (iOS) + Modal's built-in containment |
| hidden `<input>` for form submit | nothing — drop `name`/`form`/`value`/`uncheckedValue`/`inputRef` |
| `CompositeRoot`/`CompositeItem` (roving tabindex) | nothing — no Tab key on mobile; render the part directly |
| `CompositeList` (reads **visual order** from the DOM) | `src/internals/composite/list` — registration order, corrected by measured layout (see below) |
| CSS transitions/keyframes + `transitionend` | `transitionStatus` + measured size on the state object; the consumer animates |
| `--some-css-var` published for styling | a field on the state object |
| `hidden` / `hidden="until-found"` | `accessibilityElementsHidden` + `importantForAccessibility="no-hide-descendants"` (find-in-page has no RN equivalent) |

## Ordered lists: `CompositeList` (`src/internals/composite/list`)

Use this for any component that needs to know the **visual order** of its items — Tabs does, and Select/Menu/Toolbar will. Do not inline a component-specific registry.

Upstream sorts items with `compareDocumentPosition` and watches for reorders with a `MutationObserver`. Neither exists in RN, so order comes from two sources:

1. **Registration order**, exact at mount because React runs layout effects in child order. (This is not a hack: upstream itself falls back to it via `IndexGuessBehavior.GuessFromOrder`.)
2. **Measured layout**, once *every* item has reported an `onLayout`. Items then sort in reading order — vertically overlapping items count as one row and sort by `x`, otherwise by `y`. This is the real visual order, so it stays correct under `row-reverse`, wrapping, and absolute positioning, and it repairs the one case registration order cannot see: **children reordered without remounting**, which re-runs no effect but always moves the item on screen. That case is exactly what upstream's `MutationObserver` exists for.

Sorting flips to layout only when all items are measured, so the comparator never mixes the two orderings — mixing them would not be transitive and the sort would be undefined.

Usage: wrap items in `<CompositeList onMapChange={setMap}>`; each item calls `useCompositeListItem({ metadata })` and **must spread the returned `onLayout`** onto its element, or the list can never leave registration order. The map's iteration order is visual order, and each entry carries `index` plus the measured `layout`.

`ResizeObserver` needs no equivalent: `onLayout` already fires on size changes, so anything derived from item geometry (e.g. `Tabs.Indicator`) updates on its own.

**Caveat:** `onLayout` reports a position relative to the item's **parent**, whereas `getBoundingClientRect` is viewport-absolute. Ordering is therefore correct when the items share a parent — the standard structure. If a component must support items nested under different wrappers, it needs `measureLayout` against a common ancestor instead.

## Tests

Jest (`jest-expo` preset) + `@testing-library/react-native` **v14: `render`/`rerender`/`unmount` are async — always `await` them**. `UNSAFE_getByType` is gone; walk `view.container` manually if you must find a host node by prop (see `findNodeByProp` in `DialogRoot.test.tsx`).

Minimum per component: renders, controlled + uncontrolled value, `onXxxChange` reason + `eventDetails.cancel()`, disabled, accessibility state assertions.

## Verify before finishing

```sh
bunx turbo run typecheck test   # from repo root — must be fully green
```

Add a demo section to `apps/example/App.tsx` for every new component (plain StyleSheet, exercising the state-function styling).

## Gotchas already solved — don't re-fight these

- `useIsoLayoutEffect` must check `typeof window !== 'undefined'` (RN aliases `window`), **not** `typeof document`.
- The animation-frame scheduler is process-global, so `jest.setup.ts` calls `resetAnimationFrameScheduler()` in an `afterEach`. Without it, a frame scheduled by one test fires during a later one and surfaces as an `act(...)` warning in an unrelated file — which is why the warning only appears in a full run, never when that file runs alone.
- bun's isolated `.bun` node_modules requires the custom `transformIgnorePatterns` in `jest.config.js`; don't replace them with jest-expo defaults.
- Ambient globals live in `src/globals.d.ts` (no DOM lib, no @types/node). Extend that file instead of adding libs.
- `StyleSheet.absoluteFillObject` is untyped in RN 0.86 — use `StyleSheet.absoluteFill`.
- **`fireGestureHandler` quirks** (both cost real debugging time): it fills in any state transition you omit, and those synthesized events carry **0** for every coordinate — so send each position as an explicit `ACTIVE` event or the gesture reads as a jump to the origin. It also always appends an `END`, and React batches every handler it triggers into one render, so **mid-gesture state (`dragging`, `swiping`, `swipeMovement`) never commits and cannot be asserted**. Test the resting state instead; don't write a test that pretends otherwise.
- The move that *activates* a Pan arrives as `onStart`, not `onUpdate`. Handle both or the first movement is dropped.
