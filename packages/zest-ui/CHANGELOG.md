# Changelog

All notable changes to `@limonify/zest-ui` are documented here.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project
adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html). While the package is
pre-1.0, breaking changes are released as a **minor** bump.

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
