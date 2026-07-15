'use client';
import { mergeProps } from '../../merge-props';
import type { NativeProps } from '../../types';

/**
 * Shared press-target behavior for button-like parts (Button, Dialog.Trigger,
 * Dialog.Close, Checkbox.Root, ...).
 *
 * React Native adaptation of Base UI's `useButton`: the web version's
 * `nativeButton`, `focusableWhenDisabled` and composite-navigation concerns
 * are DOM-only and intentionally absent. `Pressable` already suppresses press
 * events when `disabled` is set; this hook adds the accessibility contract.
 */
export function useButton(parameters: useButton.Parameters = {}) {
  const { disabled = false, buttonProps: extraButtonProps } = parameters;

  const getButtonProps = (externalProps: NativeProps = {}): NativeProps => {
    return mergeProps<any>(
      {
        accessibilityRole: 'button',
        accessibilityState: { disabled: disabled || undefined },
        disabled,
        ...extraButtonProps,
      },
      externalProps,
    );
  };

  return { getButtonProps };
}

export namespace useButton {
  export interface Parameters {
    /**
     * Whether the button should ignore user interaction.
     * @default false
     */
    disabled?: boolean | undefined;
    /**
     * Additional internal props merged before external ones.
     */
    buttonProps?: NativeProps | undefined;
  }
}
