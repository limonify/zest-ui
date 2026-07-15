# @limonify/zest

> Base UI for React Native — headless, unstyled, accessible primitive components.

`@limonify/zest` is a React Native port of [Base UI](https://github.com/mui/base-ui) by the MUI team. It provides the same API, the same compound component pattern, and the same store-based state management — but adapted for iOS, Android, and web (via React Native).

**Zero style. Zero CSS. Zero default theme.** Just state, behavior, accessibility, and context. Bring your own styling — Uniwind, Tamagui, StyleSheet, NativeWind, whatever you prefer.

---

## Implementation Status

**Milestone 1 (shipped):** turborepo monorepo (bun workspaces), core infrastructure ported from upstream Base UI — store layer (`Store`/`ReactStore`/selectors), DOM-free hooks, `useRenderElement` + `mergeProps` render engine — plus a vertical component slice: **`Separator`**, **`Button`**, **`Checkbox`** (Root/Indicator), **`Dialog`** (Root/Trigger/Portal/Backdrop/Viewport/Popup/Title/Description/Close).

**Milestone 2 (shipped):** the forms tier — **`Switch`** (Root/Thumb), **`Toggle`**, **`ToggleGroup`**, **`Radio`** (Root/Indicator) + **`RadioGroup`**, **`CheckboxGroup`** (including the parent checkbox with mixed-state aggregation) — plus **`AlertDialog`**, which reuses the Dialog store and every Dialog part behind an `alertdialog` role that never dismisses on outside press.

**Milestone 3 (shipped):** the disclosure tier — **`Collapsible`** (Root/Trigger/Panel) and **`Accordion`** (Root/Item/Header/Trigger/Panel) — plus the `useTransitionStatus` port that establishes the React Native animation contract (see below).

**Milestone 4 (shipped):** the `CompositeList` visual-order infrastructure (see below) and **`Tabs`** (Root/List/Tab/Indicator/Panel) built on it, including upstream's automatic-fallback semantics and its `initial`/`disabled`/`missing` change reasons.

**Milestone 5 (shipped):** the positioning tier — the `useAnchorPositioning` port built on `@floating-ui/react-native`, plus **`Popover`** (Root/Trigger/Portal/Backdrop/Positioner/Popup/Arrow/Title/Description/Close) and **`Tooltip`** (Root/Trigger/Portal/Positioner/Popup/Arrow).

**Milestone 6 (shipped):** the list-popup tier — **`Menu`** (Root/Trigger/Portal/Backdrop/Positioner/Popup/Arrow/Item/Group/GroupLabel/Separator) and **`Select`** (Root/Trigger/Value/Icon/Portal/Backdrop/Positioner/Popup/List/Group/GroupLabel/Item/ItemText/ItemIndicator/Separator), both on `CompositeList`.

**Milestone 7 (shipped):** the gesture tier — **`Slider`** (Root/Value/Control/Track/Indicator/Thumb) and **`Drawer`** (Root/Trigger/Portal/Backdrop/Viewport/Popup/Title/Description/Close), both on `react-native-gesture-handler`.

**Current totals:** 22 components, 211 Jest tests (jest-expo + @testing-library/react-native), Expo example app in `apps/example` exercising every one.

Notes that supersede older sections of this document:

- **Part names follow real Base UI**, not Radix: `Dialog.Backdrop`/`Dialog.Popup` (not Overlay/Content), `Select.Positioner`/`Select.Popup`, `Tabs.Panel`/`Accordion.Panel` (not Content).
- **The zero-runtime-dependency goal did not survive Milestones 5–7, by decision.** zest now takes **`@floating-ui/react-native`** as a real dependency (collision-aware anchor positioning is not worth reimplementing) and **`react-native-gesture-handler`** as an *optional* peer dependency (a native gesture system cannot be reimplemented in JS; it stays optional so apps that use neither `Slider` nor `Drawer` need not configure the native module). `reanimated` is still not used and is not planned — see the animation contract below. `@gorhom/portal` is still not used.
- **Portals are RN `Modal`, not a PortalHost.** The in-house PortalHost this document once planned was dropped: a state-lifting portal host re-parents children into a different React tree, which drops every context between a `Popover.Root` and its `Popover.Popup`. `Modal` keeps children in the same tree, so contexts survive; it also contains accessibility focus and wires the Android back button to `onRequestClose` → the `escape-key` reason. Every popup-family `Portal` (Dialog, Drawer, Popover, Tooltip, Menu, Select) uses it with `transparent`, `animationType="none"`, and `statusBarTranslucent` — the last of which makes the Modal's origin match the screen coordinates `@floating-ui/react-native` measures with `sameScrollView: false`.
- **Testing is Jest** (jest-expo preset), not vitest.
- Components are **React 19-only** (ref-as-prop, no `forwardRef`) and live in `packages/zest/src/<component>/<part>/` with `index.parts.ts` namespace exports, mirroring upstream's layout.
- **`Field`, `Form`, and `Composite` (roving tabindex) are intentionally not ported.** React Native has no HTML form submission and no Tab key, so form controls omit `name`/`form`/`value`-for-submit props and the hidden `<input>`. One consequence: `Radio.Root` requires a `RadioGroup`, since without a hidden input it has no source of truth of its own.
- **zest never animates anything.** On the web, Base UI publishes CSS variables and lets CSS animate. The React Native counterpart: animated parts publish `transitionStatus` and their measured geometry (`height`/`width`) on the **state object**, and the consumer drives their own `Animated` value from `style={(state) => ...}` or `render={(props, state) => ...}`. Because nothing in React Native can report that a closing animation finished, **exit animations require `keepMounted`** — otherwise the panel unmounts the instant it closes. `apps/example` shows the whole pattern with RN's built-in `Animated`.
- See `packages/zest/CLAUDE.md` for the component porting recipe used to produce these milestones.

- **Ordered lists use `CompositeList`.** Upstream learns an item's *visual order* from the DOM (`compareDocumentPosition`, plus a `MutationObserver` to catch reorders). React Native has neither, so zest derives order from **registration order** — exact at mount, since React runs layout effects in child order — and then corrects it from **measured layout** once every item has reported an `onLayout`. Layout ordering is the real visual order, so it holds under `row-reverse`, wrapping, and absolute positioning, and it repairs the case registration order cannot see: children reordered without remounting. Items must spread the `onLayout` returned by `useCompositeListItem`. Select, Menu, and Toolbar will reuse this rather than each inventing a registry.

---

## Table of Contents

- [Philosophy](#philosophy)
- [Architecture](#architecture)
- [Package Structure](#package-structure)
- [Naming Conventions](#naming-conventions)
- [Component Catalog](#component-catalog)
- [Component API Patterns](#component-api-patterns)
- [Implementation Guide](#implementation-guide)
- [Phase 1: @limonify/zest/utils](#phase-1-liminifyzestutils)
- [Phase 2: Core Render Engine](#phase-2-core-render-engine)
- [Phase 3: Simple Components](#phase-3-simple-components)
- [Phase 4: Compound Components](#phase-4-compound-components)
- [Phase 5: Testing & Quality](#phase-5-testing--quality)
- [Dependencies](#dependencies)
- [Usage Examples](#usage-examples)
- [Excluded Components](#excluded-components)
- [FAQ](#faq)

---

## Philosophy

`@limonify/zest` follows the same principles as Base UI:

### Headless by Default

Components ship with zero styling. They manage behavior, state, accessibility, and keyboard interactions. Visual presentation is entirely the consumer's responsibility.

### Accessible

ARIA patterns are translated to React Native accessibility APIs. Each component comes with correct `accessibilityRole`, `accessibilityState`, focus management, and keyboard navigation.

### Composable

Complex widgets follow a compound component pattern with a `Root` that orchestrates state via React Context and child parts that consume it:

```tsx
<Select.Root>
  <Select.Trigger />
  <Select.Portal>
    <Select.Popup>
      <Select.Item />
    </Select.Popup>
  </Select.Portal>
</Select.Root>
```

### Store-Based State

Every stateful component uses `ReactStore` from Base UI's utils package. This provides:
- Controlled/uncontrolled state via `useControlledProp`
- Selector-based subscriptions with `store.useState(key)` — components only re-render when their specific slice of state changes
- Stable callbacks that don't break memoization
- Change event details with a reason system (`why did this state change?`)

### BYO Style

Since components are unstyled, they can be used with:
- **Uniwind**: `className="bg-blue-500 p-4"`
- **Tamagui**: `styled(Button, { backgroundColor: '$blue9' })`
- **StyleSheet**: `style={styles.button}`
- **NativeWind**: `className="bg-blue-500"`
- **Custom render prop**: `render={<MyOwnComponent />}`
- **Slot/asChild**: `<Button asChild><Link>...</Link></Button>`

---

## Architecture

```
┌─────────────────────────────────────────────┐
│             @limonify/zest                   │
│  Single package, monorepo-ready              │
├─────────────────────────────────────────────┤
│                                             │
│  ┌──────────────────────────────────────┐   │
│  │         @limonify/zest/store         │   │
│  │  ─ ReactStore (Base UI port)        │   │
│  │  ─ useControlledProp                 │   │
│  │  ─ useSyncedValues                   │   │
│  │  ─ useContextCallback               │   │
│  └────────────┬─────────────────────────┘   │
│               │                             │
│  ┌────────────▼─────────────────────────┐   │
│  │         @limonify/zest/hooks         │   │
│  │  ─ useControlled, useId,             │   │
│  │  ─ useStableCallback, useMergedRefs  │   │
│  │  ─ useIsoLayoutEffect, useOnMount    │   │
│  │  ─ useAnimationFrame, useTimeout     │   │
│  └────────────┬─────────────────────────┘   │
│               │                             │
│  ┌────────────▼─────────────────────────┐   │
│  │     @limonify/zest/components       │   │
│  │  ─ Button, Input, Dialog, Select...  │   │
│  │  ─ Each = Store + Render + Context   │   │
│  │  ─ Positioning, focus trap,          │   │
│  │    gesture handling, accessibility   │   │
│  │    → custom implementation           │   │
│  │    → @rn-primitives as reference     │   │
│  └────────────┬─────────────────────────┘   │
│                                             │
│  Styling (consumer choice):                  │
│  ┌──────────┐ ┌────────┐ ┌───────────┐     │
│  │ Uniwind  │ │Tamagui │ │StyleSheet │     │
│  └──────────┘ └────────┘ └───────────┘     │
└─────────────────────────────────────────────┘
```

### Key Design Decision

`@limonify/zest` does NOT depend on `@rn-primitives` as a runtime dependency. Instead, it **references `@rn-primitives` source code as a reference** for implementing the hard parts — positioning, focus trapping, keyboard navigation, and gesture handling. Every pattern is reimplemented in `@limonify/zest`'s own codebase with full control.

| Hard Part | @rn-primitives shows how | @limonify/zest implements |
|---|---|---|
| Focus trapping in modals | `@rn-primitives/dialog` | Custom with RN `Modal` + focus guards |
| Positioning with collision detection | `@rn-primitives/popover` | Custom using `onLayout` + `useWindowDimensions` |
| Keyboard navigation (arrow keys) | `@rn-primitives/select` | Custom using RN event system |
| Cross-platform accessibility mapping | All primitives | Custom ARIA → RN mapping |
| Gesture handling (slider, swipe) | `@rn-primitives/slider` | Custom via `react-native-gesture-handler` |

**What is a dependency vs what is a reference?**

| Status | Package | Reason |
|---|---|---|
| ✅ Dependency | `@floating-ui/react-native` | Collision-aware anchor positioning (flip/shift/arrow). Used by Popover/Tooltip/Menu/Select via `useAnchorPositioning` |
| ✅ Optional peer dependency | `react-native-gesture-handler` | Native gesture system, can't reimplement in JS. Required only by `Slider` and `Drawer`, hence optional |
| ❌ Not used | `react-native-reanimated` | zest never animates — parts publish state and the consumer animates, with whatever library they already use |
| ❌ Not used | `@gorhom/portal` | Portals are RN `Modal`: it keeps children in the same React tree, so contexts survive the portal boundary. A state-lifting PortalHost would not |
| 📖 Reference only | `@rn-primitives` | Study positioning, focus trap, accessibility patterns — implement our own version with full control |

Simple components (Button, Input, Text, Separator) use React Native core elements directly (Pressable, TextInput, Text, View) — no external dependency or reference needed.

---

## Package Structure

```
@limonify/zest/
├── src/
│   ├── store/                    # Base UI ReactStore port
│   │   ├── ReactStore.ts
│   │   ├── ReactStore.test.ts
│   │   └── index.ts
│   │
│   ├── hooks/                    # Generic React hooks
│   │   ├── useControlled.ts
│   │   ├── useId.ts
│   │   ├── useStableCallback.ts
│   │   ├── useMergedRefs.ts
│   │   ├── useIsoLayoutEffect.ts
│   │   ├── useOnMount.ts
│   │   ├── usePreviousValue.ts
│   │   ├── useAnimationFrame.ts
│   │   ├── useTimeout.ts
│   │   ├── useInterval.ts
│   │   ├── useForcedRerendering.ts
│   │   ├── useEnhancedClickHandler.ts
│   │   ├── index.ts
│   │
│   ├── components/
│   │   ├── button/
│   │   │   ├── Button.tsx
│   │   │   ├── Button.test.tsx
│   │   │   ├── Button.types.ts
│   │   │   └── index.ts
│   │   │
│   │   ├── input/
│   │   │   ├── Input.tsx
│   │   │   ├── Input.test.tsx
│   │   │   ├── Input.types.ts
│   │   │   └── index.ts
│   │   │
│   │   ├── dialog/
│   │   │   ├── DialogRoot.tsx
│   │   │   ├── DialogTrigger.tsx
│   │   │   ├── DialogPortal.tsx
│   │   │   ├── DialogBackdrop.tsx
│   │   │   ├── DialogPopup.tsx
│   │   │   ├── DialogTitle.tsx
│   │   │   ├── DialogDescription.tsx
│   │   │   ├── DialogClose.tsx
│   │   │   ├── DialogContext.ts
│   │   │   ├── Dialog.types.ts
│   │   │   ├── Dialog.test.tsx
│   │   │   └── index.ts
│   │   │
│   │   ├── bottom-sheet/          # Mobile-native (not in Base UI)
│   │   │   ├── BottomSheet.tsx
│   │   │   ├── BottomSheet.test.tsx
│   │   │   └── index.ts
│   │   │
│   │   ├── segmented-control/     # Mobile-native (not in Base UI)
│   │   │   ├── SegmentedControl.tsx
│   │   │   ├── SegmentedControl.test.tsx
│   │   │   └── index.ts
│   │   │
│   │   └── ... (all other components)
│   │
│   ├── slot/                     # asChild pattern
│   │   ├── Slot.tsx
│   │   └── index.ts
│   │
│   ├── use-render/               # useRenderElement RN port
│   │   ├── useRenderElement.ts
│   │   └── index.ts
│   │
│   ├── portal/
│   │   ├── Portal.tsx
│   │   └── index.ts
│   │
│   ├── utils/                    # Internal component utilities
│   │   ├── mergeProps.ts
│   │   ├── createChangeEventDetails.ts
│   │   ├── reasons.ts
│   │   ├── owner.ts
│   │   ├── addEventListener.ts
│   │   ├── visuallyHidden.ts
│   │   ├── platform/
│   │   └── index.ts
│   │
│   ├── types/
│   │   ├── common.ts             # BaseUIComponentProps, generics
│   │   └── index.ts
│   │
│   └── index.ts                  # Barrel export (all public API)
│
├── __tests__/                    # Integration tests
├── __examples__/                 # Usage examples for docs
│
├── package.json
├── tsconfig.json
├── CLAUDE.md                     # AI agent instructions
└── README.md                     # You are here
```

---

## Naming Conventions

### Package & File Naming

| Item | Convention | Example |
|---|---|---|
| npm package | `kebab-case` with scope | `@limonify/zest` |
| Component directories | `kebab-case` | `alert-dialog/`, `number-field/` |
| Component files | `PascalCase.tsx` | `Button.tsx`, `DialogRoot.tsx` |
| Hook files | `camelCase.ts` with `use` prefix | `useControlled.ts` |
| Util files | `camelCase.ts` | `mergeProps.ts` |
| Store files | `PascalCase.ts` | `ReactStore.ts` |
| Type files | `camelCase.types.ts` | `button.types.ts` |
| Test files | `*.test.tsx` | `Button.test.tsx` |
| Barrel exports | `index.ts` | re-exports all public API |
| Context files | `PascalCase` + `Context.ts` | `DialogContext.ts` |

### Component Export Naming

**Every single component name matches Base UI exactly. Zero changes.** The API is identical to what web developers know from Base UI. Internal render elements (Pressable, TextInput, View) are implementation details — the consumer sees `Button`, `Input`, `Dialog`, never `Pressable` or `TextInput`.

| Base UI | @limonify/zest | Status |
|---|---|---|
| `Button` | `Button` | Ported (same name) |
| `Input` | `Input` | Ported (same name) |
| `Checkbox` | `Checkbox` | Ported (same name) |
| `CheckboxGroup` | `CheckboxGroup` | Ported (same name) |
| `Radio` | `Radio` | Ported (same name) |
| `RadioGroup` | `RadioGroup` | Ported (same name) |
| `Switch` | `Switch` | Ported (same name) |
| `Toggle` | `Toggle` | Ported (same name) |
| `ToggleGroup` | `ToggleGroup` | Ported (same name) |
| `Slider` | `Slider` | Ported (same name) |
| `Select` | `Select` | Ported (same name) |
| `NumberField` | `NumberField` | Ported (same name) |
| `OTPField` | `OTPField` | Ported (same name) |
| `Field` | `Field` | Ported (same name) |
| `Fieldset` | `Fieldset` | Ported (same name) |
| `Form` | `Form` | Ported (same name) |
| `Separator` | `Separator` | Ported (same name) |
| `Progress` | `Progress` | Ported (same name) |
| `Avatar` | `Avatar` | Ported (same name) |
| `Dialog` | `Dialog` | Ported (same name) |
| `AlertDialog` | `AlertDialog` | Ported (same name) |
| `Drawer` | `Drawer` | Ported (same name) |
| `Popover` | `Popover` | Ported (same name) |
| `Tooltip` | `Tooltip` | Ported (same name) |
| `Toast` | `Toast` | Ported (same name) |
| `Menu` | `Menu` | Ported (same name) |
| `Tabs` | `Tabs` | Ported (same name) |
| `Accordion` | `Accordion` | Ported (same name) |
| `Collapsible` | `Collapsible` | Ported (same name) |

**Zero name changes. Every component keeps its Base UI name.**

### Component Internal Structure

Simple components export a single component:

```tsx
// button/index.ts
export { Button } from './Button'
export type { ButtonProps } from './Button.types'
```

Compound components export a namespace:

```tsx
// dialog/index.ts
export { DialogRoot as Root } from './DialogRoot'
export { DialogTrigger as Trigger } from './DialogTrigger'
export { DialogPortal as Portal } from './DialogPortal'
export { DialogBackdrop as Backdrop } from './DialogBackdrop'
export { DialogViewport as Viewport } from './DialogViewport'
export { DialogPopup as Popup } from './DialogPopup'
export { DialogTitle as Title } from './DialogTitle'
export { DialogDescription as Description } from './DialogDescription'
export { DialogClose as Close } from './DialogClose'
export type { DialogProps } from './Dialog.types'

// Consumer import:
import { Dialog } from '@limonify/zest'
// Use: <Dialog.Root>, <Dialog.Trigger>, <Dialog.Popup>
```

---

## Component Catalog

### Tier 1 — Forms & Input (15 components)

These are the simplest components. Most use React Native core elements directly.

| Component | Render Element | Has Store | Has Context | Group/Peer Context | Depends on |
|---|---|---|---|---|---|
| `Button` | `Pressable` | — | — | — | Core RN |
| `Input` | `TextInput` | — | yes (Field) | — | Core RN |
| `Text` | `Text` | — | — | — | Core RN |
| `Field` | `View` + context | — | yes (provider) | — | Core RN |
| `Fieldset` | `View` | — | yes (provider) | — | Core RN |
| `Form` | `View` | yes (form state) | yes (provider) | — | Core RN |
| `Checkbox` | `Pressable` | yes | yes | `CheckboxGroup` | Core RN |
| `CheckboxGroup` | `View` | yes | yes (provider) | — | Core RN |
| `Radio` | `Pressable` | yes | yes | `RadioGroup` | Core RN |
| `RadioGroup` | `View` | yes | yes (provider) | — | Core RN |
| `Switch` | RN `Switch` | — | — | — | Core RN |
| `Toggle` | `Pressable` | yes | yes | `ToggleGroup` | Core RN |
| `ToggleGroup` | `View` | yes | yes (provider) | — | Core RN |
| `Slider` | PanResponder / Gesture Handler | yes | — | — | Core RN |
| `NumberField` | `TextInput` + buttons | yes | yes (Field) | — | Core RN |
| `OTPField` | `TextInput` group | yes | yes (Field) | — | Core RN |
| `Separator` | `View` | — | — | — | Core RN |
| `Progress` | `View` | yes | — | — | Core RN |
| `Avatar` | `Image` + `Text` | — | — | — | Core RN |

### Tier 2 — Overlays & Dialogs (8 components)

These are complex compound components. They reference `@rn-primitives` source patterns for the hard parts (positioning, focus trap, scroll management) but implement everything in-house with Base UI's store pattern on top.

| Component | Render Engine | State Store | Positioning | Focus Trap |
|---|---|---|---|---|---|
| `Dialog` | Custom (RN `Modal`) | ReactStore | RN `Modal` | Native |
| `AlertDialog` | Custom (RN `Modal`) | ReactStore | RN `Modal` | Native |
| `Drawer` | Custom (RN `Modal` + `View`) | ReactStore | Absolute + `Modal` | Native |
| `Popover` | Custom (`View` + portal) | ReactStore | `onLayout` + `useWindowDimensions` | Custom |
| `Tooltip` | Custom (`View` + portal) | ReactStore | `onLayout` | — |
| `Toast` | Custom (`View` + portal) | ReactStore | Absolute | — |
| `Menu` | Custom (`ScrollView` + context) | ReactStore | `onLayout` + `Modal` | Custom |
| `Select` | Custom (`ScrollView` + context) | ReactStore | `onLayout` + `Modal` | Custom |

**Dialog sub-components:**
```
Dialog.Root
Dialog.Trigger
Dialog.Portal
Dialog.Backdrop
Dialog.Viewport
Dialog.Popup
Dialog.Title
Dialog.Description
Dialog.Close
```

**Select sub-components:**
```
Select.Root
Select.Trigger
Select.Value
Select.Icon
Select.Portal
Select.Backdrop
Select.Positioner
Select.Popup
Select.ScrollUpArrow
Select.List
Select.Group
Select.GroupLabel
Select.Item
Select.ItemText
Select.ItemIndicator
Select.ScrollDownArrow
Select.Separator
```

### Tier 3 — Navigation & Layout (6 components)

| Component | Render Engine | State Store | Notes |
|---|---|---|---|---|
| `Tabs` | Custom (`View` + `ScrollView`) | ReactStore | Scrollable tab bar |
| `Accordion` | Custom (`View` + `LayoutAnimation`) | ReactStore | `LayoutAnimation` |
| `Collapsible` | Custom (`View` + `LayoutAnimation`) | ReactStore | `LayoutAnimation` |

**Tabs sub-components:**
```
Tabs.Root
Tabs.List
Tabs.Tab
Tabs.Indicator
Tabs.Panel
```

**Accordion sub-components:**
```
Accordion.Root
Accordion.Item
Accordion.Header
Accordion.Trigger
Accordion.Panel
```

### Tier 4 — Utility

| Export | Description | Source |
|---|---|---|---|
| `Portal` | Render children at a higher DOM level | Custom (RN `Modal` + absolute `View`) |
| `Slot` / `asChild` | Merge props and refs onto child element | Custom (Radix slot pattern) |
| `DirectionProvider` | LTR/RTL direction context | Custom (React Context) |
| `mergeProps` | Deep prop merging | Base UI port |
| `useRenderElement` | Headless rendering helper | Base UI port (RN version) |

### Tier 5 — Mobile-Native Additions (not in Base UI)

These components are React Native-specific. They don't exist in Base UI but fill gaps in the mobile ecosystem.

| Component | Internal Implementation | Notes |
|---|---|---|---|
| `BottomSheet` | Custom (PanResponder + reanimated) | Snap points, pan gesture, handle indicator |
| `SegmentedControl` | Custom (Pressable group) | iOS-style segmented control |

### Exposed Hooks

| Hook | Source | Purpose |
|---|---|---|
| `useControlled` | `@base-ui/utils` | Controlled/uncontrolled state |
| `useId` | `@base-ui/utils` | Unique ID generation |
| `useStableCallback` | `@base-ui/utils` | Stable callback reference |
| `useMergedRefs` | `@base-ui/utils` | Merge multiple refs |
| `useIsoLayoutEffect` | `@base-ui/utils` | Isomorphic `useLayoutEffect` |
| `useOnMount` | `@base-ui/utils` | Run effect on mount only |
| `usePreviousValue` | `@base-ui/utils` | Track previous value |
| `useAnimationFrame` | `@base-ui/utils` | requestAnimationFrame hook |
| `useTimeout` | `@base-ui/utils` | setTimeout hook |
| `useInterval` | `@base-ui/utils` | setInterval hook |
| `useForcedRerendering` | `@base-ui/utils` | Force re-render |

### Exported Store

| Export | Purpose |
|---|---|
| `ReactStore` (class) | Create a store instance |
| `ReactStore.useState(key)` | Subscribe to state slice |
| `ReactStore.useControlledProp` | Sync external prop with store |
| `ReactStore.useSyncedValues` | Sync multiple values |
| `ReactStore.useContextCallback` | Stable callback via context |
| `ReactStore.setOpen(value)` | State setter |
| `ReactStore.getState()` | Synchronous state read |

---

### Excluded Components

These Base UI components will NOT be ported. They either don't fit the mobile interaction model or have better native alternatives.

| Component | Reason for Exclusion |
|---|---|
| `ContextMenu` | Right-click menu doesn't exist on mobile. Native `UIContextMenu` (iOS) / `PopupMenu` (Android) are the platform-appropriate patterns. |
| `PreviewCard` | Hover card. Mobile has no hover interaction. A long-press equivalent would be a different UX. |
| `Menubar` | Desktop-only navigation pattern. Mobile uses bottom tabs, hamburger menus, or tab bars. |
| `NavigationMenu` | Desktop multi-level hover menu. Mobile navigation uses different patterns (stack navigators, drawers). |
| `Meter` | Rarely used on mobile. Not worth the port effort. |
| `ScrollArea` | React Native has native scrolling (`ScrollView`, `FlatList`). No custom scroll area needed. |
| `CSPProvider` | Content Security Policy is a web-only concept. |
| `Combobox` | Mobile search pattern is different (search screen + `FlatList`). Not a 1:1 port. |
| `Autocomplete` | Same as Combobox. Mobile uses search-as-you-type with native keyboard. |
| `Toolbar` | Desktop toolbar pattern. Mobile uses bottom action bars or context menus. |

### Mobile-Native Additions (not in Base UI)

These components don't exist in Base UI but are essential for a React Native library:

| Component | Purpose |
|---|---|
| `BottomSheet` | Draggable bottom sheet with snap points (iOS-style) |
| `SegmentedControl` | iOS-style segmented control for tab/option switching |

---

### Full Component Count Summary

```
Base UI (36+ components)
  ├── Ported (same name):  29  (Button, Input, Dialog, Select, Tabs...)
  ├── Excluded:            10  (ContextMenu, PreviewCard, Menubar...)
  └── Added (mobile-only): +2  (BottomSheet, SegmentedControl)

@limonify/zest total:      31 components
                           29 Base UI-compatible + 2 mobile-native
```

**29 Base UI component = 29 exact same name.** Zero naming changes.

---

## Component API Patterns

### Simple Component: Button

```tsx
interface ButtonProps extends BaseUIComponentProps<'button', Button.State> {
  disabled?: boolean
  onPress?: (event: GestureResponderEvent) => void
}

namespace Button {
  export interface State {
    disabled: boolean
    pressed: boolean
  }
  export type Props = ButtonProps
}
```

**Implementation pattern:**

```tsx
'use client'

import * as React from 'react'
import { Pressable, type ViewRef } from 'react-native'
import { useRenderElement } from '../../use-render'
import type { BaseUIComponentProps } from '../../types'

export interface ButtonProps
  extends BaseUIComponentProps<'button', Button.State> {}

export namespace Button {
  export interface State {
    disabled: boolean
    pressed: boolean
  }
  export type Props = ButtonProps
}

const ButtonImpl = React.forwardRef<ViewRef, ButtonProps>(
  (props, forwardedRef) => {
    const {
      render,
      disabled = false,
      onPress,
      ...otherProps
    } = props

    const [pressed, setPressed] = React.useState(false)

    const state: Button.State = React.useMemo(
      () => ({ disabled, pressed }),
      [disabled, pressed],
    )

    const { renderElement } = useRenderElement({
      props: {
        ...otherProps,
        disabled,
        onPress,
        onPressIn: (e: GestureResponderEvent) => {
          setPressed(true)
          otherProps.onPressIn?.(e)
        },
        onPressOut: (e: GestureResponderEvent) => {
          setPressed(false)
          otherProps.onPressOut?.(e)
        },
        accessibilityRole: 'button',
        accessibilityState: { disabled },
      },
      ref: forwardedRef,
      state,
      render: render ?? <Pressable />,
    })

    return renderElement
  },
)

ButtonImpl.displayName = 'Button'
export { ButtonImpl as Button }
```

### Compound Component: Dialog

```tsx
// DialogContext.ts
interface DialogContextValue {
  store: ReactStore<DialogState>
  open: boolean
  onOpenChange: (open: boolean) => void
}

const DialogContext = React.createContext<DialogContextValue | null>(null)

function useDialogContext() {
  const context = React.useContext(DialogContext)
  if (!context) {
    throw new Error('Dialog sub-components must be used within <Dialog.Root>')
  }
  return context
}

// DialogRoot.tsx
interface DialogRootProps {
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean, event?: any) => void
  children?: React.ReactNode
}

function DialogRoot(props: DialogRootProps) {
  const { open: openProp, defaultOpen = false, onOpenChange, children } = props

  const store = React.useMemo(() => {
    const store = new ReactStore({ open: defaultOpen })
    store.useControlledProp('open', openProp)
    store.useContextCallback('onOpenChange', onOpenChange)
    return store
  }, [])

  const contextValue = React.useMemo(
    () => ({
      store,
      open: store.useState('open'),
      onOpenChange: (open: boolean) => {
        store.setOpen(open)
      },
    }),
    [store],
  )

  return (
    <DialogContext.Provider value={contextValue}>
      {typeof children === 'function' ? children({ open: contextValue.open }) : children}
    </DialogContext.Provider>
  )
}

// DialogTrigger.tsx
interface DialogTriggerProps extends BaseUIComponentProps<'button', {}> {}

function DialogTrigger(props: DialogTriggerProps) {
  const { onOpenChange } = useDialogContext()
  const { render, ...otherProps } = props

  const { renderElement } = useRenderElement({
    props: {
      ...otherProps,
      onPress: (e: GestureResponderEvent) => {
        onOpenChange(true)
        otherProps.onPress?.(e)
      },
      accessibilityRole: 'button',
      accessibilityState: { expanded: true },
    },
    ref: forwardedRef,
    state: {},
    render: render ?? <Pressable />,
  })

  return renderElement
}
```

### Controlled/Uncontrolled Pattern

Every stateful component supports both controlled and uncontrolled usage:

```tsx
// Uncontrolled (internal state)
<Select.Root defaultValue={{ value: 'apple', label: 'Apple' }}>
  ...
</Select.Root>

// Controlled (external state)
<Select.Root
  value={selectedFruit}
  onValueChange={(option) => setSelectedFruit(option)}
>
  ...
</Select.Root>
```

This is implemented via `ReactStore.useControlledProp`:

```tsx
const store = new ReactStore({ value: defaultValue })
store.useControlledProp('value', controlledValue)
```

### Render Prop Pattern

Every component supports a `render` prop for complete control over rendering:

```tsx
<Button
  render={
    <Pressable style={({ pressed }) => ({
      opacity: pressed ? 0.8 : 1,
      backgroundColor: '#007AFF',
      padding: 16,
      borderRadius: 12,
    })}>
      <Text style={{ color: 'white' }}>Custom Button</Text>
    </Pressable>
  }
/>
```

### asChild / Slot Pattern

The `asChild` prop merges the component's props and ref onto a single child element:

```tsx
<Dialog.Trigger asChild>
  <Pressable className="bg-blue-500 p-4 rounded-xl">
    <Text className="text-white">Open</Text>
  </Pressable>
</Dialog.Trigger>
```

Implementation uses the `Slot` component (Radix pattern):

```tsx
function Slot(props: SlotProps) {
  const child = React.Children.only(props.children)
  return React.cloneElement(child, {
    ...mergeProps(child.props, omit(props, 'children')),
    ref: mergeRefs(child.ref, props.ref),
  })
}
```

### Change Event Details (Reason System)

Base UI passes a "reason" for every state change, so consumers can distinguish between different types of interactions:

```tsx
<Select.Root
  onValueChange={(value, event) => {
    if (event.reason === 'selection') {
      // User tapped an item
    } else if (event.reason === 'keyboard') {
      // User pressed Enter
    }
  }}
/>
```

---

## DOM to React Native Mapping

Base UI is a web library. Here is the mapping used for every component:

### Element Mapping

| Web (Base UI) | React Native |
|---|---|
| `<div>` | `<View>` |
| `<button>` | `<Pressable>` |
| `<span>` | `<Text>` |
| `<input>` | `<TextInput>` |
| `<label>` | `<Text` with `accessibilityRole="label">` |
| `<img>` | `<Image>` |
| `<ul>` / `<ol>` | `<View>` (with accessibilityRole="menu") |
| `<li>` | `<View>` (with accessibilityRole="menuitem") |
| `<nav>` | `<View>` (with accessibilityRole="menu") |
| `<dialog>` | RN `<Modal>` |
| `<select>` | Custom trigger + `FlatList` |
| `<option>` | `<Pressable>` |

### Event Mapping

| Web Event | React Native |
|---|---|
| `onClick` | `onPress` |
| `onMouseEnter` / `onMouseLeave` | `onHoverIn` / `onHoverOut` (iOS 17+ / Android) |
| `onFocus` / `onBlur` | `onFocus` / `onBlur` (TextInput) |
| `onKeyDown` | `onKeyDown` (TextInput) |
| `onChange` | `onChangeText` (TextInput) |
| `onScroll` | `onScroll` (ScrollView) |
| `onPointerDown` | `onPressIn` |
| `onPointerUp` | `onPressOut` |

### ARIA → Accessibility Mapping

| Web ARIA | React Native |
|---|---|
| `role="button"` | `accessibilityRole="button"` |
| `role="dialog"` | `accessibilityRole="dialog"` |
| `aria-label` | `accessibilityLabel` |
| `aria-describedby` | `accessibilityHint` |
| `aria-disabled` | `accessibilityState={{ disabled: true }}` |
| `aria-expanded` | `accessibilityState={{ expanded: true }}` |
| `aria-selected` | `accessibilityState={{ selected: true }}` |
| `aria-checked` | `accessibilityState={{ checked: true }}` |
| `tabIndex` | `focusable` |
| `aria-modal` | `accessibilityViewIsModal` |
| `aria-live` | `accessibilityLiveRegion` |

### Data Attributes → State

Web uses `data-*` attributes for styling hooks:
```html
<button data-disabled="" data-pressed="" data-state="open">
```

React Native has no data attributes. Instead:
```tsx
// Components expose state via accessibilityState and render prop:
state = { disabled: true, pressed: true }

// Consumer uses render prop or style mapping:
<Button
  style={(state) => ({
    opacity: state.disabled ? 0.5 : 1,
    transform: [{ scale: state.pressed ? 0.96 : 1 }],
  })}
/>
```

---

## Dependencies

### Runtime Dependencies

Milestones 1–4 shipped with zero runtime dependencies. Milestones 5–7 added two, deliberately — anchor positioning and native gestures are the two things not worth (or not possible) reimplementing in JS:

```json
{
  "dependencies": {
    "@floating-ui/react-native": "^0.10.10"
  },
  "peerDependencies": {
    "react": ">=19.0.0",
    "react-native": ">=0.79.0",
    "react-native-gesture-handler": ">=2.0.0"
  },
  "peerDependenciesMeta": {
    "react-native-gesture-handler": { "optional": true }
  }
}
```

`react-native-gesture-handler` is an **optional** peer: only `Slider` and `Drawer` import it, so an app using neither should not have to install and configure a native module. Both require the app to be wrapped in `<GestureHandlerRootView>`.

### Dev Dependencies

```json
{
  "devDependencies": {
    "typescript": "^5.6",
    "jest": "^29.x",
    "jest-expo": "~57.x",
    "@testing-library/react-native": "^12.x",
    "react": "^19.x",
    "react-native": "^0.76.x",
    "expo": "^52.x"
  }
}
```

---

## Usage Examples

### With Uniwind (Tailwind v4)

```tsx
import { Button, Dialog, Input } from '@limonify/zest'

function LoginScreen() {
  const [open, setOpen] = React.useState(false)

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <Button className="bg-blue-500 px-6 py-3 rounded-xl active:bg-blue-600">
          <Text className="text-white font-semibold">Login</Text>
        </Button>
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Backdrop className="bg-black/50 flex-1" />
        <Dialog.Popup className="bg-white mx-4 my-auto rounded-2xl p-6">
          <Dialog.Title className="text-xl font-bold mb-2">
            Sign In
          </Dialog.Title>
          <Dialog.Description className="text-gray-500 mb-4">
            Enter your credentials to continue.
          </Dialog.Description>

          <Field name="email">
            <Field.Label className="text-sm font-medium mb-1">
              Email
            </Field.Label>
            <Input
              placeholder="you@example.com"
              className="border border-gray-200 rounded-lg p-3"
            />
            <Field.Error className="text-red-500 text-sm mt-1" />
          </Field>

          <Dialog.Close asChild>
            <Button className="bg-blue-500 p-3 rounded-xl mt-4">
              <Text className="text-white text-center font-semibold">
                Submit
              </Text>
            </Button>
          </Dialog.Close>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
```

### With Tamagui

```tsx
import { styled } from 'tamagui'
import { Button, Dialog, Input } from '@limonify/zest'

const StyledButton = styled(Button, {
  backgroundColor: '$blue9',
  paddingVertical: '$4',
  paddingHorizontal: '$6',
  borderRadius: '$3',

  variants: {
    variant: {
      primary: { backgroundColor: '$blue9' },
      destructive: { backgroundColor: '$red9' },
      outline: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: '$blue9',
      },
    },
    size: {
      sm: { paddingVertical: '$2', paddingHorizontal: '$3' },
      md: { paddingVertical: '$4', paddingHorizontal: '$5' },
      lg: { paddingVertical: '$5', paddingHorizontal: '$7' },
    },
  },

  defaultVariants: {
    variant: 'primary',
    size: 'md',
  },
})

const StyledDialogPopup = styled(Dialog.Popup, {
  backgroundColor: '$background',
  borderRadius: '$5',
  padding: '$6',
  margin: '$4',
})

function App() {
  return (
    <Dialog.Root>
      <Dialog.Trigger asChild>
        <StyledButton variant="outline">Open Dialog</StyledButton>
      </Dialog.Trigger>
      <Dialog.Portal>
        <StyledDialogPopup>
          <Dialog.Title>Welcome</Dialog.Title>
          <Dialog.Description>
            This dialog is styled with Tamagui.
          </Dialog.Description>
          <Dialog.Close asChild>
            <StyledButton>Close</StyledButton>
          </Dialog.Close>
        </StyledDialogPopup>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
```

### With StyleSheet

```tsx
import { StyleSheet, View } from 'react-native'
import { Button, Tabs, Slider } from '@limonify/zest'

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#007AFF',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  buttonPressed: {
    backgroundColor: '#0056CC',
    transform: [{ scale: 0.97 }],
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  tab: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: '#007AFF',
  },
})

function SettingsScreen() {
  return (
    <View style={{ padding: 16 }}>
      <Button
        style={({ pressed, disabled }) => [
          styles.button,
          pressed && styles.buttonPressed,
          disabled && styles.buttonDisabled,
        ]}
        disabled={isSubmitting}
        onPress={handleSave}
      >
        <Text style={styles.buttonText}>Save</Text>
      </Button>

      <Slider
        value={brightness}
        min={0}
        max={100}
        onValueChange={setBrightness}
        style={{ marginTop: 24 }}
      />
    </View>
  )
}
```

### With Render Prop (Full Custom Control)

```tsx
<Select.Root value={selected} onValueChange={setSelected}>
  <Select.Trigger
    render={
      <View style={customTriggerStyle}>
        <Text>{selected?.label || 'Select...'}</Text>
        <ChevronDown size={16} />
      </View>
    }
  />
  <Select.Portal>
    <Select.Popup>
      {items.map((item) => (
        <Select.Item
          key={item.value}
          value={item.value}
          label={item.label}
          render={
            <View style={({ active }) => ({
              padding: 12,
              backgroundColor: active ? '#E8F0FE' : 'white',
            })}>
              <Text>{item.label}</Text>
              <Select.ItemIndicator>
                <CheckIcon />
              </Select.ItemIndicator>
            </View>
          }
        />
      ))}
    </Select.Popup>
  </Select.Portal>
</Select.Root>
```

---

## Implementation Guide

### Phase 1: @limonify/zest/utils (3-4 days)

Port the Base UI utility layer. This is mostly DOM-independent and can be copied directly with minimal changes.

**Files to create:**

```
src/store/ReactStore.ts
src/store/index.ts
src/hooks/useControlled.ts
src/hooks/useId.ts
src/hooks/useStableCallback.ts
src/hooks/useMergedRefs.ts
src/hooks/useIsoLayoutEffect.ts
src/hooks/useOnMount.ts
src/hooks/usePreviousValue.ts
src/hooks/useAnimationFrame.ts
src/hooks/useTimeout.ts
src/hooks/useInterval.ts
src/hooks/useForcedRerendering.ts
src/hooks/index.ts
```

**Source:** Copy from `@base-ui/utils` at `packages/utils/src/store/ReactStore.ts` and `packages/utils/src/*.ts`.

**Changes needed:**
- Remove any `document` / `window` references in platform utils
- Replace `useSyncExternalStore` import path if needed
- `owner.ts`: `ownerDocument` → `Platform.OS` check
- `visuallyHidden.ts`: Return RN StyleSheet instead of CSS
- `addEventListener.ts`: Keep as-is (it's generic)
- `useScrollLock.ts`: Replace with RN keyboard avoidance / body scroll alternative
- `useEnhancedClickHandler.ts`: Adapt for `onPress` pattern

**Verification:** Unit tests pass for all hooks and store.

### Phase 2: Core Render Engine (2 days)

Create the rendering infrastructure that all components use.

**Files:**

```
src/slot/Slot.tsx                    # asChild pattern
src/slot/index.ts
src/use-render/useRenderElement.ts   # RN version of Base UI's useRenderElement
src/use-render/index.ts
src/portal/Portal.tsx                # in-house context-based PortalHost (deferred; Dialog uses RN Modal)
src/portal/index.ts
src/utils/mergeProps.ts
src/utils/createChangeEventDetails.ts
src/utils/reasons.ts
src/utils/owner.ts
src/utils/addEventListener.ts
src/utils/platform/index.ts
src/types/common.ts
src/types/index.ts
```

**useRenderElement contract:**

```tsx
interface UseRenderElementOptions<E extends React.ElementType, State> {
  props: Record<string, any>
  ref: React.Ref<any>
  state: State
  render: React.ReactElement
}

function useRenderElement<E extends React.ElementType, State>(
  options: UseRenderElementOptions<E, State>,
): {
  renderElement: React.ReactNode
}
```

**Responsibilities:**
1. Merge internal component props with user-provided props (`mergeProps`)
2. Apply accessibility state based on component state
3. Handle `render` prop: if provided, clone and inject props into it
4. Handle `asChild`: use Slot to merge props onto child
5. Merge refs (forwarded ref + internal ref)

### Phase 3: Simple Components (5-6 days)

One component at a time, starting from the simplest.

**Order of implementation:**

1. **`Separator`** (0.5 day) — Simplest. Just a `<View>`.
2. **`Text`** (0.5 day) — Thin wrapper around RN `<Text>`.
3. **`Button`** (1 day) — `Pressable` wrapper with pressed state.
4. **`Input`** (1 day) — `TextInput` wrapper with Field context.
5. **`Progress`** (0.5 day) — Width-based `View`.
6. **`Avatar`** (0.5 day) — `Image` + fallback `Text`.
7. **`Switch`** (0.5 day) — RN `Switch` wrapper.
8. **`Checkbox`** + **`CheckboxGroup`** (1 day) — Pressable + store.
9. **`Radio`** + **`RadioGroup`** (1 day) — Pressable + store.
10. **`Toggle`** + **`ToggleGroup`** (1 day) — Pressable + store.
11. **`Slider`** (1-2 days) — Gesture handler + store.
12. **`NumberField`** (1 day) — TextInput + buttons + store.
13. **`OTPField`** (1 day) — TextInput group + store.
14. **`Field`** + **`Fieldset`** + **`Form`** (2 days) — Context providers.

**Component template:**

```tsx
'use client'

import * as React from 'react'
import { type ViewRef /* or TextInputRef, etc */ } from 'react-native'
import { useRenderElement } from '../../use-render'
import type { BaseUIComponentProps } from '../../types'

export interface MyComponentProps
  extends BaseUIComponentProps<'view', MyComponent.State> {}

export namespace MyComponent {
  export interface State {
    disabled: boolean
    // ... state fields
  }
  export type Props = MyComponentProps
}

const MyComponent = React.forwardRef<ViewRef, MyComponentProps>(
  (props, forwardedRef) => {
    const { render, disabled = false, ...otherProps } = props

    const state: MyComponent.State = React.useMemo(
      () => ({ disabled }),
      [disabled],
    )

    const { renderElement } = useRenderElement({
      props: {
        ...otherProps,
        accessibilityRole: '...',
        accessibilityState: { disabled },
      },
      ref: forwardedRef,
      state,
      render: render ?? <View />,
    })

    return renderElement
  },
)

MyComponent.displayName = 'MyComponent'
export { MyComponent }
```

### Phase 4: Compound Components (8-10 days)

These are more complex because they involve multiple sub-components, context, and state management.

**Order of implementation:**

1. **`Collapsible`** (1 day) — Simple compound: Root, Trigger, Panel. ✅ Shipped in Milestone 3 — the consumer animates from the panel's published `height`/`transitionStatus`; zest itself uses no animation API.
2. **`Accordion`** (1-2 days) — Root, Item, Header, Trigger, Panel. ✅ Shipped in Milestone 3, reusing Collapsible's internals per item.
3. **`Tabs`** (1-2 days) — Root, List, Tab, Indicator, Panel. ✅ Shipped in Milestone 4 on top of `CompositeList`. The indicator publishes the active tab's measured position/size on its state instead of the web version's `--active-tab-*` CSS variables.
4. **`Dialog`** (2 days) — Root, Trigger, Portal, Backdrop, Viewport, Popup, Title, Description, Close. Custom using RN `Modal`. Adds ReactStore for controlled/uncontrolled `open` state. ✅ Shipped in Milestone 1.
5. **`AlertDialog`** (1 day) — Similar to Dialog but for alerts. ✅ Shipped in Milestone 2.
6. **`Popover`** (2 days) — Root, Trigger, Portal, Positioner, Popup, Arrow, Title, Description, Close. Custom positioning using `onLayout` + `useWindowDimensions`. Positioning is the key challenge.
7. **`Tooltip`** (1 day) — Root, Trigger, Portal, Positioner, Popup, Arrow. Custom with `onLayout` positioning.
8. **`Toast`** (1-2 days) — Provider, Portal, Viewport, Root, Title, Description, Action, Close. Custom with queue management via store.
9. **`Drawer`** (1-2 days) — Root, Trigger, Portal, Backdrop, Viewport, Popup, Title, Description, Close. (This document originally recorded Drawer as "not in Base UI core" — that is wrong: upstream ships a `drawer` package, and zest ports it. Like upstream, it reuses the Dialog store.) Swipe dismissal via gesture handler.
10. **`Select`** (2-3 days) — Root, Trigger, Value, Icon, Portal, Backdrop, Positioner, Popup, List, Group, GroupLabel, Item, ItemText, ItemIndicator, ScrollUpArrow, ScrollDownArrow, Separator. Custom with `ScrollView` + context.
11. **`Menu`** (2-3 days) — Root, Trigger, Portal, Positioner, Popup, Item, Group, GroupLabel, Separator. Custom with `ScrollView` + context.

**Compound component template:**

```tsx
// 1. Context
interface DialogContextValue {
  store: ReactStore<DialogState>
  open: boolean
  onOpenChange: (open: boolean) => void
}

const DialogContext = React.createContext<DialogContextValue | null>(null)

function useDialogContext(componentName: string): DialogContextValue {
  const context = React.useContext(DialogContext)
  if (!context) {
    throw new Error(
      `<${componentName}> must be used within <Dialog.Root>`,
    )
  }
  return context
}

// 2. Root — orchestrator, renders no DOM element, only context
function DialogRoot(props: DialogRootProps) {
  // Initialize ReactStore
  // Sync controlled/uncontrolled props
  // Provide context to children
}

// 3. Sub-components — consume context, render elements
function DialogTrigger(props: DialogTriggerProps) {
  const { onOpenChange } = useDialogContext('Dialog.Trigger')
  // Render trigger element that calls onOpenChange(true) on press
}

// 4. Barrel export
export { DialogRoot as Root }
export { DialogTrigger as Trigger }
// ...etc
```

### Phase 5: Testing & Quality (5 days)

**Test categories:**

1. **Unit tests** (Jest + `@testing-library/react-native`, jest-expo preset)
   - Every hook: test with different inputs
   - ReactStore: controlled, uncontrolled, selector subscriptions
   - Each component: renders without crashing, accepts props, fires callbacks

2. **Accessibility tests**
   - `accessibilityRole` is set correctly
   - `accessibilityState` reflects component state
   - Focus management works in modals
   - Screen reader labels are correct

3. **Cross-platform tests**
   - Component works on iOS (TestFlight)
   - Component works on Android (Emulator)
   - Component works on Web (React Native Web)

4. **Edge cases**
   - Disabled state behavior
   - Loading/empty states
   - Keyboard interactions
   - Screen rotation

**Target coverage:** 80%+

---

## Estimated Timeline

| Phase | Description | Duration | Cumulative |
|---|---|---|---|
| 1 | @limonify/zest/utils | 3-4 days | 1 week |
| 2 | Core render engine | 2 days | 1.5 weeks |
| 3 | Simple components | 5-6 days | 2.5-3 weeks |
| 4 | Compound components | 8-10 days | 4.5-5 weeks |
| 5 | Testing & quality | 5 days | 5.5-6 weeks |
| **Total** | | **~5-6 weeks** | |

With two developers working in parallel (one on simple components, one on compound components): **3-4 weeks**.

---

## FAQ

### Why not just use @rn-primitives directly?

`@rn-primitives` is not a dependency — it's a **code reference** for pattern implementation. `@limonify/zest` provides a **Base UI-like API** with full ownership. The key differences:

| Feature | @rn-primitives | @limonify/zest |
|---|---|---|
| Relationship | Reference (not a dependency) | Own implementation |
| State management | Minimal (prop-driven) | ReactStore (selector-based, performant) |
| Controlled/uncontrolled | Manual | Built-in via `useControlledProp` |
| Change reasons | None | Reason system (why did state change?) |
| `render` prop | No (only `asChild`) | Yes |
| Prop merging | Basic | deep `mergeProps` |
| Store subscription | Full re-render | Selector-based |

### Why not use Tamagui/Gluestack/NativeWind directly?

Those are **styled component libraries** with their own rendering engines. `@limonify/zest` is **headless** — it provides zero style and works with ANY styling solution.

### Will this be a dependency or copy-paste?

Initial release: `npm install @limonify/zest`. Future consideration: CLI-based copy-paste like shadcn/ui, but this introduces maintenance complexity.

### What about React Native Web?

`@limonify/zest` uses React Native core APIs (`Pressable`, `View`, `Text`, `Modal`, `TextInput`) which are all supported by React Native Web. The same components work on iOS, Android, and web.

### How does positioning work without Floating UI?

Base UI uses `@floating-ui/react-dom` for positioning on web. In React Native, `@limonify/zest` implements a custom positioning system referencing patterns from `@rn-primitives`:

- **Dialog/AlertDialog**: Uses RN's built-in `Modal` — positioning is handled by the OS
- **Popover/Tooltip**: Custom implementation that measures the trigger element with `onLayout` and positions the popup using `useWindowDimensions` for viewport-relative positioning, with collision detection
- **Drawer**: Custom absolute positioning with drag gesture
- **Menu/Select**: Custom positioning using `onLayout` measurements + `Modal` for overflow
- **Toast**: Custom absolute positioning with stacked queue management

### Why not depend on @rn-primitives directly?

`@limonify/zest` references `@rn-primitives` source code for **patterns and ideas** but does not list it as a runtime dependency. This approach provides:

- **No upstream risk**: If `@rn-primitives` changes API, has a bug, or stops being maintained, `@limonify/zest` is unaffected — it's our code.
- **Full control**: Every positioning calculation, focus trap, and gesture handler is in our codebase. We can fix, optimize, or customize without waiting for upstream.
- **Smaller dependency tree**: No transitive dependencies we don't control.
- **Single lincense**: MIT on our terms, no concerns about dependency license changes.

The trade-off is ~2-3 extra days of development time to reimplement patterns that `@rn-primitives` already solved. This is a one-time cost paid during initial development, versus perpetual risk carried with every upstream release.

### How is accessibility handled?

React Native provides a set of accessibility props that map to both iOS (UIAccessibility) and Android (AccessibilityNodeInfo):

- `accessibilityRole` — semantic role for screen readers
- `accessibilityState` — current state (disabled, selected, checked, expanded)
- `accessibilityLabel` — override spoken label
- `accessibilityHint` — additional context
- `accessibilityLiveRegion` — for dynamic content (toast, progress)
- `importantForAccessibility` — control screen reader inclusion

`@rn-primitives` served as a reference for ARIA → RN accessibility mapping. `@limonify/zest` implements its own mapping and ensures the correct accessibility props are passed based on component state.

---

## CLAUDE.md / AI Agent Instructions

If you're using this README as a prompt for an AI coding assistant (Claude Code, Cursor, etc.), include these instructions:

```
# @limonify/zest — AI Implementation Guide

You are implementing a React Native headless UI library called @limonify/zest.
It is a port of Base UI (https://github.com/mui/base-ui) for React Native.

## Key Principles

1. Headless: Zero style, zero CSS, zero default theme
2. Store-based: Every stateful component uses ReactStore from @base-ui/utils
3. Compound pattern: Complex widgets use Root/Trigger/Popup/Panel/Item sub-components (real Base UI part names, not Radix's Content/Overlay)
4. Accessible: Map ARIA patterns to React Native accessibility APIs
5. @rn-primitives as reference: Study @rn-primitives patterns (positioning, focus trap, accessibility), reimplement in own codebase with full control. No runtime dependency on @rn-primitives.

## Architecture

- @limonify/zest/utils: ReactStore + hooks (port from @base-ui/utils)
- @limonify/zest: All components

## DOM → RN Mapping

- <div> → <View>
- <button> → <Pressable>
- <span> → <Text>
- <input> → <TextInput>
- onClick → onPress
- data-* → accessibilityState / render prop
- aria-* → accessibilityRole / accessibilityLabel / accessibilityState
- tabIndex → focusable

## Store Pattern

const store = new ReactStore({ open: false })
store.useControlledProp('open', controlledOpen)
store.useState('open')  // selector subscription
store.setOpen(true)      // state update

## Component Template

Every component must:
1. Accept a render prop for full customization
2. Support asChild via Slot
3. Use forwardRef
4. Have a namespace with State and Props types
5. Set correct accessibilityRole and accessibilityState
6. Use useRenderElement for prop merging

## Implementation Order

Phase 1: utils (ReactStore, hooks)
Phase 2: core (useRenderElement, Slot, Portal, mergeProps, types)
Phase 3: simple components (Button, Input, Separator, Checkbox, etc.)
Phase 4: compound components (Dialog, Select, Tabs, Popover, etc.)
Phase 5: tests + quality

## Do NOT

- Add any default styling, colors, padding, or fonts
- Use DOM-specific APIs (document, window, CSS)
- Create platform-specific files unless absolutely necessary
- Override user-provided style/className props

## Testing

- Every component needs a test file
- Test: renders, accepts props, fires callbacks, disabled state
- Use @testing-library/react-native
- Target 80%+ coverage
```
