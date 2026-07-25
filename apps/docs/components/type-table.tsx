import { AutoTypeTable } from 'fumadocs-typescript/ui';
import { typeGenerator } from '@/lib/type-generator';

/**
 * Auto-generated props table read from a zest source file's TypeScript
 * interface + JSDoc. `path` is relative to the docs app root.
 */
export function AutoType(props: { path: string; name: string }) {
  return <AutoTypeTable generator={typeGenerator} {...props} />;
}
