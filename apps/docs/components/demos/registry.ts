// Must come first: every chunk below is React Native, which reads `__DEV__`.
import './runtime';

import dynamic from 'next/dynamic';
import type { ComponentType } from 'react';
import type { DemoName } from './names';

/**
 * The live demos, one chunk each.
 *
 * `ssr: false` is not an optimisation here: the site is a static export, and a
 * demo mounts React Native components through `react-native-web`, which has no
 * business running during prerender. Loading them lazily also keeps a page from
 * pulling in every other page's demo.
 */
export const demos: Partial<Record<DemoName, ComponentType>> = {
  accordion: dynamic(() => import('./accordion').then((m) => m.AccordionDemo), { ssr: false }),
  'alert-dialog': dynamic(() => import('./alert-dialog').then((m) => m.AlertDialogDemo), { ssr: false }),
  autocomplete: dynamic(() => import('./autocomplete').then((m) => m.AutocompleteDemo), { ssr: false }),
  avatar: dynamic(() => import('./avatar').then((m) => m.AvatarDemo), { ssr: false }),
  button: dynamic(() => import('./button').then((m) => m.ButtonDemo), { ssr: false }),
  checkbox: dynamic(() => import('./checkbox').then((m) => m.CheckboxDemo), { ssr: false }),
  'checkbox-group': dynamic(() => import('./checkbox-group').then((m) => m.CheckboxGroupDemo), { ssr: false }),
  collapsible: dynamic(() => import('./collapsible').then((m) => m.CollapsibleDemo), { ssr: false }),
  combobox: dynamic(() => import('./combobox').then((m) => m.ComboboxDemo), { ssr: false }),
  'context-menu': dynamic(() => import('./context-menu').then((m) => m.ContextMenuDemo), { ssr: false }),
  dialog: dynamic(() => import('./dialog').then((m) => m.DialogDemo), { ssr: false }),
  drawer: dynamic(() => import('./drawer').then((m) => m.DrawerDemo), { ssr: false }),
  field: dynamic(() => import('./field').then((m) => m.FieldDemo), { ssr: false }),
  fieldset: dynamic(() => import('./fieldset').then((m) => m.FieldsetDemo), { ssr: false }),
  form: dynamic(() => import('./form').then((m) => m.FormDemo), { ssr: false }),
  input: dynamic(() => import('./input').then((m) => m.InputDemo), { ssr: false }),
  menu: dynamic(() => import('./menu').then((m) => m.MenuDemo), { ssr: false }),
  meter: dynamic(() => import('./meter').then((m) => m.MeterDemo), { ssr: false }),
  'number-field': dynamic(() => import('./number-field').then((m) => m.NumberFieldDemo), { ssr: false }),
  'otp-field': dynamic(() => import('./otp-field').then((m) => m.OTPFieldDemo), { ssr: false }),
  popover: dynamic(() => import('./popover').then((m) => m.PopoverDemo), { ssr: false }),
  progress: dynamic(() => import('./progress').then((m) => m.ProgressDemo), { ssr: false }),
  radio: dynamic(() => import('./radio').then((m) => m.RadioDemo), { ssr: false }),
  'radio-group': dynamic(() => import('./radio-group').then((m) => m.RadioGroupDemo), { ssr: false }),
  select: dynamic(() => import('./select').then((m) => m.SelectDemo), { ssr: false }),
  separator: dynamic(() => import('./separator').then((m) => m.SeparatorDemo), { ssr: false }),
  slider: dynamic(() => import('./slider').then((m) => m.SliderDemo), { ssr: false }),
  switch: dynamic(() => import('./switch').then((m) => m.SwitchDemo), { ssr: false }),
  tabs: dynamic(() => import('./tabs').then((m) => m.TabsDemo), { ssr: false }),
  toast: dynamic(() => import('./toast').then((m) => m.ToastDemo), { ssr: false }),
  toggle: dynamic(() => import('./toggle').then((m) => m.ToggleDemo), { ssr: false }),
  'toggle-group': dynamic(() => import('./toggle-group').then((m) => m.ToggleGroupDemo), { ssr: false }),
  tooltip: dynamic(() => import('./tooltip').then((m) => m.TooltipDemo), { ssr: false }),
};
