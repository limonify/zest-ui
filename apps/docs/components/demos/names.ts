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
  'autocomplete',
  'avatar',
  'button',
  'checkbox',
  'checkbox-group',
  'collapsible',
  'combobox',
  'context-menu',
  'dialog',
  'drawer',
  'field',
  'fieldset',
  'form',
  'input',
  'menu',
  'meter',
  'number-field',
  'otp-field',
  'popover',
  'progress',
  'radio',
  'radio-group',
  'select',
  'separator',
  'slider',
  'switch',
  'tabs',
  'toast',
  'toggle',
  'toggle-group',
  'tooltip',
] as const;

export type DemoName = (typeof demoNames)[number];

export function isDemoName(name: string | undefined): name is DemoName {
  return name !== undefined && (demoNames as readonly string[]).includes(name);
}
