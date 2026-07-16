'use client';
import * as React from 'react';
import { View } from 'react-native';
import { useRenderElement } from '../../use-render/useRenderElement';
import type { ZestUIComponentProps } from '../../types';
import { FieldsetRootContext } from './FieldsetRootContext';

/**
 * Groups related fields, with an optional `Fieldset.Legend`.
 * Renders a `<View>`.
 *
 * A disabled fieldset disables every `Field.Root` inside it.
 */
export function FieldsetRoot(componentProps: FieldsetRoot.Props) {
  const { render, className, style, disabled = false, ref, ...elementProps } = componentProps;

  const [legendId, setLegendId] = React.useState<string | undefined>(undefined);

  const state: FieldsetRoot.State = React.useMemo(() => ({ disabled }), [disabled]);

  const contextValue: FieldsetRootContext = React.useMemo(
    () => ({ disabled, legendId, setLegendId }),
    [disabled, legendId],
  );

  const element = useRenderElement(View, componentProps, {
    state,
    ref,
    props: [
      { role: 'group' as const, accessibilityLabelledBy: legendId, 'aria-labelledby': legendId },
      elementProps,
    ],
  });

  return (
    <FieldsetRootContext.Provider value={contextValue}>{element}</FieldsetRootContext.Provider>
  );
}

export interface FieldsetRootState {
  /**
   * Whether the fieldset is disabled.
   */
  disabled: boolean;
}

export interface FieldsetRootProps extends ZestUIComponentProps<typeof View, FieldsetRootState> {
  /**
   * Whether the fieldset and all fields inside it are disabled.
   * @default false
   */
  disabled?: boolean | undefined;
}

export namespace FieldsetRoot {
  export type State = FieldsetRootState;
  export type Props = FieldsetRootProps;
}
