'use client';
import * as React from 'react';
import type { MenuRadioGroup } from './MenuRadioGroup';
import type { ZestNativeEvent } from '../../utils/createChangeEventDetails';

export interface MenuRadioGroupContext<Value = any> {
  value: Value;
  disabled: boolean;
  setValue: (value: Value, event: ZestNativeEvent) => void;
}

// Typed `any` and read through a generic hook: the established group pattern.
// A concrete `Value` here would make the provider's contravariant `setValue`
// unassignable and force casts on both sides.
export const MenuRadioGroupContext = React.createContext<MenuRadioGroupContext<any> | undefined>(
  undefined,
);

export function useMenuRadioGroupContext<Value = any>() {
  const context = React.useContext<MenuRadioGroupContext<Value> | undefined>(MenuRadioGroupContext);
  if (context === undefined) {
    throw new Error(
      'Zest: MenuRadioGroupContext is missing. Menu.RadioItem must be placed within <Menu.RadioGroup>.',
    );
  }

  return context;
}

export type MenuRadioGroupChangeEventDetails = MenuRadioGroup.ChangeEventDetails;
