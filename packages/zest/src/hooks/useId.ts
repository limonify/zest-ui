'use client';
import * as React from 'react';

/**
 * Returns a stable unique id, optionally overridden or prefixed.
 *
 * @example <View nativeID={useId()} />
 */
export function useId(idOverride?: string, prefix?: string): string | undefined {
  const reactId = React.useId();
  return idOverride ?? (prefix ? `${prefix}-${reactId}` : reactId);
}
