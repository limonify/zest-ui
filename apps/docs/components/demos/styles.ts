import { StyleSheet } from 'react-native';

/**
 * Shared styling for the live demos.
 *
 * These are consumer styles, exactly like the ones a reader would write — zest
 * ships none of this. Colours are taken from Fumadocs' own CSS variables so a
 * demo follows the site's light/dark theme: `react-native-web` passes a string
 * it does not recognise straight through to CSS, which makes `var(--…)` work.
 */
export const c = {
  fg: 'var(--color-fd-foreground)',
  muted: 'var(--color-fd-muted-foreground)',
  border: 'var(--color-fd-border)',
  card: 'var(--color-fd-card)',
  accent: '#2563eb',
  accentText: '#ffffff',
  danger: '#dc2626',
} as const;

export const s = StyleSheet.create({
  stage: {
    gap: 12,
    padding: 20,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  label: {
    color: c.fg,
    fontSize: 15,
  },
  muted: {
    color: c.muted,
    fontSize: 13,
  },
  heading: {
    color: c.fg,
    fontSize: 15,
    fontWeight: '600',
  },

  button: {
    alignSelf: 'flex-start',
    backgroundColor: c.accent,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  buttonPressed: {
    opacity: 0.75,
  },
  buttonDisabled: {
    opacity: 0.45,
  },
  buttonText: {
    color: c.accentText,
    fontSize: 15,
    fontWeight: '600',
  },

  box: {
    height: 22,
    width: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: c.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxChecked: {
    backgroundColor: c.accent,
  },
  tick: {
    color: c.accentText,
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 16,
  },

  control: {
    borderWidth: 1,
    borderColor: c.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: c.fg,
    fontSize: 15,
    backgroundColor: c.card,
  },

  popup: {
    backgroundColor: c.card,
    borderColor: c.border,
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    gap: 8,
    minWidth: 220,
    // React Native does not clip to a parent's bounds, so anything with a
    // maxHeight needs this or its rows spill over the page.
    overflow: 'hidden',
  },
  // `StyleSheet.absoluteFillObject` is untyped in RN 0.86, so these pair with
  // `StyleSheet.absoluteFill` in an array at the call site rather than
  // spreading it in here.
  backdrop: {
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },

  item: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
  },
  itemPressed: {
    backgroundColor: 'var(--color-fd-accent)',
  },

  track: {
    height: 4,
    borderRadius: 2,
    backgroundColor: c.border,
    justifyContent: 'center',
  },
  indicator: {
    height: 4,
    borderRadius: 2,
    backgroundColor: c.accent,
  },
  thumb: {
    height: 22,
    width: 22,
    marginLeft: -11,
    marginTop: -9,
    borderRadius: 11,
    backgroundColor: c.card,
    borderWidth: 2,
    borderColor: c.accent,
  },
  sliderControl: {
    height: 36,
    justifyContent: 'center',
  },
});
