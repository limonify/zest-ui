import * as React from 'react';

/**
 * Extracts the `ref` from a React element.
 * Zest requires React >= 19, where element refs live on `props`.
 */
export function getReactElementRef(element: unknown): React.Ref<unknown> | null {
  if (!React.isValidElement(element)) {
    return null;
  }

  const propsWithRef = element.props as { ref?: React.Ref<unknown> | undefined } | undefined;

  return propsWithRef?.ref ?? null;
}
