import { createGenerator } from 'fumadocs-typescript';

/**
 * A single ts-morph project shared by every consumer of the TypeScript
 * integration — the `<AutoType />` MDX component and the llms.txt routes —
 * so a build parses the zest sources once instead of once per caller.
 */
export const typeGenerator = createGenerator();
