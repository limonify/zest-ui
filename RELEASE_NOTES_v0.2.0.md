# Release v0.2.0

## What's New

### 🎬 Animation Support for Popup Components

All popup components now expose `transitionStatus` in their state, enabling smooth open/close animations:

- **Dialog** / **AlertDialog** / **Drawer**
- **Popover**
- **Menu**
- **Select**
- **Tooltip**

```tsx
<Dialog.Popup
  keepMounted
  style={(state) => [
    styles.popup,
    state.transitionStatus === 'starting' && styles.fadeIn,
    state.transitionStatus === 'ending' && styles.fadeOut,
  ]}
>
  {/* content */}
</Dialog.Popup>
```

### 📊 Slider Thumb Position

`Slider.Thumb` now exposes `percent` (0-100) in its state, making it easier to position custom thumb indicators:

```tsx
<Slider.Thumb
  style={(state) => [
    styles.thumb,
    { left: `${state.percent}%` }
  ]}
/>
```

### 🌳 Tree-Shaking Support

Added subpath exports for better bundle size optimization:

```tsx
// Import only what you need
import { Dialog } from '@limonify/zest-ui/dialog';
import { Button } from '@limonify/zest-ui/button';
```

### ⌨️ Keyboard Handling

`SelectList` now includes sensible keyboard defaults:
- `keyboardShouldPersistTaps: 'handled'`
- `keyboardDismissMode: 'on-drag'`

## Bug Fixes

- **Collapsible Panel**: Fixed height measurement issue where invalid measurements could affect state
- **Tooltip**: Added proper `accessibilityRole: 'tooltip'` for screen reader support

## Performance

Optimized re-renders in leaf components using `React.useMemo`:
- Button, Toggle, Separator, Input
- MenuItem, TabsTab, AvatarRoot
- RadioGroup, CheckboxGroup, ToggleGroup

## Infrastructure

- Added bundle size monitoring with `size-limit` (current: ~57 kB, limit: 500 kB)
- Added test coverage configuration
- Enhanced TypeScript strictness
- Added changesets for automated changelog generation

## Breaking Changes

None. This is a backward-compatible release.

## Migration Guide

No migration needed. All changes are additive.

---

**Full Changelog**: https://github.com/limonify/zest/compare/v0.1.5...v0.2.0
