'use client';
import * as React from 'react';
import { View } from 'react-native';
import { useRenderElement } from '../../use-render/useRenderElement';
import { useStableCallback } from '../../hooks/useStableCallback';
import { useFieldRootContext, FieldRootContext } from '../root/FieldRootContext';
import type { FieldRoot } from '../root/FieldRoot';
import type { ZestUIComponentProps } from '../../types';

/**
 * Groups one item of a checkbox or radio group with its own label and
 * description.
 * Renders a `<View>`.
 *
 * A `Field.Root` labels a single control, so a group of them would have every
 * item pointing at the same label. An item opens a nested labelling scope: the
 * `Field.Label` and `Field.Description` inside it associate with *its* control
 * and nothing else, while validity, `disabled` and the rest still come from the
 * surrounding field.
 *
 * ```tsx
 * <Field.Root>
 *   <Field.Label>Notifications</Field.Label>
 *   <CheckboxGroup.Root>
 *     <Field.Item>
 *       <Checkbox.Root value="email" />
 *       <Field.Label>Email</Field.Label>
 *       <Field.Description>At most one digest a day</Field.Description>
 *     </Field.Item>
 *   </CheckboxGroup.Root>
 * </Field.Root>
 * ```
 */
export function FieldItem(componentProps: FieldItem.Props) {
  const {
    render,
    className,
    style,
    disabled: disabledProp = false,
    ref,
    ...elementProps
  } = componentProps;

  const parent = useFieldRootContext();

  const [controlId, setControlId] = React.useState<string | undefined>(undefined);
  const [labelId, setLabelId] = React.useState<string | undefined>(undefined);
  const [messageIds, setMessageIdsState] = React.useState<string[]>([]);

  const setMessageIds = useStableCallback((updater: (previous: string[]) => string[]) => {
    setMessageIdsState(updater);
  });

  // An item can be disabled on its own, but a disabled field disables all of them.
  const disabled = parent.disabled || disabledProp;

  const state: FieldItemState = React.useMemo(
    () => ({ ...parent.state, disabled }),
    [parent.state, disabled],
  );

  // Everything but the labelling scope is inherited, so validity, `touched`,
  // `dirty` and `validate` keep belonging to the field as a whole.
  const contextValue: FieldRootContext = React.useMemo(
    () => ({
      ...parent,
      disabled,
      controlId,
      setControlId,
      labelId,
      setLabelId,
      messageIds,
      setMessageIds,
      state,
    }),
    [parent, disabled, controlId, labelId, messageIds, setMessageIds, state],
  );

  const element = useRenderElement(View, componentProps, {
    state,
    ref,
    props: elementProps,
  });

  return <FieldRootContext.Provider value={contextValue}>{element}</FieldRootContext.Provider>;
}

export interface FieldItemState extends FieldRoot.State {}

export interface FieldItemProps extends ZestUIComponentProps<typeof View, FieldItemState> {
  /**
   * Whether this item should ignore user interaction. A disabled `Field.Root`
   * disables every item in it.
   * @default false
   */
  disabled?: boolean | undefined;
}

export namespace FieldItem {
  export type State = FieldItemState;
  export type Props = FieldItemProps;
}
