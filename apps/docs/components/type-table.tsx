import { AutoTypeTable } from 'fumadocs-typescript/ui';
import { createGenerator } from 'fumadocs-typescript';

const generator = createGenerator();

/**
 * Auto-generated props table read from a zest source file's TypeScript
 * interface + JSDoc. `path` is relative to the docs app root.
 */
export function AutoType(props: { path: string; name: string }) {
  return <AutoTypeTable generator={generator} {...props} />;
}
