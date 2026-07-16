// @ts-check
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';

export default tseslint.config(
  {
    // Build output, native projects, and dependencies are never linted.
    ignores: [
      '**/lib/**',
      '**/node_modules/**',
      '**/.expo/**',
      '**/dist/**',
      '**/build/**',
      '**/coverage/**',
      'reference/**',
    ],
  },
  {
    // The store/merge-props/utils layers are near-verbatim ports that carry
    // upstream's own `eslint-disable` comments for rules this config does not
    // run (`consistent-this`, `id-denylist`, `guard-for-in`, `prefer-template`).
    // Leave those directives in place rather than stripping them — keeping the
    // ports byte-identical to upstream matters more than a dead comment.
    linterOptions: {
      reportUnusedDisableDirectives: 'off',
    },
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    plugins: {
      'react-hooks': reactHooks,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      // The port deliberately widens some popup-trigger types to `unknown`/`any`
      // where the DOM node was the only concrete part upstream (see CLAUDE.md).
      '@typescript-eslint/no-explicit-any': 'off',
      // `namespace X { export type ... }` is the pattern every part uses to keep
      // `Component.Props`/`Component.State` next to the component, mirroring
      // upstream. It is intentional, not legacy module code.
      '@typescript-eslint/no-namespace': 'off',
      '@typescript-eslint/no-empty-object-type': 'off',
      // The store layer (`Store`/`ReactStore`/selectors) is a near-verbatim port
      // of upstream, where `Function` is the listener/selector shape and `const
      // self = this` captures the instance for subscriber callbacks.
      '@typescript-eslint/no-unsafe-function-type': 'off',
      '@typescript-eslint/no-this-alias': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          // Every part destructures `render`/`className`/`style` purely to strip
          // these web-only props off `elementProps` before spreading the rest.
          // That is the documented convention (see CLAUDE.md), not dead code.
          ignoreRestSiblings: true,
        },
      ],
    },
  },
  {
    // Tests reach into internals and mock freely.
    files: ['**/*.test.{ts,tsx}', '**/jest.setup.ts'],
    rules: {
      '@typescript-eslint/no-require-imports': 'off',
    },
  },
);
