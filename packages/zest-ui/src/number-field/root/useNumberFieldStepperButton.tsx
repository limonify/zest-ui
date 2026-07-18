'use client';
import * as React from 'react';
import { Pressable } from 'react-native';
import { useNumberFieldRootContext } from './NumberFieldRootContext';
import { useRenderElement } from '../../use-render/useRenderElement';
import { useButton } from '../../internals/use-button/useButton';
import { useInterval } from '../../hooks/useInterval';
import { useStableCallback } from '../../hooks/useStableCallback';
import { useTimeout } from '../../hooks/useTimeout';
import type { ZestUIComponentProps } from '../../types';
import { createChangeEventDetails } from '../../utils/createChangeEventDetails';
import { REASONS } from '../../utils/reasons';
import type { NumberFieldRootState } from './NumberFieldRoot';
import { CHANGE_VALUE_TICK_DELAY, START_AUTO_CHANGE_DELAY } from '../utils/constants';

/**
 * Shared implementation of the increment and decrement buttons. They differ only
 * in which way they step and which boundary (`max` vs `min`) disables them.
 *
 * Holding the button steps repeatedly, as on the web. Upstream builds that on
 * `usePressAndHold`, which tracks pointer movement to tell a hold from a scroll;
 * React Native's `Pressable` already cancels a press that turns into a scroll and
 * calls `onPressOut`, so a timeout and an interval are the whole mechanism here.
 */
export function useNumberFieldStepperButton(
  componentProps: NumberFieldStepperButtonProps,
  isIncrement: boolean,
) {
  const {
    render,
    className,
    disabled: disabledProp = false,
    style,
    ref,
    ...elementProps
  } = componentProps;

  const {
    getStepAmount,
    incrementValue,
    lastChangedValueRef,
    maxWithDefault,
    minWithDefault,
    onValueCommitted,
    state,
    valueRef,
  } = useNumberFieldRootContext();

  const { disabled: contextDisabled, readOnly, value } = state;

  const startTimeout = useTimeout();
  const tickInterval = useInterval();

  const isAtBoundary =
    value != null && (isIncrement ? value >= maxWithDefault : value <= minWithDefault);
  const disabled = disabledProp || contextDisabled || readOnly || isAtBoundary;

  const reason = isIncrement ? REASONS.incrementPress : REASONS.decrementPress;
  const direction = isIncrement ? 1 : -1;

  const [pressed, setPressed] = React.useState(false);

  const step = useStableCallback(() => incrementValue(getStepAmount(), { direction, reason }));

  const stop = useStableCallback(() => {
    startTimeout.clear();
    tickInterval.clear();
    setPressed(false);
  });

  // A hold that runs past a boundary must stop repeating, even though the button
  // only re-renders as disabled afterwards.
  React.useEffect(() => {
    if (disabled) {
      startTimeout.clear();
      tickInterval.clear();
    }
  }, [disabled, startTimeout, tickInterval]);

  React.useEffect(() => stop, [stop]);

  const { getButtonProps } = useButton({ disabled });

  const buttonState: NumberFieldStepperButtonState = { ...state, pressed };

  return useRenderElement(Pressable, componentProps, {
    state: buttonState,
    ref,
    props: [
      {
        onPressIn() {
          if (disabled) {
            return;
          }

          setPressed(true);
          step();

          startTimeout.start(START_AUTO_CHANGE_DELAY, () => {
            tickInterval.start(CHANGE_VALUE_TICK_DELAY, step);
          });
        },
        onPressOut() {
          if (!pressed) {
            return;
          }

          stop();
          onValueCommitted(
            lastChangedValueRef.current ?? valueRef.current,
            createChangeEventDetails(reason),
          );
        },
        accessibilityState: { disabled: disabled || undefined },
      },
      elementProps,
      getButtonProps,
    ],
  });
}

export interface NumberFieldStepperButtonState extends NumberFieldRootState {
  /**
   * Whether the button is currently pressed.
   */
  pressed: boolean;
}

export interface NumberFieldStepperButtonProps
  extends ZestUIComponentProps<typeof Pressable, NumberFieldStepperButtonState> {
  /**
   * Whether the component should ignore user interaction.
   * @default false
   */
  disabled?: boolean | undefined;
}
