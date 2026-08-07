# @limonify/zest-ui

[![npm](https://img.shields.io/npm/v/@limonify/zest-ui.svg)](https://www.npmjs.com/package/@limonify/zest-ui)
[![license](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/limonify/zest)
[![docs](https://img.shields.io/badge/docs-zestui.limonify.com-0a0a0a)](https://zestui.limonify.com)

**Base UI for React Native** — headless, unstyled, accessible primitive components.

`@limonify/zest-ui` is a React Native port of [MUI Base UI](https://base-ui.com). Same compound parts (`Dialog.Popup`, `Dialog.Backdrop`), same controlled/uncontrolled patterns — adapted for touch and React Native accessibility APIs.

**Zero style. Zero theme. Zero animation library.** You own the look; zest owns behaviour, state, and accessibility. Style with StyleSheet, Uniwind, NativeWind, Tamagui, or anything else.

**Docs:** [zestui.limonify.com](https://zestui.limonify.com)

## Why zest

- **Base UI API** — familiar compound components and part names, not a Radix rename
- **Headless** — every part renders a plain RN primitive (`View`, `Pressable`, `Text`, `TextInput`)
- **State as style** — `style` and `className` accept a function of state (the RN counterpart of `data-*`)
- **Accessible** — roles and states map to `accessibilityRole` / `accessibilityState` (and keep `aria-*` for RN-web)

## Install

```bash
bun add @limonify/zest-ui
# or: npm install @limonify/zest-ui
```

**Peers:** React 19+, React Native 0.79+.

`Slider` and `Drawer` need `react-native-gesture-handler` (optional peer). Install it only if you use them, and wrap your app once:

```bash
bun add react-native-gesture-handler
```

```tsx
import { GestureHandlerRootView } from 'react-native-gesture-handler';

export default function App() {
  return <GestureHandlerRootView style={{ flex: 1 }}>{/* ... */}</GestureHandlerRootView>;
}
```

Anchored popups (`Popover`, `Tooltip`, `Menu`, `Select`, `Combobox`, …) use `@floating-ui/react-native`, which ships as a regular dependency — nothing extra to install.

Full install guide: [zestui.limonify.com/docs/installation](https://zestui.limonify.com/docs/installation)

## Quick start

Style from state — no themes, no CSS variables:

```tsx
import { StyleSheet } from 'react-native';
import { Switch } from '@limonify/zest-ui';

export function DarkModeToggle() {
  return (
    <Switch.Root style={(state) => [styles.track, state.checked && styles.trackOn]}>
      <Switch.Thumb style={(state) => [styles.thumb, state.checked && styles.thumbOn]} />
    </Switch.Root>
  );
}

const styles = StyleSheet.create({
  track: { width: 44, height: 26, borderRadius: 13, backgroundColor: '#d4d4d4', padding: 3 },
  trackOn: { backgroundColor: '#4c7a0b' },
  thumb: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#fff' },
  thumbOn: { transform: [{ translateX: 18 }] },
});
```

Compound overlays use the same part tree as Base UI. Portals are React Native `Modal`s:

```tsx
import { Text, StyleSheet } from 'react-native';
import { Dialog } from '@limonify/zest-ui';

export function DeleteDialog() {
  return (
    <Dialog.Root>
      <Dialog.Trigger style={styles.button}>
        <Text style={styles.buttonText}>Delete</Text>
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Backdrop style={styles.backdrop} />
        <Dialog.Viewport style={styles.viewport}>
          <Dialog.Popup style={styles.card}>
            <Dialog.Title style={styles.title}>Delete file?</Dialog.Title>
            <Dialog.Description style={styles.body}>This can't be undone.</Dialog.Description>
            <Dialog.Close style={styles.button}>
              <Text style={styles.buttonText}>Cancel</Text>
            </Dialog.Close>
          </Dialog.Popup>
        </Dialog.Viewport>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

const styles = StyleSheet.create({
  button: {
    alignSelf: 'flex-start',
    backgroundColor: '#171717',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  buttonText: { color: '#fff', fontWeight: '600' },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)' },
  viewport: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  card: { width: '100%', maxWidth: 340, gap: 8, borderRadius: 16, backgroundColor: '#fff', padding: 20 },
  title: { fontSize: 17, fontWeight: '700' },
  body: { color: '#737373' },
});
```

## Common props

Every part accepts the same small set on top of its own API:

| Prop | Role |
| --- | --- |
| `style` | RN style, **or** `(state) => style` |
| `className` | String or `(state) => string` for Uniwind / NativeWind |
| `render` | `(props, state) => ReactNode` — swap the host element, keep behaviour |
| `ref` | Ref to the underlying element (React 19 — `ref` is a regular prop) |

```tsx
<Dialog.Trigger render={(props) => <MyButton {...props}>Open</MyButton>} />

<Checkbox.Root
  className={(state) =>
    ['size-6 rounded border', state.checked && 'bg-lime-600'].filter(Boolean).join(' ')
  }
/>
```

## Toast

Most components need no provider. **Toast** is the exception — it must not block the app, so it is not a `Modal`. Mount `Toast.Provider` and `Toast.Viewport` once at the root:

```tsx
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Toast } from '@limonify/zest-ui';

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Toast.Provider timeout={4000} limit={3}>
        <RootNavigator />
        <Toast.Viewport style={{ paddingHorizontal: 16, paddingBottom: 48 }}>
          {/* map toasts → Toast.Root — see https://zestui.limonify.com/docs/components/toast */}
        </Toast.Viewport>
      </Toast.Provider>
    </GestureHandlerRootView>
  );
}
```

Skip `GestureHandlerRootView` if you use neither Slider nor Drawer; skip Toast setup if you don't use toasts.

## Components

33 components. Import from `@limonify/zest-ui`:

```tsx
import { Dialog, Switch, Toast } from '@limonify/zest-ui';
```

### Forms & input

| Component | Parts |
| --- | --- |
| `Button` | — |
| `Input` | — |
| `Checkbox` | Root, Indicator |
| `CheckboxGroup` | — |
| `Radio` | Root, Indicator |
| `RadioGroup` | — |
| `Switch` | Root, Thumb |
| `Toggle` | — |
| `ToggleGroup` | — |
| `Slider` | Root, Label, Value, Control, Track, Indicator, Thumb |
| `NumberField` | Root, Group, Input, Increment, Decrement, ScrubArea |
| `OTPField` | Root, Input, Separator |
| `Field` | Root, Item, Label, Control, Description, Error, Validity |
| `Form` | Form |
| `Fieldset` | Root, Legend |
| `Select` | Root, Label, Trigger, Value, Icon, Portal, Backdrop, Positioner, Arrow, Popup, List, Group, GroupLabel, Item, ItemText, ItemIndicator, Separator |
| `Combobox` | Root, Trigger, Input, Chips, Chip, ChipRemove, Clear, Portal, Backdrop, Positioner, Popup, List, Group, GroupLabel, Collection, Item, ItemIndicator, Empty, Status, Value |
| `Autocomplete` | Root, Trigger, Input, Clear, Portal, Backdrop, Positioner, Popup, List, Group, GroupLabel, Collection, Item, Empty, Status |

### Disclosure

| Component | Parts |
| --- | --- |
| `Collapsible` | Root, Trigger, Panel |
| `Accordion` | Root, Item, Header, Trigger, Panel |
| `Tabs` | Root, List, Tab, Indicator, Panel |

### Overlays

| Component | Parts |
| --- | --- |
| `Dialog` | Root, Trigger, Portal, Backdrop, Viewport, Popup, Title, Description, Close |
| `AlertDialog` | same shape as Dialog |
| `Drawer` | Root, Provider, Indent, IndentBackground, Trigger, Portal, Backdrop, Viewport, Popup, SwipeArea, Title, Description, Close |
| `Popover` | Root, Trigger, Portal, Backdrop, Positioner, Popup, Arrow, Title, Description, Close |
| `Tooltip` | Root, Trigger, Portal, Positioner, Popup, Arrow |
| `Menu` | Root, Trigger, Portal, Backdrop, Positioner, Popup, Arrow, Item, LinkItem, CheckboxItem, RadioGroup, RadioItem, Group, GroupLabel, SubmenuRoot, SubmenuTrigger, Separator |
| `ContextMenu` | Root, Trigger, Positioner, Arrow (+ Menu item family) |

### Feedback & misc

| Component | Parts |
| --- | --- |
| `Progress` | Root, Track, Indicator, Value, Label |
| `Meter` | Root, Track, Indicator, Label, Value |
| `Avatar` | Root, Image, Fallback |
| `Separator` | — |
| `Toast` | Provider, Viewport, Root, Positioner, Arrow, Title, Description, Action, Close |

Popup families also support handles (`createHandle`, detached triggers, imperative open) — see [the docs](https://zestui.limonify.com/docs) for each component.

## Design notes

**Portals are Modals.** Every `Portal` (Dialog, Drawer, Popover, Tooltip, Menu, Select, Combobox, …) is a React Native `Modal`. That keeps context across the portal boundary and wires Android back / Escape to dismiss. **Toast** is the exception: an absolutely positioned `View` with `pointerEvents="box-none"` so the app underneath stays usable.

**State, not data attributes.** On the web, Base UI publishes `data-*` and CSS variables. In zest, state reaches you through the state object on `style` / `className` / `render` — `state.open`, `state.checked`, `state.height`, and so on.

**zest never animates.** Animated parts publish `transitionStatus` and measured geometry on state; you drive `Animated` (or Reanimated) yourself. Exit animations need `keepMounted` (or the part’s equivalent, e.g. Toast’s `removeOnClose`), otherwise the tree unmounts as soon as it closes.

## Not ported

These Base UI pieces stay web/desktop-only:

| Component | Why |
| --- | --- |
| `PreviewCard` | Hover card — no hover on touch |
| `Menubar` | Desktop navigation pattern |
| `NavigationMenu` | Desktop multi-level hover menu |
| `ScrollArea` | RN already has `ScrollView` / `FlatList` |
| `Toolbar` | Desktop toolbar / roving tabindex |
| `CSPProvider` | Content Security Policy is web-only |

`Form` **is** ported, adapted: there is no `<form>` submission, so it does the parts that still
matter — spreading a server's `errors` onto the fields they name, and validating every field on
submit. Submission is imperative, through `actionsRef`.

Base UI's `useFilter` **is** ported — `Combobox` and `Autocomplete` filter through it, and it is
exported for filtering your own lists. See [the docs](https://zestui.limonify.com/docs/utilities/use-filter).

`DirectionProvider` **is** ported. Direction defaults to React Native's own `I18nManager.isRTL`;
wrap a subtree to override it. It decides which edge `align="start"` anchors a popup to and which
way a horizontal slider grows — React Native mirrors the layout itself. See
[the docs](https://zestui.limonify.com/docs/utilities/direction-provider).

## Monorepo

This repository is a bun + turborepo workspace:

| Path | Role |
| --- | --- |
| [`packages/zest-ui`](packages/zest-ui) | The publishable library |
| [`apps/example`](apps/example) | Expo demo exercising every component |
| [`apps/docs`](apps/docs) | Documentation site ([zestui.limonify.com](https://zestui.limonify.com)) |

```bash
bun install
bun run test        # typecheck + tests via turbo
bun run build
bun run dev         # Expo example
```

The full implementation plan, milestones, and architecture notes live in [`ARCHITECTURE.md`](ARCHITECTURE.md). Contributor notes for porting components live in [`packages/zest-ui/CLAUDE.md`](packages/zest-ui/CLAUDE.md).

## License

MIT © [Limonify](https://github.com/limonify)
