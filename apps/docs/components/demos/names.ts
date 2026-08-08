/**
 * Which pages have a live demo.
 *
 * Kept apart from the registry on purpose: this is plain data, safe to evaluate
 * anywhere, while the registry reaches for React Native and can only run in the
 * browser.
 */
export const demoNames = [
  'accordion',
  'alert-dialog',
  'avatar',
  'button',
  'checkbox',
  'checkbox-group',
  'collapsible',
  'combobox',
  'dialog',
  'field',
  'menu',
  'meter',
  'popover',
  'progress',
  'radio',
  'select',
  'separator',
  'slider',
  'switch',
  'tabs',
  'toggle',
  'tooltip',
] as const;

export type DemoName = (typeof demoNames)[number];

export function isDemoName(name: string | undefined): name is DemoName {
  return name !== undefined && (demoNames as readonly string[]).includes(name);
}
