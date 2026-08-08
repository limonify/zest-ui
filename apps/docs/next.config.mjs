import { createMDX } from 'fumadocs-mdx/next';

const withMDX = createMDX();

/**
 * The demos on these pages are the real components, running through
 * `react-native-web`. Four things are needed for that:
 *
 * - `react-native` has to resolve to `react-native-web`, which is the whole
 *   trick — every `View`, `Pressable` and `Modal` zest imports becomes its web
 *   counterpart.
 * - `.web.js` has to win over `.js`, because that is how React Native packages
 *   ship their web variants.
 * - zest itself is consumed from source. Its `exports` map hands anything that
 *   is not Metro the compiled `lib/`, which would mean building the package
 *   before the docs; pointing at `src/` keeps the demos on whatever is checked
 *   out, and `transpilePackages` compiles the TypeScript.
 * - **Its two runtime dependencies resolve from here, not from the package.**
 *   Consuming the source means Node resolution walks up from
 *   `packages/zest-ui/src/**`, which finds that package's own `node_modules`.
 *   Two things go wrong with that. The Docker build never copies it, so the
 *   build fails outright with `Can't resolve 'react-native-gesture-handler'`;
 *   and where it *is* present it holds a different gesture-handler (the
 *   package dev-installs 3.x to test against) so the bundle would carry two
 *   copies, with the root view from one and the gestures from the other.
 *   Pinning both here makes the app the single source of truth, which is what
 *   it is for any other consumer.
 */
// Relative, not absolute: Turbopack resolves an alias value as a request from
// the project root, so an absolute path would be read as a relative one.
const appModule = (id) => `./node_modules/${id}`;

const reactNativeAliases = {
  'react-native': 'react-native-web',
  'react-native-gesture-handler': appModule('react-native-gesture-handler'),
  '@floating-ui/react-native': appModule('@floating-ui/react-native'),
  '@limonify/zest-ui': '../../packages/zest-ui/src/index.ts',
};

/** @type {import('next').NextConfig} */
const config = {
  // Off, and it has to be: react-native-web's `ModalPortal` creates its
  // container element *during render* and removes it in an unmount cleanup —
  // the exact pattern StrictMode exists to catch. Its double-mount deletes the
  // container and nothing recreates it, so every popup (Dialog, Popover, Menu,
  // Select, Combobox, Tooltip) opens its store and renders nothing. Native is
  // unaffected: there `Modal` is a real native view.
  reactStrictMode: false,
  output: 'export',
  images: { unoptimized: true },
  transpilePackages: [
    'react-native-web',
    'react-native-gesture-handler',
    '@limonify/zest-ui',
  ],
  turbopack: {
    resolveAlias: reactNativeAliases,
    resolveExtensions: [
      '.web.tsx',
      '.web.ts',
      '.web.jsx',
      '.web.js',
      '.tsx',
      '.ts',
      '.jsx',
      '.js',
      '.mjs',
      '.json',
    ],
  },
  webpack: (webpackConfig) => {
    webpackConfig.resolve.alias = {
      ...webpackConfig.resolve.alias,
      'react-native$': 'react-native-web',
    };
    webpackConfig.resolve.extensions = [
      '.web.tsx',
      '.web.ts',
      '.web.jsx',
      '.web.js',
      ...webpackConfig.resolve.extensions,
    ];
    return webpackConfig;
  },
};

export default withMDX(config);
