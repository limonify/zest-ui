'use client';
import {
  useNumberFieldStepperButton,
  type NumberFieldStepperButtonProps,
  type NumberFieldStepperButtonState,
} from '../root/useNumberFieldStepperButton';

/**
 * A stepper button that increases the field value when clicked.
 * Renders a `<Pressable>`.
 */
export function NumberFieldIncrement(componentProps: NumberFieldIncrement.Props) {
  return useNumberFieldStepperButton(componentProps, true);
}

export interface NumberFieldIncrementState extends NumberFieldStepperButtonState {}

export interface NumberFieldIncrementProps extends NumberFieldStepperButtonProps {}

export namespace NumberFieldIncrement {
  export type State = NumberFieldIncrementState;
  export type Props = NumberFieldIncrementProps;
}
