let counter = 0;

/**
 * A unique id for things React's `useId` cannot cover — values created outside
 * of rendering, like a toast pushed from an event handler.
 */
export function generateId(prefix: string) {
  counter += 1;
  return `${prefix}-${Math.random().toString(36).slice(2, 6)}-${counter}`;
}
