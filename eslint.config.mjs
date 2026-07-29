// @ts-check
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import next from '@next/eslint-plugin-next';

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
      // Next.js build output and fumadocs' generated source map for apps/docs.
      '**/.next/**',
      '**/.source/**',
      '**/out/**',
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
      // eslint-plugin-react-hooks v7 turns on the React Compiler's static
      // analysis. Its classic rules (`rules-of-hooks`, `exhaustive-deps`) stay
      // on; the compiler rules below are off because they flag the utility layer
      // that is a verbatim port of upstream Base UI, where each pattern is
      // deliberate and correct:
      //   refs             — `useRefWithInit`/`useControlled`/`useOnFirstRender`
      //                      read a ref during render *by design*: that is what a
      //                      lazy ref initializer is. Also flags handing a ref to
      //                      floating-ui's `arrow({ element })`, which reads it
      //                      at layout time, not during render.
      //   set-state-in-effect — `Avatar.Fallback` and `ContextMenu.Positioner`
      //                      commit a value from an effect on purpose; both are
      //                      commented at the call site.
      //   immutability     — `useStableCallback`/`useValueAsRef` assign to the
      //                      ref they just created, which is the whole mechanism.
      //   globals          — `warn`/`error` keep a module-level Set so a message
      //                      is only ever printed once per process.
      //   use-memo         — `useFilter` memoizes on `JSON.stringify(options)`,
      //                      a deliberate deep compare over an options object.
      // Revisit if the library is ever compiled with the React Compiler.
      'react-hooks/refs': 'off',
      'react-hooks/set-state-in-effect': 'off',
      'react-hooks/immutability': 'off',
      'react-hooks/globals': 'off',
      'react-hooks/use-memo': 'off',
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
    // Build/tooling config files are CommonJS running in Node, not app code.
    files: ['**/*.config.js', '**/*.config.cjs'],
    languageOptions: {
      globals: { require: 'readonly', module: 'writable', __dirname: 'readonly' },
    },
    rules: {
      '@typescript-eslint/no-require-imports': 'off',
    },
  },
  {
    // Tests reach into internals and mock freely.
    files: ['**/*.test.{ts,tsx}', '**/jest.setup.ts'],
    rules: {
      '@typescript-eslint/no-require-imports': 'off',
    },
  },
  {
    // The docs site is Next.js, not React Native — it gets Next's own rules
    // (and without the plugin registered, its `eslint-disable` directives are
    // themselves lint errors).
    files: ['apps/docs/**/*.{ts,tsx,js,jsx,mjs}'],
    plugins: {
      '@next/next': next,
    },
    rules: {
      ...next.configs.recommended.rules,
      ...next.configs['core-web-vitals'].rules,
    },
  },
);
