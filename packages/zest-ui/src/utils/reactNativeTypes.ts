import type * as React from 'react';
import type { ImageProps, ModalProps, TextInput, TextInputProps, View } from 'react-native';

/**
 * React Native types named so they hold across the whole `react-native >=0.79`
 * peer range.
 *
 * **Refs: name the instance, not the component.** Up to RN 0.87 `View` and
 * `TextInput` were classes, so `React.useRef<TextInput>` happened to name the
 * instance (`focus`, `blur`, `measureInWindow`). RN 0.88 made them function
 * components whose `ref` prop carries a separate instance type, and from then
 * on `TextInput` as a type names a function: every method call on the ref
 * fails to type-check, and a public type such as `RefObject<TextInput | null>`
 * hands consumers a ref they cannot call. `React.ComponentRef<typeof X>` reads
 * the instance off the component's `ref` prop, so it resolves to the class
 * instance on older RN and to the new instance type on 0.88+.
 *
 * **Events: derive from the prop, not from a payload name.** RN 0.88 removed
 * `TextInputFocusEventData`, `TextInputKeyPressEventData` and
 * `ImageErrorEventData` in favour of `TextInputFocusEvent` and friends, which
 * older versions do not have. The handler prop's own parameter exists in both.
 * The same goes for `Modal`'s `onRequestClose`, whose event RN 0.88 narrowed to
 * `nativeEvent: null`.
 *
 * The instance types are empty interfaces rather than aliases on purpose. An
 * alias that resolves to a class is erased as soon as inference carries it
 * through something like a store selector, and the `.d.ts` emit then has to
 * name RN's private instance path and fails with TS2883. An interface has a
 * name of its own, so the emit writes `TextInputInstance`, and structurally it
 * is the same type.
 */
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface ViewInstance extends React.ComponentRef<typeof View> {}
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface TextInputInstance extends React.ComponentRef<typeof TextInput> {}

export type TextInputBlurEventType = Parameters<NonNullable<TextInputProps['onBlur']>>[0];
export type TextInputKeyPressEventType = Parameters<NonNullable<TextInputProps['onKeyPress']>>[0];
export type ImageErrorEventType = Parameters<NonNullable<ImageProps['onError']>>[0];
export type ModalRequestCloseEventType = Parameters<NonNullable<ModalProps['onRequestClose']>>[0];
