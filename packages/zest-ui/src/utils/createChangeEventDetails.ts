import type { GestureResponderEvent, NativeSyntheticEvent } from 'react-native';
import { EMPTY_OBJECT } from './empty';

/**
 * The native event associated with a change. In React Native there is no DOM
 * event hierarchy; press interactions produce `GestureResponderEvent`s and
 * everything else is a `NativeSyntheticEvent`. Events may be absent for
 * imperative or initial state changes.
 */
export type ZestNativeEvent =
  | GestureResponderEvent
  | NativeSyntheticEvent<unknown>
  | undefined;

type ZestChangeEventDetail<Reason extends string, CustomProperties extends object> = {
  /**
   * The reason for the event.
   */
  reason: Reason;
  /**
   * The native event associated with the custom event, if any.
   */
  event: ZestNativeEvent;
  /**
   * Cancels Zest from handling the event.
   */
  cancel: () => void;
  /**
   * Allows the event to propagate in cases where Zest will stop the propagation.
   */
  allowPropagation: () => void;
  /**
   * Indicates whether the event has been canceled.
   */
  isCanceled: boolean;
  /**
   * Indicates whether the event is allowed to propagate.
   */
  isPropagationAllowed: boolean;
} & CustomProperties;

/**
 * Details of custom change events emitted by Zest components.
 */
export type ZestChangeEventDetails<
  Reason extends string,
  CustomProperties extends object = {},
> = Reason extends string ? ZestChangeEventDetail<Reason, CustomProperties> & {} : never;

/**
 * Creates a Zest event details object with the given reason and utilities
 * for preventing Zest's internal event handling.
 */
export function createChangeEventDetails<
  Reason extends string,
  CustomProperties extends object = {},
>(
  reason: Reason,
  event?: ZestNativeEvent,
  customProperties?: CustomProperties,
): ZestChangeEventDetails<Reason, CustomProperties> {
  let canceled = false;
  let allowPropagation = false;
  const custom = customProperties ?? (EMPTY_OBJECT as CustomProperties);
  const details: ZestChangeEventDetail<Reason, CustomProperties> = {
    reason,
    event,
    cancel() {
      canceled = true;
    },
    allowPropagation() {
      allowPropagation = true;
    },
    get isCanceled() {
      return canceled;
    },
    get isPropagationAllowed() {
      return allowPropagation;
    },
    ...custom,
  };
  return details as ZestChangeEventDetails<Reason, CustomProperties>;
}
