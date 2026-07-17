'use client';
import {
  DialogTrigger,
  type DialogTriggerProps,
  type DialogTriggerState,
} from '../../dialog/trigger/DialogTrigger';

/**
 * A button that opens the alert dialog.
 * Renders a `<Pressable>`.
 */
export const AlertDialogTrigger = DialogTrigger;

export interface AlertDialogTriggerProps extends DialogTriggerProps {}

export interface AlertDialogTriggerState extends DialogTriggerState {}

export namespace AlertDialogTrigger {
  export type Props = AlertDialogTriggerProps;
  export type State = AlertDialogTriggerState;
}
