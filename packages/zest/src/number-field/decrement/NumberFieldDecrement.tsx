'use client';
import {
  useNumberFieldStepperButton,
  type NumberFieldStepperButtonProps,
  type NumberFieldStepperButtonState,
} from '../root/useNumberFieldStepperButton';

/**
 * A stepper button that decreases the field value when clicked.
 * Renders a `<Pressable>`.
 */
export function NumberFieldDecrement(componentProps: NumberFieldDecrement.Props) {
  return useNumberFieldStepperButton(componentProps, false);
}

export interface NumberFieldDecrementState extends NumberFieldStepperButtonState {}

export interface NumberFieldDecrementProps extends NumberFieldStepperButtonProps {}

export namespace NumberFieldDecrement {
  export type State = NumberFieldDecrementState;
  export type Props = NumberFieldDecrementProps;
}
